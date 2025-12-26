export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

export interface Habit {
    id: string;
    userId: string;
    name: string;
    completedDates: string[]; // YYYY-MM-DD
    skippedDates?: string[]; // YYYY-MM-DD - Days marked as skipped (maintain streak but don't increment)
    streak: number;
    createdAt: number; // Timestamp
    color?: string;
    icon?: string;
    habitType: 'simple' | 'count';
    dailyGoal?: number; // For count type
    dailyProgress: Record<string, number>; // YYYY-MM-DD -> count
    isQuitting?: boolean; // If true, success = NOT doing the habit
    order?: number;
    reminderTime?: string; // HH:mm - Daily reminder time
}

export interface HabitStats {
    totalCompletions: number;
    currentStreak: number;
    bestStreak: number;
    completionRate: number; // 0-1
}

export interface Task {
    id: string;
    userId: string;
    title: string;
    description?: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string; // YYYY-MM-DD
    dueTime?: string; // HH:mm - Time for the task
    createdAt: number; // Timestamp
    itemType: 'task' | 'event'; // task → local only, event → Google Calendar
    googleCalendarEventId?: string; // For Google Calendar sync
    recurrence?: 'daily' | 'weekly' | 'monthly' | 'none';
    isRecurring?: boolean;
}

