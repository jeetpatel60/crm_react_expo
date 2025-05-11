import { db } from './database';
import { UnitCustomerSchedule } from './unitCustomerSchedulesDb';

// Helper function to auto-populate customer schedules from project milestones
// This function is moved here to break the circular dependency
export const autoPopulateCustomerSchedulesFromProjectMilestones = async (
  unitId: number,
  projectId: number
): Promise<void> => {
  try {
    console.log(`Auto-populating customer schedules for unit ID ${unitId} from project ID ${projectId}`);

    // Get project milestones directly from the database
    // Try both project_milestones and milestones tables
    let milestones;
    try {
      milestones = await db.getAllAsync(
        'SELECT * FROM project_milestones WHERE project_schedule_id IN (SELECT id FROM project_schedules WHERE project_id = ?) ORDER BY sr_no ASC;',
        [projectId]
      );

      // If no milestones found in project_milestones, try the milestones table
      if (milestones.length === 0) {
        milestones = await db.getAllAsync(
          'SELECT m.id, m.sr_no, m.milestone_name, m.completion_percentage, m.status, m.created_at, m.updated_at, ps.id as project_schedule_id ' +
          'FROM milestones m ' +
          'JOIN project_schedules ps ON m.schedule_id = ps.id ' +
          'WHERE ps.project_id = ? ' +
          'ORDER BY m.sr_no ASC;',
          [projectId]
        );
      }
    } catch (error) {
      console.error('Error fetching project milestones:', error);
      milestones = [];
    }

    if (milestones.length === 0) {
      console.log('No milestones found for the project');
      return;
    }

    console.log(`Found ${milestones.length} milestones for the project`);

    // Get existing customer schedules for the unit
    const existingSchedules = await db.getAllAsync(
      'SELECT COUNT(*) as count FROM unit_customer_schedules WHERE unit_id = ?;',
      [unitId]
    );

    // If there are already schedules, don't overwrite them
    if (existingSchedules[0]?.count > 0) {
      console.log(`Unit already has ${existingSchedules[0].count} schedules, skipping auto-population`);
      return;
    }

    // Create customer schedules from milestones
    const now = Date.now();

    // Get unit flat value to calculate amount
    const unitFlat = await db.getFirstAsync(
      'SELECT balance_amount FROM units_flats WHERE id = ?;',
      [unitId]
    );

    const balanceAmount = unitFlat?.balance_amount || 0;

    // Calculate amount per schedule by dividing balance amount by number of milestones
    const amountPerSchedule = milestones.length > 0
      ? parseFloat((balanceAmount / milestones.length).toFixed(2))
      : 0;

    for (const milestone of milestones) {
      const completionPercentage = milestone.completion_percentage || 0;

      // Insert the customer schedule
      await db.runAsync(
        `INSERT INTO unit_customer_schedules (
          unit_id, sr_no, milestone, completion_percentage,
          amount, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          unitId,
          milestone.sr_no,
          milestone.milestone_name,
          completionPercentage,
          amountPerSchedule,
          'Not Started',
          now,
          now
        ]
      );
    }

    console.log(`Successfully auto-populated ${milestones.length} customer schedules for unit ID ${unitId}`);
  } catch (error) {
    console.error('Error auto-populating customer schedules:', error);
    throw error;
  }
};

// Calculate amount by dividing balance amount by number of rows in customer schedule table
export const calculateScheduleAmount = async (schedule: UnitCustomerSchedule): Promise<number | null> => {
  try {
    const unit = await db.getFirstAsync(
      'SELECT balance_amount FROM units_flats WHERE id = ?;',
      [schedule.unit_id]
    );

    if (!unit || !unit.balance_amount) {
      return null;
    }

    // Get the total number of schedules for this unit
    const schedulesCount = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM unit_customer_schedules WHERE unit_id = ?;',
      [schedule.unit_id]
    );

    const count = schedulesCount?.count || 0;

    // If there are no schedules yet (this might be the first one being added)
    // or if count is 0 for some reason, return the full balance amount
    if (count === 0) {
      return parseFloat(unit.balance_amount.toFixed(2));
    }

    // Calculate amount by dividing balance amount by number of rows
    return parseFloat((unit.balance_amount / count).toFixed(2));
  } catch (error) {
    console.error('Error calculating schedule amount:', error);
    return null;
  }
};
