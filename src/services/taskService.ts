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
} from 'firebase/firestore';
import type { Task } from '../types';

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
    dueDate?: string
) => {
    await addDoc(collection(db, `users/${userId}/${COLLECTION_NAME}`), {
        userId,
        title,
        description: description || '',
        completed: false,
        priority,
        dueDate: dueDate || null,
        createdAt: serverTimestamp(),
    });
};

export const toggleTaskCompletion = async (userId: string, taskId: string, completed: boolean) => {
    const taskRef = doc(db, `users/${userId}/${COLLECTION_NAME}/${taskId}`);
    await updateDoc(taskRef, { completed: !completed });
};

export const deleteTask = async (userId: string, taskId: string) => {
    await deleteDoc(doc(db, `users/${userId}/${COLLECTION_NAME}/${taskId}`));
};

export const updateTask = async (
    userId: string,
    taskId: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'dueDate'>>
) => {
    const taskRef = doc(db, `users/${userId}/${COLLECTION_NAME}/${taskId}`);
    await updateDoc(taskRef, updates);
};
