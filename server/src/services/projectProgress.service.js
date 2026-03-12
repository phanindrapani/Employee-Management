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
