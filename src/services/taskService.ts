import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    getDocs,
} from 'firebase/firestore';
import type { Task } from '../types';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from './googleCalendarService';
import { createGoogleTask, updateGoogleTaskStatus, deleteGoogleTask, fetchGoogleTasks } from './googleTasksService';
import { addDays, addWeeks, addMonths, format, parseISO } from 'date-fns';

const COLLECTION_NAME = 'tasks';

export const subscribeToTasks = (userId: string, callback: (tasks: Task[]) => void) => {
    const q = query(
        collection(db, `users/${userId}/${COLLECTION_NAME}`),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Task[];
        callback(tasks);
    });
};

export const addTask = async (
    userId: string,
    title: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    description?: string,
    dueDate?: string,
    accessToken?: string | null,
    recurrence: 'daily' | 'weekly' | 'monthly' | 'none' = 'none',
    itemType: 'task' | 'event' = 'task'
) => {
    let googleCalendarEventId = null;
    let googleTaskId = null;

    if (accessToken) {
        if (itemType === 'event' && dueDate) {
            // Sync to Google Calendar
            googleCalendarEventId = await createCalendarEvent(accessToken, {
                title,
                description,
                dueDate
            });
        } else if (itemType === 'task') {
            // Sync to Google Tasks
            googleTaskId = await createGoogleTask(accessToken, {
                title,
                notes: description,
                due: dueDate
            });
        }
    }

    await addDoc(collection(db, `users/${userId}/${COLLECTION_NAME}`), {
        userId,
        title,
        description: description || '',
        completed: false,
        priority,
        dueDate: dueDate || null,
        createdAt: serverTimestamp(),
        itemType,
        googleCalendarEventId,
        googleTaskId,
        recurrence,
        isRecurring: recurrence !== 'none',
    });
};

export const toggleTaskCompletion = async (
    userId: string,
    task: Task,
    accessToken?: string | null
) => {
    const taskRef = doc(db, `users/${userId}/${COLLECTION_NAME}/${task.id}`);
    const newCompleted = !task.completed;

    await updateDoc(taskRef, { completed: newCompleted });

    // Sync with appropriate Google service
    if (accessToken) {
        if (task.itemType === 'event' && task.googleCalendarEventId) {
            await updateCalendarEvent(accessToken, task.googleCalendarEventId, {
                title: task.title,
                completed: newCompleted,
                dueDate: task.dueDate
            });
        } else if (task.itemType === 'task' && task.googleTaskId) {
            await updateGoogleTaskStatus(accessToken, task.googleTaskId, newCompleted);
        }
    }

    // Handle Recurring Task
    if (newCompleted && task.isRecurring && task.recurrence && task.recurrence !== 'none') {
        const nextDueDate = calculateNextDueDate(task.dueDate || format(new Date(), 'yyyy-MM-dd'), task.recurrence);
        await addTask(
            userId,
            task.title,
            task.priority,
            task.description,
            nextDueDate,
            accessToken,
            task.recurrence,
            task.itemType
        );
    }
};

const calculateNextDueDate = (currentDueDate: string, recurrence: 'daily' | 'weekly' | 'monthly'): string => {
    const date = parseISO(currentDueDate);
    let nextDate: Date;

    switch (recurrence) {
        case 'daily':
            nextDate = addDays(date, 1);
            break;
        case 'weekly':
            nextDate = addWeeks(date, 1);
            break;
        case 'monthly':
            nextDate = addMonths(date, 1);
            break;
        default:
            nextDate = addDays(date, 1);
    }

    return format(nextDate, 'yyyy-MM-dd');
};

export const deleteTask = async (userId: string, task: Task, accessToken?: string | null) => {
    await deleteDoc(doc(db, `users/${userId}/${COLLECTION_NAME}/${task.id}`));

    if (accessToken) {
        if (task.itemType === 'event' && task.googleCalendarEventId) {
            await deleteCalendarEvent(accessToken, task.googleCalendarEventId);
        } else if (task.itemType === 'task' && task.googleTaskId) {
            await deleteGoogleTask(accessToken, task.googleTaskId);
        }
    }
};

export const updateTask = async (
    userId: string,
    taskId: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'dueDate'>>,
    task: Task,
    accessToken?: string | null
) => {
    const taskRef = doc(db, `users/${userId}/${COLLECTION_NAME}/${taskId}`);
    await updateDoc(taskRef, updates);

    if (accessToken) {
        if (task.itemType === 'event' && task.googleCalendarEventId) {
            await updateCalendarEvent(accessToken, task.googleCalendarEventId, {
                title: updates.title,
                description: updates.description,
                dueDate: updates.dueDate
            });
        }
        // Note: Google Tasks API doesn't support updating title/notes easily, only status
    }
};

// Sync tasks from Google Tasks to Firebase
export const syncFromGoogleTasks = async (userId: string, accessToken: string) => {
    try {
        const googleTasks = await fetchGoogleTasks(accessToken);
        if (!googleTasks.length) return;

        // Get existing tasks from Firebase
        const snapshot = await getDocs(collection(db, `users/${userId}/${COLLECTION_NAME}`));
        const existingTasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Task[];

        // Create a map of googleTaskId -> Firebase task
        const taskMap = new Map<string, Task>();
        existingTasks.forEach(t => {
            if (t.googleTaskId) taskMap.set(t.googleTaskId, t);
        });

        for (const gTask of googleTasks) {
            const existingTask = taskMap.get(gTask.id);

            if (existingTask) {
                // Update completion status if different
                const gCompleted = gTask.status === 'completed';
                if (existingTask.completed !== gCompleted) {
                    console.log(`Syncing task status from Google: "${gTask.title}" -> ${gCompleted ? 'Completed' : 'Pending'}`);
                    const taskRef = doc(db, `users/${userId}/${COLLECTION_NAME}/${existingTask.id}`);
                    await updateDoc(taskRef, { completed: gCompleted });
                }
            } else {
                // New task from Google - add to Firebase
                console.log(`Syncing new task from Google: "${gTask.title}"`);
                await addDoc(collection(db, `users/${userId}/${COLLECTION_NAME}`), {
                    userId,
                    title: gTask.title,
                    description: gTask.notes || '',
                    completed: gTask.status === 'completed',
                    priority: 'medium',
                    dueDate: gTask.due ? gTask.due.split('T')[0] : null,
                    createdAt: serverTimestamp(),
                    itemType: 'task',
                    googleTaskId: gTask.id,
                    googleCalendarEventId: null,
                    recurrence: 'none',
                    isRecurring: false,
                });
            }
        }
    } catch (error) {
        console.error('Error syncing from Google Tasks:', error);
    }
};
