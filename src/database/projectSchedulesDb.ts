import { db } from './database';
import { getProjectById, updateProject } from './projectsDb';

export type MilestoneStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface Milestone {
  id?: number;
  schedule_id: number;
  sr_no: number;
  milestone_name: string;
  completion_percentage: number;
  status: MilestoneStatus;
  created_at?: number;
  updated_at?: number;
}

export interface ProjectSchedule {
  id?: number;
  date: number; // timestamp
  project_id: number;
  created_at?: number;
  updated_at?: number;
}

// Get all project schedules
export const getProjectSchedules = async (): Promise<ProjectSchedule[]> => {
  try {
    return await db.getAllAsync<ProjectSchedule>('SELECT * FROM project_schedules ORDER BY date DESC;');
  } catch (error) {
    console.error('Error fetching project schedules:', error);
    throw error;
  }
};

// Get project schedule by ID
export const getProjectScheduleById = async (id: number): Promise<ProjectSchedule | null> => {
  try {
    const schedules = await db.getAllAsync<ProjectSchedule>(
      'SELECT * FROM project_schedules WHERE id = ?;',
      [id]
    );
    return schedules.length > 0 ? schedules[0] : null;
  } catch (error) {
    console.error('Error fetching project schedule by ID:', error);
    throw error;
  }
};

// Get project schedules by project ID
export const getProjectSchedulesByProjectId = async (projectId: number): Promise<ProjectSchedule[]> => {
  try {
    return await db.getAllAsync<ProjectSchedule>(
      'SELECT * FROM project_schedules WHERE project_id = ? ORDER BY date DESC;',
      [projectId]
    );
  } catch (error) {
    console.error('Error fetching project schedules by project ID:', error);
    throw error;
  }
};

// Add a new project schedule
export const addProjectSchedule = async (schedule: ProjectSchedule): Promise<number> => {
  try {
    const now = Date.now();

    const result = await db.runAsync(
      `INSERT INTO project_schedules (date, project_id, created_at, updated_at)
       VALUES (?, ?, ?, ?);`,
      [
        schedule.date,
        schedule.project_id,
        now,
        now
      ]
    );

    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding project schedule:', error);
    throw error;
  }
};

// Update a project schedule
export const updateProjectSchedule = async (schedule: ProjectSchedule): Promise<void> => {
  if (!schedule.id) {
    throw new Error('Project Schedule ID is required');
  }

  try {
    const now = Date.now();

    await db.runAsync(
      `UPDATE project_schedules
       SET date = ?, project_id = ?, updated_at = ?
       WHERE id = ?;`,
      [
        schedule.date,
        schedule.project_id,
        now,
        schedule.id
      ]
    );
  } catch (error) {
    console.error('Error updating project schedule:', error);
    throw error;
  }
};

// Delete a project schedule
export const deleteProjectSchedule = async (id: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM project_schedules WHERE id = ?;', id);
  } catch (error) {
    console.error('Error deleting project schedule:', error);
    throw error;
  }
};

// Get milestones by schedule ID
export const getMilestonesByScheduleId = async (scheduleId: number): Promise<Milestone[]> => {
  try {
    return await db.getAllAsync<Milestone>(
      'SELECT * FROM milestones WHERE schedule_id = ? ORDER BY sr_no ASC;',
      [scheduleId]
    );
  } catch (error) {
    console.error('Error fetching milestones by schedule ID:', error);
    throw error;
  }
};

// Add a new milestone
export const addMilestone = async (milestone: Milestone): Promise<number> => {
  try {
    const now = Date.now();

    const result = await db.runAsync(
      `INSERT INTO milestones (schedule_id, sr_no, milestone_name, completion_percentage, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        milestone.schedule_id,
        milestone.sr_no,
        milestone.milestone_name,
        milestone.completion_percentage,
        milestone.status,
        now,
        now
      ]
    );

    // Get the schedule to find the project_id
    const schedules = await db.getAllAsync<ProjectSchedule>(
      'SELECT * FROM project_schedules WHERE id = ?;',
      [milestone.schedule_id]
    );

    if (schedules.length > 0) {
      // Update the project progress
      await updateProjectProgress(schedules[0].project_id);
    }

    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding milestone:', error);
    throw error;
  }
};

// Add a project schedule with milestones
export const addProjectScheduleWithMilestones = async (
  projectId: number,
  date: number,
  milestones: Omit<Milestone, 'schedule_id'>[]
): Promise<number> => {
  try {
    // Use a transaction to ensure all operations succeed or fail together
    let scheduleId: number = 0;

    await db.withTransactionAsync(async () => {
      const now = Date.now();

      // Add the project schedule
      const scheduleResult = await db.runAsync(
        `INSERT INTO project_schedules (date, project_id, created_at, updated_at)
         VALUES (?, ?, ?, ?);`,
        [date, projectId, now, now]
      );

      scheduleId = scheduleResult.lastInsertRowId;

      // Add each milestone
      for (const milestone of milestones) {
        await db.runAsync(
          `INSERT INTO milestones (schedule_id, sr_no, milestone_name, completion_percentage, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            scheduleId,
            milestone.sr_no,
            milestone.milestone_name,
            milestone.completion_percentage,
            milestone.status,
            now,
            now
          ]
        );
      }
    });

    // Update project progress after adding milestones
    await updateProjectProgress(projectId);

    return scheduleId;
  } catch (error) {
    console.error('Error adding project schedule with milestones:', error);
    throw error;
  }
};

