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

export const getHabit = async (userId: string, habitId: string): Promise<Habit | null> => {
    const { getDoc } = await import('firebase/firestore');
    const docRef = doc(db, `users/${userId}/${COLLECTION_NAME}/${habitId}`);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Habit;
};

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
    color?: string,
    reminderTime?: string
) => {
    const docRef = await addDoc(collection(db, `users/${userId}/${COLLECTION_NAME}`), {
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
        reminderTime: reminderTime || null,
    });
    return docRef.id;
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

    const streak = calculateStreak(newCompletedDates, habit.skippedDates);

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
        // If marking as completed, remove from skipped
        if (habit.skippedDates?.includes(date)) {
            await toggleHabitSkipped(userId, habit, date); // This might recurse/be complex. Better to handle here.
            // Actually, simplest is to just manually update skipped here or let UI handle it. 
            // Ideally this function should handle it.
            // But existing implementations of setHabitCompletion rarely used. toggleHabitCompletion is main.
        }
    } else if (!isCompleted && alreadyCompleted) {
        newCompletedDates = newCompletedDates.filter(d => d !== date);
    } else {
        return; // No change needed
    }

    // CLEANUP skipped if completing?
    let newSkippedDates = [...(habit.skippedDates || [])];
    if (isCompleted && newSkippedDates.includes(date)) {
        newSkippedDates = newSkippedDates.filter(d => d !== date);
    }

    const streak = calculateStreak(newCompletedDates, newSkippedDates);

    await updateDoc(habitRef, {
        completedDates: newCompletedDates,
        skippedDates: newSkippedDates,
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
    let newSkippedDates = [...(habit.skippedDates || [])];

    if (goalMet && !newCompletedDates.includes(date)) {
        newCompletedDates.push(date);
        newCompletedDates.sort();
        // Remove from skipped if met
        if (newSkippedDates.includes(date)) {
            newSkippedDates = newSkippedDates.filter(d => d !== date);
        }
    }

    const streak = calculateStreak(newCompletedDates, newSkippedDates);

    await updateDoc(habitRef, {
        dailyProgress: newDailyProgress,
        completedDates: newCompletedDates,
        skippedDates: newSkippedDates,
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

    // Streak recalculation
    const streak = calculateStreak(newCompletedDates, habit.skippedDates);

    await updateDoc(habitRef, {
        dailyProgress: newDailyProgress,
        completedDates: newCompletedDates,
        streak
    });
};

// Toggle skipped status
export const toggleHabitSkipped = async (userId: string, habit: Habit, date: string) => {
    const habitRef = doc(db, `users/${userId}/${COLLECTION_NAME}/${habit.id}`);

    let newSkippedDates = [...(habit.skippedDates || [])];
    let newCompletedDates = [...(habit.completedDates || [])];

    const isSkipped = newSkippedDates.includes(date);

    if (isSkipped) {
        // Unskip
        newSkippedDates = newSkippedDates.filter(d => d !== date);
    } else {
        // Skip
        newSkippedDates.push(date);
        newSkippedDates.sort();

        // If it was completed, remove from completed
        if (newCompletedDates.includes(date)) {
            newCompletedDates = newCompletedDates.filter(d => d !== date);
            // Also reset progress if it was a count habit? 
            // Maybe optional, but if skipped, usually implies "didn't do it".
            // Let's leave dailyProgress as records, but remove from completedDates.
        }
    }

    const streak = calculateStreak(newCompletedDates, newSkippedDates);

    await updateDoc(habitRef, {
        skippedDates: newSkippedDates,
        completedDates: newCompletedDates,
        streak
    });
};

export const updateHabit = async (userId: string, habitId: string, updates: Partial<Habit>) => {
    const habitRef = doc(db, `users/${userId}/${COLLECTION_NAME}/${habitId}`);
    await updateDoc(habitRef, updates);
};

export const reorderHabits = async (userId: string, habits: Habit[]) => {
    const promises = habits.map((habit, index) => {
        const habitRef = doc(db, `users/${userId}/${COLLECTION_NAME}/${habit.id}`);
        return updateDoc(habitRef, { order: index });
    });
    await Promise.all(promises);
};

// Helper to calculate streak
// Streak = consecutive days completed. Skipped days bridge the gap but don't add to the count?
// User said: "skip days dont efectt the streak".
// Ambiguous. Usually implies they bridge.
// E.g. Done (1) -> Skipped -> Done (2). Streak should be 2.
// E.g. Done (1) -> Skipped -> Skipped -> Done (2). Streak should be 2.
// If Skipped is at the START of the chain (today is skipped), does it count?
// Usually current streak counts backwards from Today or Yesterday.
export function calculateStreak(completedDates: string[], skippedDates: string[] = []): number {
    if (!completedDates || completedDates.length === 0) return 0;

    const allDates = [...new Set([...completedDates, ...skippedDates])].sort((a, b) => b.localeCompare(a));
    if (allDates.length === 0) return 0;

    // Check if the chain starts from today or yesterday
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterdayStr = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

    // We need to find the "anchor" for the streak. 
    // It's the most recent Completed OR Skipped date that is either Today or Yesterday.
    // Actually, simply: check if the most recent specific date is Today or Yesterday.
    const lastDate = allDates[0];
    if (lastDate !== todayStr && lastDate !== yesterdayStr) {
        return 0;
    }

    let streak = 0;

    // Iterate backwards day by day from the anchor
    // We can't just iterate the array because we need to detect gaps.
    // Instead, we can iterate days backwards and check existence.

    // Optimization: Loop through the sorted array? No, simpler to iterate dates.
    // But indefinite loop is dangerous.
    // Let's assume max reasonable streak < 10000.

    // Better logic: linear scan of sorted dates with gap checking.

    // We have `allDates` sorted DESC.
    // `currentDate` is the one we just validated as Today/Yesterday.

    // If the anchor is today/yesterday, we start counting.
    // But wait, if the anchor is SKIPPED, does streak count?
    // If I skipped today, and did yesterday. Streak is 1.
    // If I skipped today, skipped yesterday, done day before. Streak is 1.
    // So Skipped days at the head of the chain DON'T add to streak, but bridge to previous.
    // So we iterate backwards. If COMPLETED -> streak++. If SKIPPED -> continue. If MISSING -> break.

    for (let i = 0; i < allDates.length; i++) {
        const dateStr = allDates[i];

        // This logic is tricky with array iteration because gaps might exist between indices.
        // Let's use `differenceInDays`.

        // Initial check for the very first item (already done above sort of)
        if (i > 0) {
            const prevDateStr = allDates[i - 1]; // The date we just processed (newer)
            const thisDateStr = dateStr;         // The date we are processing (older)

            const diff = differenceInDays(parseISO(prevDateStr), parseISO(thisDateStr));

            if (diff > 1) {
                // Gap found! Streak broken.
                break;
            }
        }

        // Check status of thisDateStr
        if (completedDates.includes(dateStr)) {
            streak++;
        }
        // If skipped, we do nothing (streak stays same, loop continues to next date)
    }

    return streak;
}

