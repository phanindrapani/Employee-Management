import WorksheetEntry from '../../models/worksheetEntry.model.js';

export const computeAnalysis = async (employeeId, fromDate, toDate) => {
    const query = {
        employee: employeeId,
        date: { $gte: fromDate, $lte: toDate }
    };

    const entries = await WorksheetEntry.find(query).lean();

    if (entries.length === 0) {
        return {
            totalHours: 0,
            productiveHours: 0,
            nonProductiveHours: 0,
            tasksCompleted: 0,
            completionRatio: 0,
            avgTaskDuration: 0,
            topProjects: [],
            topCategories: [],
            trend: []
        };
    }

    const totalMinutes = entries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
    const totalHours = +(totalMinutes / 60).toFixed(2);

    const productiveCategories = ['development', 'design', 'testing', 'documentation', 'research'];
    const productiveMinutes = entries
        .filter(e => productiveCategories.includes(e.category))
        .reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
    const productiveHours = +(productiveMinutes / 60).toFixed(2);
    const nonProductiveHours = +(totalHours - productiveHours).toFixed(2);

    const tasksCompleted = entries.filter(e => e.status === 'completed').length;
    const completionRatio = entries.length > 0
        ? +((tasksCompleted / entries.length) * 100).toFixed(1)
        : 0;
    const avgTaskDuration = entries.length > 0
        ? +(totalMinutes / entries.length).toFixed(1)
        : 0;

    // Top projects
    const projectMap = {};
    entries.forEach(e => {
        const p = e.project || 'Unassigned';
        if (!projectMap[p]) projectMap[p] = { name: p, hours: 0, tasks: 0 };
        projectMap[p].hours += e.durationMinutes / 60;
        projectMap[p].tasks += 1;
    });
    const topProjects = Object.values(projectMap)
        .map(p => ({ ...p, hours: +p.hours.toFixed(2) }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 5);

    // Top categories
    const catMap = {};
    entries.forEach(e => {
        const c = e.category || 'other';
        if (!catMap[c]) catMap[c] = { name: c, hours: 0, tasks: 0 };
        catMap[c].hours += e.durationMinutes / 60;
        catMap[c].tasks += 1;
    });
    const topCategories = Object.values(catMap)
        .map(c => ({ ...c, hours: +c.hours.toFixed(2) }))
        .sort((a, b) => b.hours - a.hours);

    // Daily trend
    const trendMap = {};
    entries.forEach(e => {
        if (!trendMap[e.date]) trendMap[e.date] = { date: e.date, hours: 0, tasks: 0 };
        trendMap[e.date].hours += e.durationMinutes / 60;
        trendMap[e.date].tasks += 1;
    });
    const trend = Object.values(trendMap)
        .map(d => ({ ...d, hours: +d.hours.toFixed(2) }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        totalHours,
        productiveHours,
        nonProductiveHours,
        tasksCompleted,
        completionRatio,
        avgTaskDuration,
        topProjects,
        topCategories,
        trend
    };
};

export const computeTeamAnalysis = async (employeeIds, fromDate, toDate) => {
    const query = {
        employee: { $in: employeeIds },
        date: { $gte: fromDate, $lte: toDate }
    };

    const entries = await WorksheetEntry.find(query).lean();

    if (entries.length === 0) {
        return {
            totalHours: 0,
            productiveHours: 0,
            nonProductiveHours: 0,
            tasksCompleted: 0,
            completionRatio: 0,
            avgTaskDuration: 0,
            topProjects: [],
            topCategories: [],
            trend: []
        };
    }

    const totalMinutes = entries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
    const totalHours = +(totalMinutes / 60).toFixed(2);

    const productiveCategories = ['development', 'design', 'testing', 'documentation', 'research'];
    const productiveMinutes = entries
        .filter(e => productiveCategories.includes(e.category))
        .reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
    const productiveHours = +(productiveMinutes / 60).toFixed(2);
    const nonProductiveHours = +(totalHours - productiveHours).toFixed(2);

    const tasksCompleted = entries.filter(e => e.status === 'completed').length;
    const completionRatio = entries.length > 0
        ? +((tasksCompleted / entries.length) * 100).toFixed(1)
        : 0;
    const avgTaskDuration = entries.length > 0
        ? +(totalMinutes / entries.length).toFixed(1)
        : 0;

    // Top projects
    const projectMap = {};
    entries.forEach(e => {
        const p = e.project || 'Unassigned';
        if (!projectMap[p]) projectMap[p] = { name: p, hours: 0, tasks: 0 };
        projectMap[p].hours += e.durationMinutes / 60;
        projectMap[p].tasks += 1;
    });
    const topProjects = Object.values(projectMap)
        .map(p => ({ ...p, hours: +p.hours.toFixed(2) }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 5);

    // Top categories
    const catMap = {};
    entries.forEach(e => {
        const c = e.category || 'other';
        if (!catMap[c]) catMap[c] = { name: c, hours: 0, tasks: 0 };
        catMap[c].hours += e.durationMinutes / 60;
        catMap[c].tasks += 1;
    });
    const topCategories = Object.values(catMap)
        .map(c => ({ ...c, hours: +c.hours.toFixed(2) }))
        .sort((a, b) => b.hours - a.hours);

    // Daily trend
    const trendMap = {};
    entries.forEach(e => {
        if (!trendMap[e.date]) trendMap[e.date] = { date: e.date, hours: 0, tasks: 0 };
        trendMap[e.date].hours += e.durationMinutes / 60;
        trendMap[e.date].tasks += 1;
    });
    const trend = Object.values(trendMap)
        .map(d => ({ ...d, hours: +d.hours.toFixed(2) }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        totalHours,
        productiveHours,
        nonProductiveHours,
        tasksCompleted,
        completionRatio,
        avgTaskDuration,
        topProjects,
        topCategories,
        trend
    };
};