import type { Habit } from '../types';
import { format } from 'date-fns';

// Helper to convert Firestore Timestamp or number to Date
const toDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    // Firestore Timestamp has toDate() method
    if (typeof timestamp?.toDate === 'function') {
        return timestamp.toDate();
    }
    // If it's already a number (milliseconds)
    if (typeof timestamp === 'number') {
        return new Date(timestamp);
    }
    // If it's a Firestore Timestamp-like object with seconds
    if (typeof timestamp?.seconds === 'number') {
        return new Date(timestamp.seconds * 1000);
    }
    return new Date();
};

export const exportHabitsToCSV = (habits: Habit[]) => {
    if (!habits || habits.length === 0) return;

    const headers = ['Habit Name', 'Type', 'Daily Goal', 'Current Streak', 'Is Quitting', 'Created At', 'Completed Dates'];

    const rows = habits.map(habit => [
        `"${habit.name}"`,
        habit.habitType,
        habit.dailyGoal || 'N/A',
        habit.streak,
        habit.isQuitting ? 'Yes' : 'No',
        format(toDate(habit.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        `"${(habit.completedDates || []).join(', ')}"`
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `habits_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
