import { db } from './database';
import { UnitCustomerSchedule, UnitCustomerScheduleStatus } from './unitCustomerSchedulesDb';
import { UnitPaymentRequest } from './unitPaymentRequestsDb';
import { getUnitsFlatsByProjectId, UnitFlat } from './unitsFlatDb';
import { Milestone } from './projectSchedulesDb'; // Import Milestone interface

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
    let milestones: Milestone[] = []; // Explicitly type milestones
    try {
      milestones = await db.getAllAsync<Milestone>( // Explicitly type getAllAsync result
        'SELECT * FROM project_milestones WHERE project_schedule_id IN (SELECT id FROM project_schedules WHERE project_id = ?) ORDER BY sr_no ASC;',
        [projectId]
      );

      // If no milestones found in project_milestones, try the milestones table
      if (milestones.length === 0) {
        milestones = await db.getAllAsync<Milestone>( // Explicitly type getAllAsync result
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
    const existingSchedules = await db.getFirstAsync<{ count: number }>( // Explicitly type result
      'SELECT COUNT(*) as count FROM unit_customer_schedules WHERE unit_id = ?;',
      [unitId]
    );

    // If there are already schedules, don't overwrite them
    if (existingSchedules?.count && existingSchedules.count > 0) { // Safely access count
      console.log(`Unit already has ${existingSchedules.count} schedules, skipping auto-population`);
      return;
    }

    // Create customer schedules from milestones
    const now = Date.now();

    // Get unit flat value to calculate amount
    const unitFlat = await db.getFirstAsync<UnitFlat>( // Explicitly type unitFlat
      'SELECT balance_amount FROM units_flats WHERE id = ?;',
      [unitId]
    );

    const balanceAmount = unitFlat?.balance_amount || 0;

    for (const milestone of milestones) {
      const completionPercentage = milestone.completion_percentage || 0;

      // Calculate amount based on completion percentage of the unit's balance amount
      const calculatedAmount = (balanceAmount * completionPercentage) / 100;
      const amountToInsert = parseFloat(calculatedAmount.toFixed(2));

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
          amountToInsert, // Use the newly calculated amount
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
    const unit = await db.getFirstAsync<UnitFlat>( // Explicitly type unit
      'SELECT balance_amount FROM units_flats WHERE id = ?;',
      [schedule.unit_id]
    );

    if (!unit || unit.balance_amount === undefined || unit.balance_amount === null) {
      console.warn(`Unit or balance_amount not found for unit ID ${schedule.unit_id}. Cannot calculate schedule amount.`);
      return null;
    }

    // Calculate amount based on completion percentage of the unit's balance amount
    const calculatedAmount = (unit.balance_amount * schedule.completion_percentage) / 100;

    return parseFloat(calculatedAmount.toFixed(2));
  } catch (error) {
    console.error('Error calculating schedule amount:', error);
    return null;
  }
};

// Helper function to update customer schedules when a project milestone is completed
export const updateCustomerSchedulesForCompletedMilestone = async (
  projectId: number,
  milestoneName: string
): Promise<void> => {
  try {
    console.log(`Updating customer schedules for completed milestone "${milestoneName}" in project ID ${projectId}`);

    // Get all units associated with this project
    const units = await getUnitsFlatsByProjectId(projectId);

    if (units.length === 0) {
      console.log(`No units found for project ID ${projectId}`);
      return;
    }

    console.log(`Found ${units.length} units for project ID ${projectId}`);
    const now = Date.now();

    // For each unit, find the matching customer schedule and update it
    for (const unit of units) {
      if (!unit.id) continue;

      // Find the customer schedule with the matching milestone name
      const customerSchedules = await db.getAllAsync<UnitCustomerSchedule>(
        'SELECT * FROM unit_customer_schedules WHERE unit_id = ? AND milestone = ?;',
        [unit.id, milestoneName]
      );

      if (customerSchedules.length === 0) {
        console.log(`No matching customer schedule found for unit ID ${unit.id} with milestone "${milestoneName}"`);
        continue;
      }

      const customerSchedule = customerSchedules[0];

      // Skip if the schedule is already in "Payment Requested" or "Payment Received" status
      if (customerSchedule.status !== 'Not Started') {
        console.log(`Customer schedule for unit ID ${unit.id} is already in "${customerSchedule.status}" status, skipping`);
        continue;
      }

      console.log(`Updating customer schedule for unit ID ${unit.id} to "Payment Requested" status`);

      // Update the customer schedule status to "Payment Requested"
      await db.runAsync(
        `UPDATE unit_customer_schedules SET
          status = ?,
          updated_at = ?
        WHERE id = ?;`,
        [
          'Payment Requested' as UnitCustomerScheduleStatus,
          now,
          customerSchedule.id ?? null
        ]
      );

      // Create a payment request for this unit
      // First, get the next sr_no for this unit
      const paymentRequests = await db.getAllAsync<UnitPaymentRequest>(
        'SELECT * FROM unit_payment_requests WHERE unit_id = ? ORDER BY sr_no DESC LIMIT 1;',
        [unit.id]
      );

      const nextSrNo = paymentRequests.length > 0 ? paymentRequests[0].sr_no + 1 : 1;

      // Create the payment request
      await db.runAsync(
        `INSERT INTO unit_payment_requests (
          unit_id, sr_no, date, description, amount, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          unit.id,
          nextSrNo,
          now, // Current date/time
          `Payment request for ${milestoneName}`, // Description
          customerSchedule.amount ?? null, // Amount from the customer schedule, use nullish coalescing to ensure it's number or null
          now,
          now
        ]
      );

      console.log(`Created payment request for unit ID ${unit.id}, milestone "${milestoneName}", amount ${customerSchedule.amount || 0}`);
    }

    console.log(`Successfully updated customer schedules for completed milestone "${milestoneName}" in project ID ${projectId}`);
  } catch (error) {
    console.error(`Error updating customer schedules for completed milestone:`, error);
    throw error;
  }
};
