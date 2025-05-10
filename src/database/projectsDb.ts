import { db } from './database';

export type ProjectStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface Project {
  id?: number;
  name: string;
  address?: string;
  start_date?: number; // timestamp
  end_date?: number; // timestamp
  progress?: number; // percentage (0-100)
  total_budget?: number; // decimal
  status: ProjectStatus;
  created_at?: number;
  updated_at?: number;
}

// Get all projects
export const getProjects = async (): Promise<Project[]> => {
  try {
    return await db.getAllAsync<Project>('SELECT * FROM projects ORDER BY name ASC;');
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

// Get a project by ID
export const getProjectById = async (id: number): Promise<Project | null> => {
  try {
    const projects = await db.getAllAsync<Project>(
      'SELECT * FROM projects WHERE id = ?;',
      [id]
    );
    return projects.length > 0 ? projects[0] : null;
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    throw error;
  }
};

// Add a new project
export const addProject = async (project: Project): Promise<number> => {
  try {
    const now = Date.now();

    const result = await db.runAsync(
      `INSERT INTO projects (name, address, start_date, end_date, progress, total_budget, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        project.name,
        project.address || null,
        project.start_date || null,
        project.end_date || null,
        project.progress || 0,
        project.total_budget || null,
        project.status,
        now,
        now
      ]
    );

    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding project:', error);
    throw error;
  }
};

// Update a project
export const updateProject = async (project: Project): Promise<void> => {
  if (!project.id) {
    throw new Error('Project ID is required');
  }

  try {
    const now = Date.now();

    await db.runAsync(
      `UPDATE projects
       SET name = ?, address = ?, start_date = ?, end_date = ?, progress = ?, total_budget = ?, status = ?, updated_at = ?
       WHERE id = ?;`,
      [
        project.name,
        project.address || null,
        project.start_date || null,
        project.end_date || null,
        project.progress || 0,
        project.total_budget || null,
        project.status,
        now,
        project.id
      ]
    );
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// Delete a project
export const deleteProject = async (id: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM projects WHERE id = ?;', id);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};
