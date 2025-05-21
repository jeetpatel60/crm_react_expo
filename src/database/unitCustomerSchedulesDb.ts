import { db } from './database';
import { calculateScheduleAmount } from './unitScheduleHelpers';
import { getMilestonesByProjectId, Milestone } from './projectSchedulesDb';
import { UnitFlat } from './unitsFlatDb'; // Import UnitFlat

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
      [unitId]
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
      [id]
    );
  } catch (error) {
    console.error(`Error fetching customer schedule with ID ${id}:`, error);
    throw error;
  }
};

// Calculate amount by dividing balance amount by number of rows in customer schedule table
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
        scheduleWithAmount.amount as number | null, // Explicitly cast to number | null
        schedule.status,
        now,
        now
      ]
    );

    // After adding a new schedule, recalculate amounts for all schedules
    // This ensures all schedules have the correct amount based on the new total count
    await recalculateUnitScheduleAmounts(schedule.unit_id);

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
        scheduleWithAmount.amount as number | null, // Explicitly cast to number | null
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
    // Get the unit_id before deleting the schedule
    const schedule = await getUnitCustomerScheduleById(id);
    const unitId = schedule?.unit_id;

    // Delete the schedule
    await db.runAsync('DELETE FROM unit_customer_schedules WHERE id = ?;', [id]);

    // If we have a valid unitId, recalculate amounts for all remaining schedules
    if (unitId) {
      await recalculateUnitScheduleAmounts(unitId);
    }
  } catch (error) {
    console.error(`Error deleting customer schedule with ID ${id}:`, error);
    throw error;
  }
};

// Recalculate amounts for all schedules of a unit
export const recalculateUnitScheduleAmounts = async (unitId: number): Promise<void> => {
  try {
    // Get unit balance amount
    const unit = await db.getFirstAsync<UnitFlat>( // Explicitly type unit
      'SELECT balance_amount FROM units_flats WHERE id = ?;',
      [unitId]
    );

    if (!unit || unit.balance_amount === undefined || unit.balance_amount === null) {
      console.log(`No balance amount found for unit ID ${unitId} or it's null/undefined. Cannot recalculate schedule amounts.`);
      return;
    }

    // Get all schedules for this unit, including completion_percentage
    const schedules = await db.getAllAsync<UnitCustomerSchedule>(
      'SELECT * FROM unit_customer_schedules WHERE unit_id = ? ORDER BY sr_no ASC;',
      [unitId]
    );

    if (schedules.length === 0) {
      console.log(`No schedules found for unit ID ${unitId}`);
      return;
    }

    const now = Date.now();

    // Update all schedules based on their completion percentage and the unit's balance amount
    for (const schedule of schedules) {
      if (schedule.id === undefined) {
        console.warn('Skipping schedule update due to undefined schedule.id:', schedule);
        continue;
      }
      const calculatedAmount = (unit.balance_amount * schedule.completion_percentage) / 100;
      const amountToUpdate = parseFloat(calculatedAmount.toFixed(2));

      await db.runAsync(
        `UPDATE unit_customer_schedules SET
          amount = ?,
          updated_at = ?
        WHERE id = ?;`,
        [
          amountToUpdate,
          now,
          schedule.id
        ]
      );
    }

    console.log(`Successfully recalculated amounts for ${schedules.length} schedules of unit ID ${unitId}`);
  } catch (error) {
    console.error(`Error recalculating schedule amounts for unit ID ${unitId}:`, error);
    throw error;
  }
};

// Re-export the auto-populate function from the helper module
export { autoPopulateCustomerSchedulesFromProjectMilestones } from './unitScheduleHelpers';
