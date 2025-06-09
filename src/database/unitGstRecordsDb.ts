import { db } from './database';

export type GstStatus = 'Not Received' | 'Partially Received' | 'Received';

export interface UnitGstRecord {
  id?: number;
  unit_id: number;
  sr_no: number;
  date: number;
  description?: string;
  amount: number;
  r_amount: number;
  status: GstStatus;
  created_at?: number;
  updated_at?: number;
}

// Get all GST records for a unit
export const getUnitGstRecords = async (unitId: number): Promise<UnitGstRecord[]> => {
  try {
    return await db.getAllAsync<UnitGstRecord>(
      'SELECT * FROM unit_gst_records WHERE unit_id = ? ORDER BY sr_no ASC;',
      [unitId]
    );
  } catch (error) {
    console.error('Error fetching unit GST records:', error);
    throw error;
  }
};

// Get a specific GST record by ID
export const getUnitGstRecordById = async (id: number): Promise<UnitGstRecord | null> => {
  try {
    const result = await db.getFirstAsync<UnitGstRecord>(
      'SELECT * FROM unit_gst_records WHERE id = ?;',
      [id]
    );
    return result || null;
  } catch (error) {
    console.error('Error fetching GST record by ID:', error);
    throw error;
  }
};

// Get the next serial number for a unit's GST records
export const getNextGstSerialNumber = async (unitId: number): Promise<number> => {
  try {
    const result = await db.getFirstAsync<{ max_sr_no: number }>(
      'SELECT COALESCE(MAX(sr_no), 0) as max_sr_no FROM unit_gst_records WHERE unit_id = ?;',
      [unitId]
    );
    return (result?.max_sr_no || 0) + 1;
  } catch (error) {
    console.error('Error getting next GST serial number:', error);
    throw error;
  }
};

// Add a new GST record
export const addUnitGstRecord = async (gstRecord: UnitGstRecord): Promise<number> => {
  try {
    const now = Date.now();

    const result = await db.runAsync(
      `INSERT INTO unit_gst_records (
        unit_id, sr_no, date, description, amount, r_amount, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        gstRecord.unit_id,
        gstRecord.sr_no,
        gstRecord.date,
        gstRecord.description || null,
        gstRecord.amount,
        gstRecord.r_amount,
        gstRecord.status,
        now,
        now
      ]
    );

    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding GST record:', error);
    throw error;
  }
};

// Update an existing GST record
export const updateUnitGstRecord = async (gstRecord: UnitGstRecord): Promise<void> => {
  try {
    if (!gstRecord.id) {
      throw new Error('GST record ID is required for update');
    }

    const now = Date.now();

    await db.runAsync(
      `UPDATE unit_gst_records SET
        unit_id = ?,
        sr_no = ?,
        date = ?,
        description = ?,
        amount = ?,
        r_amount = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?;`,
      [
        gstRecord.unit_id,
        gstRecord.sr_no,
        gstRecord.date,
        gstRecord.description || null,
        gstRecord.amount,
        gstRecord.r_amount,
        gstRecord.status,
        now,
        gstRecord.id
      ]
    );
  } catch (error) {
    console.error('Error updating GST record:', error);
    throw error;
  }
};

// Delete a GST record
export const deleteUnitGstRecord = async (id: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM unit_gst_records WHERE id = ?;', [id]);
  } catch (error) {
    console.error('Error deleting GST record:', error);
    throw error;
  }
};

// Get total GST amount for a unit
export const getTotalGstAmount = async (unitId: number): Promise<number> => {
  try {
    const result = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM unit_gst_records WHERE unit_id = ?;',
      [unitId]
    );
    return result?.total || 0;
  } catch (error) {
    console.error('Error getting total GST amount:', error);
    throw error;
  }
};

// Get total received GST amount for a unit
export const getTotalReceivedGstAmount = async (unitId: number): Promise<number> => {
  try {
    const result = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(r_amount), 0) as total FROM unit_gst_records WHERE unit_id = ?;',
      [unitId]
    );
    return result?.total || 0;
  } catch (error) {
    console.error('Error getting total received GST amount:', error);
    throw error;
  }
};
