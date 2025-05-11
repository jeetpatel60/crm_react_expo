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

    const currentMilestone = currentMilestones[0];
    const statusChanged = currentMilestone.status !== milestone.status;
    const changingToCompleted = milestone.status === 'Completed' && currentMilestone.status !== 'Completed';

    console.log(`Milestone status changed: ${statusChanged}, from ${currentMilestone.status} to ${milestone.status}`);
    if (changingToCompleted) {
      console.log('IMPORTANT: Milestone is being marked as Completed - this should update project progress');
    }

    // Get the schedule to find the project_id before the transaction
    const schedules = await db.getAllAsync<ProjectSchedule>(
      'SELECT * FROM project_schedules WHERE id = ?;',
      [milestone.schedule_id]
    );

    if (schedules.length === 0) {
      throw new Error(`Schedule with ID ${milestone.schedule_id} not found`);
    }

    const projectId = schedules[0].project_id;
    console.log(`Found schedule with project_id: ${projectId}`);

    // Use a transaction to ensure all operations succeed or fail together
    await db.withTransactionAsync(async () => {
      // Update the milestone
      console.log('Updating milestone in DB:', milestone);
      const updateResult = await db.runAsync(
        `UPDATE milestones
         SET sr_no = ?, milestone_name = ?, completion_percentage = ?, status = ?, schedule_id = ?, updated_at = ?
         WHERE id = ?;`,
        [
          milestone.sr_no,
          milestone.milestone_name,
          milestone.completion_percentage,
          milestone.status,
          milestone.schedule_id,
          now,
          milestone.id
        ]
      );

      console.log(`Milestone update result: ${updateResult.changes} row(s) affected`);

      if (updateResult.changes === 0) {
        throw new Error(`Failed to update milestone: no rows affected`);
      }
    });

    console.log('Milestone update transaction completed successfully');

    // After transaction completes, verify the milestone update
    const updatedMilestone = await db.getAllAsync<Milestone>(
      'SELECT * FROM milestones WHERE id = ?;',
      [milestone.id]
    );

    if (updatedMilestone.length > 0) {
      console.log(`Verified milestone update: ${updatedMilestone[0].milestone_name}, Status: ${updatedMilestone[0].status}`);
    }

    // Always update project progress when a milestone is updated
    console.log('Updating project progress after milestone update...');
    try {
      // Get the project before update
      const projectBefore = await getProjectById(projectId);
      console.log(`Project before progress update: ${projectBefore?.name}, Progress: ${projectBefore?.progress}%`);

      // Update the project progress
      await updateProjectProgress(projectId);

      // Get the project after update to verify
      const projectAfter = await getProjectById(projectId);
      console.log(`Project after progress update: ${projectAfter?.name}, Progress: ${projectAfter?.progress}%`);

      // If changing to Completed, double-check that progress was updated
      if (changingToCompleted) {
        console.log('Milestone was marked as Completed - verifying project progress was updated');

        // Direct SQL query to get the current progress for absolute verification
        const projectProgress = await db.getFirstAsync<{ progress: number }>(
          'SELECT progress FROM projects WHERE id = ?;',
          [projectId]
        );

        console.log(`Direct SQL verification: Project progress is now ${projectProgress?.progress}%`);

        // Log if there's a discrepancy
        if (projectProgress?.progress !== projectAfter?.progress) {
          console.error(`DISCREPANCY DETECTED: SQL query shows ${projectProgress?.progress}% but getProjectById shows ${projectAfter?.progress}%`);
        }
      }
    } catch (progressError) {
      console.error('Error updating project progress:', progressError);
      // Don't throw the error here, as the milestone update was successful
      // Just log it so we can diagnose the issue
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
    console.log(`Starting updateProjectProgress for project ID: ${projectId}`);

    // Get the project
    const project = await getProjectById(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    console.log(`Found project: ${project.name}, current progress: ${project.progress}%`);

    // Get all milestones for the project using a direct SQL query
    const milestones = await db.getAllAsync<Milestone>(
      `SELECT m.*
       FROM milestones m
       JOIN project_schedules ps ON m.schedule_id = ps.id
       WHERE ps.project_id = ?
       ORDER BY m.sr_no ASC;`,
      [projectId]
    );
    console.log(`Found ${milestones.length} milestones for project`);

    // Calculate progress based on completed milestones
    let progress = 0;
    if (milestones.length > 0) {
      // Count completed milestones using direct SQL for accuracy
      const completedMilestonesResult = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM milestones m
         JOIN project_schedules ps ON m.schedule_id = ps.id
         WHERE ps.project_id = ? AND m.status = 'Completed';`,
        [projectId]
      );

      const completedMilestonesCount = completedMilestonesResult?.count || 0;
      console.log(`SQL query found ${completedMilestonesCount} completed milestones out of ${milestones.length}`);

      // Log all milestone statuses for debugging
      console.log('Milestone status breakdown:');
      let notStartedCount = 0;
      let inProgressCount = 0;
      let completedCount = 0;

      milestones.forEach((m, index) => {
        console.log(`Milestone ${index + 1}: ${m.milestone_name}, Status: ${m.status}`);

        if (m.status === 'Not Started') notStartedCount++;
        else if (m.status === 'In Progress') inProgressCount++;
        else if (m.status === 'Completed') completedCount++;
      });

      console.log(`Status summary: Not Started: ${notStartedCount}, In Progress: ${inProgressCount}, Completed: ${completedCount}`);

      // Calculate progress as percentage of completed milestones
      progress = Math.round((completedMilestonesCount / milestones.length) * 100);
      console.log(`Calculated new progress: ${progress}% (${completedMilestonesCount} completed out of ${milestones.length} total)`);
    }

    // Update the project progress directly with SQL
    console.log(`Directly updating project with new progress: ${progress}%`);
    const now = Date.now();

    // Use a transaction to ensure the update is atomic
    await db.withTransactionAsync(async () => {
      // First, verify the project exists
      const projectExists = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM projects WHERE id = ?;`,
        [projectId]
      );

      if (!projectExists || projectExists.count === 0) {
        throw new Error(`Project with ID ${projectId} not found in database`);
      }

      console.log(`Project exists check: Found ${projectExists.count} project(s) with ID ${projectId}`);

      // Update the project progress
      const result = await db.runAsync(
        `UPDATE projects
         SET progress = ?, updated_at = ?
         WHERE id = ?;`,
        [progress, now, projectId]
      );

      console.log(`SQL update result: ${result.changes} row(s) affected`);

      if (result.changes === 0) {
        throw new Error(`Failed to update project progress: no rows affected`);
      }

      // Immediately verify within the transaction
      const immediateVerify = await db.getFirstAsync<{ progress: number }>(
        `SELECT progress FROM projects WHERE id = ?;`,
        [projectId]
      );

      console.log(`Immediate verification within transaction: Progress is now ${immediateVerify?.progress}%`);
    });

    // Verify the update with a direct SQL query outside the transaction
    const verifiedProject = await db.getFirstAsync<{ progress: number }>(
      `SELECT progress FROM projects WHERE id = ?;`,
      [projectId]
    );

    console.log(`SQL verification after transaction: Project progress is now ${verifiedProject?.progress}%`);

    // Double-check with the regular getProjectById function
    const doubleCheckProject = await getProjectById(projectId);
    console.log(`Double-check verification with getProjectById: Project progress is ${doubleCheckProject?.progress}%`);

    // Final verification - direct SQL with no caching
    const finalVerify = await db.getAllAsync<{ id: number, name: string, progress: number }>(
      `SELECT id, name, progress FROM projects WHERE id = ? LIMIT 1;`,
      [projectId]
    );

    if (finalVerify.length > 0) {
      console.log(`Final SQL verification: Project ${finalVerify[0].name} (ID: ${finalVerify[0].id}) progress is ${finalVerify[0].progress}%`);
    } else {
      console.error(`Final verification failed: No project found with ID ${projectId}`);
    }

  } catch (error) {
    console.error('Error updating project progress:', error);
    throw error;
  }
};