// Update a milestone
export const updateMilestone = async (milestone: Milestone): Promise<void> => {
  if (!milestone.id) {
    throw new Error('Milestone ID is required');
  }

  try {
    const now = Date.now();

    // Get the current milestone to check if status has changed
    const currentMilestones = await db.getAllAsync<Milestone>(
      'SELECT * FROM milestones WHERE id = ?;',
      [milestone.id]
    );

    if (currentMilestones.length === 0) {
      throw new Error(`Milestone with ID ${milestone.id} not found`);
    }

    // Update the milestone
    await db.runAsync(
      `UPDATE milestones
       SET sr_no = ?, milestone_name = ?, completion_percentage = ?, status = ?, updated_at = ?
       WHERE id = ?;`,
      [
        milestone.sr_no,
        milestone.milestone_name,
        milestone.completion_percentage,
        milestone.status,
        now,
        milestone.id
      ]
    );

    // Get the schedule to find the project_id
    const schedules = await db.getAllAsync<ProjectSchedule>(
      'SELECT * FROM project_schedules WHERE id = ?;',
      [milestone.schedule_id]
    );

    if (schedules.length > 0) {
      // Update the project progress
      await updateProjectProgress(schedules[0].project_id);
    }
  } catch (error) {
    console.error('Error updating milestone:', error);
    throw error;
  }
};

// Delete a milestone
export const deleteMilestone = async (id: number): Promise<void> => {
  try {
    // Get the milestone to find its schedule_id
    const milestones = await db.getAllAsync<Milestone>(
      'SELECT * FROM milestones WHERE id = ?;',
      [id]
    );

    if (milestones.length > 0) {
      const milestone = milestones[0];

      // Delete the milestone
      await db.runAsync('DELETE FROM milestones WHERE id = ?;', id);

      // Get the schedule to find the project_id
      const schedules = await db.getAllAsync<ProjectSchedule>(
        'SELECT * FROM project_schedules WHERE id = ?;',
        [milestone.schedule_id]
      );

      if (schedules.length > 0) {
        // Update the project progress
        await updateProjectProgress(schedules[0].project_id);
      }
    } else {
      await db.runAsync('DELETE FROM milestones WHERE id = ?;', id);
    }
  } catch (error) {
    console.error('Error deleting milestone:', error);
    throw error;
  }
};

// Get all milestones for a project
export const getMilestonesByProjectId = async (projectId: number): Promise<Milestone[]> => {
  try {
    return await db.getAllAsync<Milestone>(
      `SELECT m.*
       FROM milestones m
       JOIN project_schedules ps ON m.schedule_id = ps.id
       WHERE ps.project_id = ?
       ORDER BY m.sr_no ASC;`,
      [projectId]
    );
  } catch (error) {
    console.error('Error fetching milestones by project ID:', error);
    throw error;
  }
};

// Calculate and update project progress based on completed milestones
export const updateProjectProgress = async (projectId: number): Promise<void> => {
  try {
    // Get the project
    const project = await getProjectById(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    // Get all milestones for the project
    const milestones = await getMilestonesByProjectId(projectId);

    // Calculate progress based on completed milestones
    let progress = 0;
    if (milestones.length > 0) {
      const completedMilestones = milestones.filter(m => m.status === 'Completed');
      progress = Math.round((completedMilestones.length / milestones.length) * 100);
    }

    // Update the project progress
    await updateProject({
      ...project,
      progress
    });
  } catch (error) {
    console.error('Error updating project progress:', error);
    throw error;
  }
};
