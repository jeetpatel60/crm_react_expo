import { db } from './database';
import { calculateScheduleAmount } from './unitScheduleHelpers';
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
    const amount = await calculateScheduleAmount(schedule);

    return {
      ...schedule,
      amount: amount || undefined
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

// Re-export the auto-populate function from the helper module
export { autoPopulateCustomerSchedulesFromProjectMilestones } from './unitScheduleHelpers';
