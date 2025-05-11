import { db } from './database';
import { getUnitFlatById } from './unitsFlatDb';
import { getMilestonesByProjectId, Milestone } from './projectSchedulesDb';

export type UnitCustomerScheduleStatus = 'Not Started' | 'Payment Requested' | 'Payment Received';

export interface UnitCustomerSchedule {
  id?: number;
  unit_id: number;
  sr_no: number;
  milestone: string;
  completion_percentage: number;
  amount?: number;
  status: UnitCustomerScheduleStatus;
  created_at?: number;
  updated_at?: number;
}

// Get all customer schedules for a unit
export const getUnitCustomerSchedules = async (unitId: number): Promise<UnitCustomerSchedule[]> => {
  try {
    return await db.getAllAsync<UnitCustomerSchedule>(
      'SELECT * FROM unit_customer_schedules WHERE unit_id = ? ORDER BY sr_no ASC;',
      unitId
    );
  } catch (error) {
    console.error(`Error fetching customer schedules for unit ID ${unitId}:`, error);
    throw error;
  }
};

// Get a customer schedule by ID
export const getUnitCustomerScheduleById = async (id: number): Promise<UnitCustomerSchedule | null> => {
  try {
    return await db.getFirstAsync<UnitCustomerSchedule>(
      'SELECT * FROM unit_customer_schedules WHERE id = ?;',
      id
    );
  } catch (error) {
    console.error(`Error fetching customer schedule with ID ${id}:`, error);
    throw error;
  }
};

// Calculate amount based on completion percentage and unit balance
const calculateAmount = async (schedule: UnitCustomerSchedule): Promise<UnitCustomerSchedule> => {
  try {
    const unit = await getUnitFlatById(schedule.unit_id);
    if (!unit || !unit.balance_amount) {
      return schedule;
    }

    const amount = parseFloat(((schedule.completion_percentage / 100) * unit.balance_amount).toFixed(2));

    return {
      ...schedule,
      amount
    };
  } catch (error) {
    console.error('Error calculating schedule amount:', error);
    return schedule;
  }
};

// Add a new customer schedule
export const addUnitCustomerSchedule = async (schedule: UnitCustomerSchedule): Promise<number> => {
  try {
    const now = Date.now();
    const scheduleWithAmount = await calculateAmount(schedule);

    const result = await db.runAsync(
      `INSERT INTO unit_customer_schedules (
        unit_id, sr_no, milestone, completion_percentage,
        amount, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        schedule.unit_id,
        schedule.sr_no,
        schedule.milestone,
        schedule.completion_percentage,
        scheduleWithAmount.amount || null,
        schedule.status,
        now,
        now
      ]
    );

    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding customer schedule:', error);
    throw error;
  }
};

// Update a customer schedule
export const updateUnitCustomerSchedule = async (schedule: UnitCustomerSchedule): Promise<void> => {
  if (!schedule.id) {
    throw new Error('Customer schedule ID is required');
  }

  try {
    const now = Date.now();
    const scheduleWithAmount = await calculateAmount(schedule);

    await db.runAsync(
      `UPDATE unit_customer_schedules SET
        unit_id = ?,
        sr_no = ?,
        milestone = ?,
        completion_percentage = ?,
        amount = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?;`,
      [
        schedule.unit_id,
        schedule.sr_no,
        schedule.milestone,
        schedule.completion_percentage,
        scheduleWithAmount.amount || null,
        schedule.status,
        now,
        schedule.id
      ]
    );
  } catch (error) {
    console.error(`Error updating customer schedule with ID ${schedule.id}:`, error);
    throw error;
  }
};

// Delete a customer schedule
export const deleteUnitCustomerSchedule = async (id: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM unit_customer_schedules WHERE id = ?;', id);
  } catch (error) {
    console.error(`Error deleting customer schedule with ID ${id}:`, error);
    throw error;
  }
};

// Recalculate amounts for all schedules of a unit
export const recalculateUnitScheduleAmounts = async (unitId: number): Promise<void> => {
  try {
    const schedules = await getUnitCustomerSchedules(unitId);

    for (const schedule of schedules) {
      await updateUnitCustomerSchedule(schedule);
    }
  } catch (error) {
    console.error(`Error recalculating schedule amounts for unit ID ${unitId}:`, error);
    throw error;
  }
};

// Auto-populate customer schedules from project milestones
export const autoPopulateCustomerSchedulesFromProjectMilestones = async (
  unitId: number,
  projectId: number
): Promise<void> => {
  try {
    console.log(`Auto-populating customer schedules for unit ID ${unitId} from project ID ${projectId}`);

    // Get project milestones
    const milestones = await getMilestonesByProjectId(projectId);
    if (milestones.length === 0) {
      console.log('No milestones found for the project');
      return;
    }

    console.log(`Found ${milestones.length} milestones for the project`);

    // Get existing customer schedules for the unit
    const existingSchedules = await getUnitCustomerSchedules(unitId);

    // If there are already schedules, don't overwrite them
    if (existingSchedules.length > 0) {
      console.log(`Unit already has ${existingSchedules.length} schedules, skipping auto-population`);
      return;
    }

    // Create customer schedules from milestones
    for (const milestone of milestones) {
      const customerSchedule: UnitCustomerSchedule = {
        unit_id: unitId,
        sr_no: milestone.sr_no,
        milestone: milestone.milestone_name,
        completion_percentage: milestone.completion_percentage,
        status: 'Not Started'
      };

      await addUnitCustomerSchedule(customerSchedule);
    }

    console.log(`Successfully auto-populated ${milestones.length} customer schedules`);
  } catch (error) {
    console.error(`Error auto-populating customer schedules for unit ID ${unitId}:`, error);
    throw error;
  }
};
