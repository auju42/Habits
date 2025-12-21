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
import type { Habit } from '../types';
import { differenceInDays, parseISO, format } from 'date-fns';

const COLLECTION_NAME = 'habits';

export const subscribeToHabits = (userId: string, callback: (habits: Habit[]) => void) => {
    const q = query(
        collection(db, `users/${userId}/${COLLECTION_NAME}`),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const habits = snapshot.docs.map(docSnapshot => ({
            id: docSnapshot.id,
            // Provide defaults for new fields
            habitType: 'simple' as const,
            dailyProgress: {} as Record<string, number>,
            completedDates: [] as string[],
            order: 0, // Default order
            ...docSnapshot.data(),
        } as Habit));

        // Sort by order
        const sortedHabits = habits.sort((a, b) => {
            const orderA = a.order ?? 0;
            const orderB = b.order ?? 0;
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            // Fallback to createdAt desc if order is same
            // Handle both Firestore Timestamp (has toMillis) and simple number
            const timeA = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : (Number(a.createdAt) || 0);
            const timeB = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : (Number(b.createdAt) || 0);
            return timeB - timeA;
        });

        callback(sortedHabits);
    });
};

export const addHabit = async (
    userId: string,
    name: string,
    habitType: 'simple' | 'count' = 'simple',
    dailyGoal?: number,
    isQuitting?: boolean,
    color?: string
) => {
    await addDoc(collection(db, `users/${userId}/${COLLECTION_NAME}`), {
        userId,
        name,
        completedDates: [],
        streak: 0,
        createdAt: serverTimestamp(),
        habitType: isQuitting ? 'simple' : habitType,
        dailyGoal: habitType === 'count' && !isQuitting ? (dailyGoal || 1) : null,
        dailyProgress: {},
        isQuitting: isQuitting || false,
        color: color || '#3B82F6', // Default blue if not provided
        order: Date.now(), // Use timestamp as simple default order to put new ones at bottom
    });
};

export const deleteHabit = async (userId: string, habitId: string) => {
    await deleteDoc(doc(db, `users/${userId}/${COLLECTION_NAME}/${habitId}`));
};

export const toggleHabitCompletion = async (userId: string, habit: Habit, date: string) => {
    const habitRef = doc(db, `users/${userId}/${COLLECTION_NAME}/${habit.id}`);

    let newCompletedDates = [...(habit.completedDates || [])];
    const isCompleted = newCompletedDates.includes(date);

    if (isCompleted) {
        newCompletedDates = newCompletedDates.filter(d => d !== date);
    } else {
        newCompletedDates.push(date);
        newCompletedDates.sort();
    }

    const streak = calculateStreak(newCompletedDates);

    await updateDoc(habitRef, {
        completedDates: newCompletedDates,
        streak
    });
};

export const setHabitCompletion = async (userId: string, habit: Habit, date: string, isCompleted: boolean) => {
    const habitRef = doc(db, `users/${userId}/${COLLECTION_NAME}/${habit.id}`);

    let newCompletedDates = [...(habit.completedDates || [])];
    const alreadyCompleted = newCompletedDates.includes(date);

    if (isCompleted && !alreadyCompleted) {
        newCompletedDates.push(date);
        newCompletedDates.sort();
    } else if (!isCompleted && alreadyCompleted) {
        newCompletedDates = newCompletedDates.filter(d => d !== date);
    } else {
        return; // No change needed
    }

    const streak = calculateStreak(newCompletedDates);

    await updateDoc(habitRef, {
        completedDates: newCompletedDates,
        streak
    });
};

// For count habits: increment progress
export const incrementHabitProgress = async (userId: string, habit: Habit, date: string) => {
    const habitRef = doc(db, `users/${userId}/${COLLECTION_NAME}/${habit.id}`);

    const currentProgress = habit.dailyProgress?.[date] || 0;
    const newProgress = currentProgress + 1;

    // Update dailyProgress
    const newDailyProgress = { ...(habit.dailyProgress || {}), [date]: newProgress };

    // Check if goal is met
    const goalMet = habit.dailyGoal && newProgress >= habit.dailyGoal;

    // Update completedDates if goal is met
    let newCompletedDates = [...(habit.completedDates || [])];
    if (goalMet && !newCompletedDates.includes(date)) {
        newCompletedDates.push(date);
        newCompletedDates.sort();
    }

    const streak = calculateStreak(newCompletedDates);

    await updateDoc(habitRef, {
        dailyProgress: newDailyProgress,
        completedDates: newCompletedDates,
        streak
    });
};

// For count habits: decrement progress
export const decrementHabitProgress = async (userId: string, habit: Habit, date: string) => {
    const habitRef = doc(db, `users/${userId}/${COLLECTION_NAME}/${habit.id}`);

    const currentProgress = habit.dailyProgress?.[date] || 0;
    if (currentProgress <= 0) return;

    const newProgress = currentProgress - 1;

    const newDailyProgress = { ...(habit.dailyProgress || {}), [date]: newProgress };

    // Remove from completedDates if now below goal
    let newCompletedDates = [...(habit.completedDates || [])];
    if (habit.dailyGoal && newProgress < habit.dailyGoal) {
        newCompletedDates = newCompletedDates.filter(d => d !== date);
    }

    const streak = calculateStreak(newCompletedDates);

    await updateDoc(habitRef, {
        dailyProgress: newDailyProgress,
        completedDates: newCompletedDates,
        streak
    });
};

// Helper to calculate streak
function calculateStreak(dates: string[]): number {
    if (!dates || dates.length === 0) return 0;

    const uniqueDates = [...new Set(dates)].sort((a, b) => b.localeCompare(a));

    if (uniqueDates.length === 0) return 0;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterdayStr = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

    const lastDate = uniqueDates[0];
    if (lastDate !== todayStr && lastDate !== yesterdayStr) {
        return 0;
    }

    let streak = 1;
    let currentDate = parseISO(lastDate);

    for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = parseISO(uniqueDates[i]);
        const diff = differenceInDays(currentDate, prevDate);

        if (diff === 1) {
            streak++;
            currentDate = prevDate;
        } else {
            break;
        }
    }

    return streak;
}

export const updateHabit = async (userId: string, habitId: string, updates: Partial<Habit>) => {
    const habitRef = doc(db, `users/${userId}/${COLLECTION_NAME}/${habitId}`);
    await updateDoc(habitRef, updates);
};

export const reorderHabits = async (userId: string, habits: Habit[]) => {
    // We update each habit's order field
    // To avoid too many writes, we could batch, but for now simple promise.all is fine for small lists
    // Or simpler: just update the modified ones. 
    // For now, let's update all to ensure consistency.
    const promises = habits.map((habit, index) => {
        const habitRef = doc(db, `users/${userId}/${COLLECTION_NAME}/${habit.id}`);
        return updateDoc(habitRef, { order: index });
    });
    await Promise.all(promises);
};

