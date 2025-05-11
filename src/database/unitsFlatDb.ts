import { db } from './database';
import { autoPopulateCustomerSchedulesFromProjectMilestones } from './unitScheduleHelpers';

export type UnitStatus = 'Available' | 'Booked' | 'Sold';

export interface UnitFlat {
  id?: number;
  flat_no: string;
  project_id: number;
  area_sqft?: number;
  rate_per_sqft?: number;
  flat_value?: number;
  received_amount?: number;
  balance_amount?: number;
  status: UnitStatus;
  type?: string;
  created_at?: number;
  updated_at?: number;
}

// Get all units/flats
export const getUnitsFlats = async (): Promise<UnitFlat[]> => {
  try {
    return await db.getAllAsync<UnitFlat>('SELECT * FROM units_flats ORDER BY flat_no ASC;');
  } catch (error) {
    console.error('Error fetching units/flats:', error);
    throw error;
  }
};

// Get a unit/flat by ID
export const getUnitFlatById = async (id: number): Promise<UnitFlat | null> => {
  try {
    return await db.getFirstAsync<UnitFlat>(
      'SELECT * FROM units_flats WHERE id = ?;',
      id
    );
  } catch (error) {
    console.error(`Error fetching unit/flat with ID ${id}:`, error);
    throw error;
  }
};

// Get units/flats by project ID
export const getUnitsFlatsByProjectId = async (projectId: number): Promise<UnitFlat[]> => {
  try {
    return await db.getAllAsync<UnitFlat>(
      'SELECT * FROM units_flats WHERE project_id = ? ORDER BY flat_no ASC;',
      projectId
    );
  } catch (error) {
    console.error(`Error fetching units/flats for project ID ${projectId}:`, error);
    throw error;
  }
};

// Calculate flat value and balance amount
const calculateDerivedValues = (unit: UnitFlat): UnitFlat => {
  const areaSqft = unit.area_sqft || 0;
  const ratePerSqft = unit.rate_per_sqft || 0;
  const receivedAmount = unit.received_amount || 0;

  // Calculate flat value (area * rate)
  const flatValue = parseFloat((areaSqft * ratePerSqft).toFixed(2));

  // Calculate balance amount (flat value - received amount)
  const balanceAmount = parseFloat((flatValue - receivedAmount).toFixed(2));

  return {
    ...unit,
    flat_value: flatValue,
    balance_amount: balanceAmount
  };
};

// Add a new unit/flat
export const addUnitFlat = async (unit: UnitFlat): Promise<number> => {
  try {
    const now = Date.now();
    const unitWithCalculations = calculateDerivedValues(unit);

    const result = await db.runAsync(
      `INSERT INTO units_flats (
        flat_no, project_id, area_sqft, rate_per_sqft, flat_value,
        received_amount, balance_amount, status, type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        unit.flat_no,
        unit.project_id,
        unitWithCalculations.area_sqft || null,
        unitWithCalculations.rate_per_sqft || null,
        unitWithCalculations.flat_value || null,
        unitWithCalculations.received_amount || 0,
        unitWithCalculations.balance_amount || null,
        unit.status,
        unit.type || null,
        now,
        now
      ]
    );

    const unitId = result.lastInsertRowId;

    // Auto-populate customer schedules from project milestones
    try {
      await autoPopulateCustomerSchedulesFromProjectMilestones(unitId, unit.project_id);
    } catch (scheduleError) {
      console.error('Error auto-populating customer schedules:', scheduleError);
      // Don't throw the error here, as the unit was successfully created
      // Just log it so we can diagnose the issue
    }

    return unitId;
  } catch (error) {
    console.error('Error adding unit/flat:', error);
    throw error;
  }
};

// Update a unit/flat
export const updateUnitFlat = async (unit: UnitFlat): Promise<void> => {
  if (!unit.id) {
    throw new Error('Unit/Flat ID is required');
  }

  try {
    // Get the current unit to check if project_id has changed
    const currentUnit = await getUnitFlatById(unit.id);
    if (!currentUnit) {
      throw new Error(`Unit/Flat with ID ${unit.id} not found`);
    }

    const projectChanged = currentUnit.project_id !== unit.project_id;

    const now = Date.now();
    const unitWithCalculations = calculateDerivedValues(unit);

    await db.runAsync(
      `UPDATE units_flats SET
        flat_no = ?,
        project_id = ?,
        area_sqft = ?,
        rate_per_sqft = ?,
        flat_value = ?,
        received_amount = ?,
        balance_amount = ?,
        status = ?,
        type = ?,
        updated_at = ?
      WHERE id = ?;`,
      [
        unit.flat_no,
        unit.project_id,
        unitWithCalculations.area_sqft || null,
        unitWithCalculations.rate_per_sqft || null,
        unitWithCalculations.flat_value || null,
        unitWithCalculations.received_amount || 0,
        unitWithCalculations.balance_amount || null,
        unit.status,
        unit.type || null,
        now,
        unit.id
      ]
    );

    // If project has changed, check if we need to auto-populate customer schedules
    if (projectChanged) {
      try {
        // Get existing customer schedules
        const existingSchedules = await db.getAllAsync(
          'SELECT COUNT(*) as count FROM unit_customer_schedules WHERE unit_id = ?;',
          [unit.id]
        );

        const hasSchedules = existingSchedules[0]?.count > 0;

        // If no schedules exist, auto-populate from the new project
        if (!hasSchedules) {
          await autoPopulateCustomerSchedulesFromProjectMilestones(unit.id, unit.project_id);
        }
      } catch (scheduleError) {
        console.error('Error checking/auto-populating customer schedules after project change:', scheduleError);
        // Don't throw the error here, as the unit was successfully updated
      }
    }
  } catch (error) {
    console.error(`Error updating unit/flat with ID ${unit.id}:`, error);
    throw error;
  }
};

// Delete a unit/flat
export const deleteUnitFlat = async (id: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM units_flats WHERE id = ?;', id);
  } catch (error) {
    console.error(`Error deleting unit/flat with ID ${id}:`, error);
    throw error;
  }
};

// Update received amount and recalculate balance
export const updateUnitFlatReceivedAmount = async (unitId: number, newReceivedAmount: number): Promise<void> => {
  try {
    const unit = await getUnitFlatById(unitId);
    if (!unit) {
      throw new Error(`Unit/Flat with ID ${unitId} not found`);
    }

    unit.received_amount = newReceivedAmount;
    await updateUnitFlat(calculateDerivedValues(unit));
  } catch (error) {
    console.error(`Error updating received amount for unit/flat with ID ${unitId}:`, error);
    throw error;
  }
};
