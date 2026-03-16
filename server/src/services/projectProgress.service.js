import Project from '../models/project.model.js';
import Task from '../models/task.model.js';
import ProjectProgressHistory from '../models/projectProgressHistory.model.js';
import mongoose from 'mongoose';


export const syncProjectProgress = async (projectId, userId, session = null) => {
    const project = await Project.findById(projectId).session(session);
    if (!project) return;

    if (project.progressMode === 'manual') return;

    const tasks = await Task.find({ project: projectId }).session(session);
    if (tasks.length === 0) {
        await updateProgress(project, 0, 'auto', userId, session);
        return;
    }

    const totalWeight = tasks.reduce((sum, task) => sum + (task.weight || 1), 0);
    const completedWeight = tasks
        .filter(task => task.status === 'done')
        .reduce((sum, task) => sum + (task.weight || 1), 0);

    const newProgress = Math.round((completedWeight / totalWeight) * 100);

    if (project.progress !== newProgress) {
        await updateProgress(project, newProgress, 'auto', userId, session);
    }
};

export const syncMilestoneProgress = async (milestoneId) => {
    try {
        const Milestone = mongoose.model('Milestone');
        const Task = mongoose.model('Task');

        const milestone = await Milestone.findById(milestoneId);
        if (!milestone) return;

        const tasks = await Task.find({ milestoneId });
        if (tasks.length === 0) {
            milestone.progress = 0;
            await milestone.save();
            return;
        }

        const totalWeight = tasks.reduce((sum, task) => sum + (task.weight || 1), 0);
        const completedWeight = tasks
            .filter(task => task.status === 'done')
            .reduce((sum, task) => sum + (task.weight || 1), 0);

        const newProgress = Math.round((completedWeight / totalWeight) * 100);

        if (milestone.progress !== newProgress) {
            milestone.progress = newProgress;
            if (newProgress === 100) {
                milestone.status = 'completed';
                milestone.completedAt = new Date();
                
                // Trigger manager performance recalculation
                setImmediate(async () => {
                    try {
                        const Project = mongoose.model('Project');
                        const project = await Project.findById(milestone.projectId);
                        if (project && project.managerId) {
                            const now = new Date();
                            const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                            const { recalculatePerformanceForUser } = await import('../controllers/admin/performance.controller.js');
                            await recalculatePerformanceForUser(project.managerId, period);
                        }
                    } catch (err) {
                        console.error('Error triggering manager performance sync:', err.message);
                    }
                });
            } else {
                if (newProgress > 0) {
                    milestone.status = 'in-progress';
                } else {
                    milestone.status = 'pending';
                }
                milestone.completedAt = null;
            }
            await milestone.save();
        }
    } catch (error) {
        console.error('Error syncing milestone progress:', error);
    }
};

const updateProgress = async (project, newProgress, mode, userId, session) => {
    const oldProgress = project.progress;

    project.progress = newProgress;
    project.progressMode = mode;
    project.lastCalculatedAt = new Date();
    project.lastUpdatedBy = userId;

    await project.save({ session });

    await ProjectProgressHistory.create([{
        project: project._id,
        oldProgress,
        newProgress,
        mode,
        changedBy: userId,
        changedAt: new Date()
    }], { session });
};

export const overrideProjectProgress = async (projectId, progress, userId, session = null) => {
    const project = await Project.findById(projectId).session(session);
    if (!project) throw new Error('Project not found');

    await updateProgress(project, progress, 'manual', userId, session);
};

export const setProgressMode = async (projectId, mode, userId, session = null) => {
    const project = await Project.findById(projectId).session(session);
    if (!project) throw new Error('Project not found');

    if (mode === 'auto') {
        project.progressMode = 'auto';
        await syncProjectProgress(projectId, userId, session);
    } else {
        await updateProgress(project, project.progress, 'manual', userId, session);
    }
};
