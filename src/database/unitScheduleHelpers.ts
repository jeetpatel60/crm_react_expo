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
    const milestones = await db.getAllAsync(
      'SELECT * FROM project_milestones WHERE project_schedule_id IN (SELECT id FROM project_schedules WHERE project_id = ?) ORDER BY sr_no ASC;',
      [projectId]
    );

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

    for (const milestone of milestones) {
      // Get unit flat value to calculate amount
      const unitFlat = await db.getFirstAsync(
        'SELECT balance_amount FROM units_flats WHERE id = ?;',
        [unitId]
      );

      const balanceAmount = unitFlat?.balance_amount || 0;
      const completionPercentage = milestone.completion_percentage || 0;
      const amount = parseFloat(((completionPercentage / 100) * balanceAmount).toFixed(2));

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
          amount,
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

// Calculate amount based on completion percentage and unit balance
export const calculateScheduleAmount = async (schedule: UnitCustomerSchedule): Promise<number | null> => {
  try {
    const unit = await db.getFirstAsync(
      'SELECT balance_amount FROM units_flats WHERE id = ?;',
      [schedule.unit_id]
    );
    
    if (!unit || !unit.balance_amount) {
      return null;
    }

    return parseFloat(((schedule.completion_percentage / 100) * unit.balance_amount).toFixed(2));
  } catch (error) {
    console.error('Error calculating schedule amount:', error);
    return null;
  }
};
