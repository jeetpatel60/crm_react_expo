import { db } from './database';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id?: number;
  title: string;
  description?: string;
  due_date?: number;
  status: TaskStatus;
  contact_id?: number;
  created_at?: number;
  updated_at?: number;
}

// Get all tasks
export const getTasks = async (): Promise<Task[]> => {
  try {
    return await db.getAllAsync<Task>('SELECT * FROM tasks ORDER BY due_date ASC;');
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

// Get tasks by contact ID
export const getTasksByContactId = async (contactId: number): Promise<Task[]> => {
  try {
    return await db.getAllAsync<Task>(
      'SELECT * FROM tasks WHERE contact_id = ? ORDER BY due_date ASC;',
      contactId
    );
  } catch (error) {
    console.error('Error fetching tasks by contact:', error);
    throw error;
  }
};

// Get a task by ID
export const getTaskById = async (id: number): Promise<Task> => {
  try {
    const task = await db.getFirstAsync<Task>('SELECT * FROM tasks WHERE id = ?;', id);
    if (!task) {
      throw new Error('Task not found');
    }
    return task;
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error;
  }
};

// Add a new task
export const addTask = async (task: Task): Promise<number> => {
  try {
    const now = Date.now();

    const result = await db.runAsync(
      `INSERT INTO tasks (title, description, due_date, status, contact_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        task.title,
        task.description || null,
        task.due_date || null,
        task.status,
        task.contact_id || null,
        now,
        now
      ]
    );

    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
};

// Update a task
export const updateTask = async (task: Task): Promise<void> => {
  if (!task.id) {
    throw new Error('Task ID is required');
  }

  try {
    const now = Date.now();

    await db.runAsync(
      `UPDATE tasks
       SET title = ?, description = ?, due_date = ?, status = ?, contact_id = ?, updated_at = ?
       WHERE id = ?;`,
      [
        task.title,
        task.description || null,
        task.due_date || null,
        task.status,
        task.contact_id || null,
        now,
        task.id
      ]
    );
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

// Delete a task
export const deleteTask = async (id: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM tasks WHERE id = ?;', id);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};
