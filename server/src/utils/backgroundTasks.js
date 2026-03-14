/**
 * Background Task Debouncer
 * Prevents "storms" of expensive calculations by ensuring 
 * redundant operations for the same entity are only run once 
 * in a short window.
 */

const pendingTasks = new Map();

/**
 * Executes or debounces a background task.
 * @param {string} key - Unique key for the task (e.g., 'perf:userId' or 'project:projectId')
 * @param {Function} taskFn - The actual async task to execute
 * @param {number} delayMs - Debounce window (default 2000ms)
 */
export const debounceBackgroundTask = (key, taskFn, delayMs = 2000) => {
    // If a task with this key is already scheduled, do nothing
    if (pendingTasks.has(key)) {
        return;
    }

    // Schedule the task
    const timeoutId = setTimeout(async () => {
        try {
            await taskFn();
        } catch (error) {
            console.error(`Background Task Error (${key}):`, error.message);
        } finally {
            pendingTasks.delete(key);
        }
    }, delayMs);

    pendingTasks.set(key, timeoutId);
};
