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
    console.log('Fetching all projects from database with NO CACHE...');

    // Add a timestamp to the query to ensure we're not getting cached results
    const timestamp = Date.now();
    console.log(`Query timestamp: ${timestamp}`);

    // Use a more explicit query to ensure we get fresh data
    const projects = await db.getAllAsync<Project>(
      `SELECT
        id,
        name,
        address,
        start_date,
        end_date,
        progress,
        total_budget,
        status,
        created_at,
        updated_at
      FROM projects
      ORDER BY name ASC;`
    );

    console.log(`Retrieved ${projects.length} projects from database`);

    // Log each project's progress for debugging
    projects.forEach(project => {
      console.log(`DB Project: ${project.name}, ID: ${project.id}, Progress: ${project.progress}%, Updated: ${new Date(project.updated_at || 0).toISOString()}`);
    });

    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

// Get a project by ID
export const getProjectById = async (id: number): Promise<Project | null> => {
  try {
    console.log(`Fetching project with ID: ${id}`);
    const projects = await db.getAllAsync<Project>(
      'SELECT * FROM projects WHERE id = ?;',
      [id]
    );

    if (projects.length > 0) {
      const project = projects[0];
      console.log(`Retrieved project: ${project.name}, Progress: ${project.progress}%, Status: ${project.status}`);
      return project;
    } else {
      console.log(`No project found with ID: ${id}`);
      return null;
    }
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

    // Get the current project to log the before/after progress
    const currentProject = await getProjectById(project.id);
    console.log(`BEFORE UPDATE - Project ${project.id}: ${project.name}, Progress: ${currentProject?.progress || 0}% -> ${project.progress || 0}%`);

    // Ensure progress is a number
    const progressValue = project.progress !== undefined && project.progress !== null
      ? project.progress
      : 0;

    console.log(`Updating project in database with progress: ${progressValue}%`);

    await db.runAsync(
      `UPDATE projects
       SET name = ?, address = ?, start_date = ?, end_date = ?, progress = ?, total_budget = ?, status = ?, updated_at = ?
       WHERE id = ?;`,
      [
        project.name,
        project.address || null,
        project.start_date || null,
        project.end_date || null,
        progressValue,
        project.total_budget || null,
        project.status,
        now,
        project.id
      ]
    );

    // Verify the update by fetching the project again
    const updatedProject = await getProjectById(project.id);
    console.log(`AFTER UPDATE - Project ${project.id}: ${project.name}, Progress: ${updatedProject?.progress || 0}%`);

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
