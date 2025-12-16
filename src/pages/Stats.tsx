import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToHabits } from '../services/habitService';
import type { Habit } from '../types';
import { Trophy, Activity, TrendingUp, Flame, CheckCircle } from 'lucide-react';
import { subDays, format, isAfter, parseISO, eachDayOfInterval, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { cn } from '../lib/utils';

export default function Stats() {
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToHabits(user.uid, (data) => {
            setHabits(data);
            setLoading(false);
        });
        return unsubscribe;
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Calculate Overall Stats
    const totalHabits = habits.length;
    const bestStreak = habits.reduce((max, habit) => Math.max(max, habit.streak || 0), 0);

    // Calculate completion rate for last 30 days
    const thirtyDaysAgo = subDays(new Date(), 30);
    let totalCompletions = 0;
    let totalOpportunities = 0;

    habits.forEach(habit => {
        const recentCompletions = (habit.completedDates || []).filter(d =>
            isAfter(parseISO(d), thirtyDaysAgo)
        ).length;
        totalCompletions += recentCompletions;
        totalOpportunities += 30;
    });

    const completionRate = totalOpportunities > 0 ? Math.round((totalCompletions / totalOpportunities) * 100) : 0;

    // Weekly completion data (last 7 days)
    const today = new Date();
    const weekDays = eachDayOfInterval({
        start: subDays(today, 6),
        end: today
    });

    const weeklyData = weekDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const completedCount = habits.filter(h =>
            (h.completedDates || []).includes(dateStr)
        ).length;
        return {
            day: format(day, 'EEE'),
            date: dateStr,
            completed: completedCount,
            total: totalHabits,
            percent: totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0
        };
    });

    // Contribution heatmap data (last 12 weeks)
    const heatmapWeeks = 12;
    const heatmapStart = startOfWeek(subWeeks(today, heatmapWeeks - 1));
    const heatmapEnd = endOfWeek(today);
    const heatmapDays = eachDayOfInterval({ start: heatmapStart, end: heatmapEnd });

    const getHeatmapColor = (count: number, total: number) => {
        if (total === 0) return 'bg-gray-100 dark:bg-gray-800';
        const percent = count / total;
        if (percent === 0) return 'bg-gray-200 dark:bg-gray-700';
        if (percent < 0.25) return 'bg-green-200 dark:bg-green-900/40';
        if (percent < 0.5) return 'bg-green-300 dark:bg-green-800/60';
        if (percent < 0.75) return 'bg-green-400 dark:bg-green-700/80';
        return 'bg-green-500 dark:bg-green-600';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Statistics
            </h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={<Activity className="w-6 h-6 text-blue-500" />}
                    label="Total Habits"
                    value={totalHabits}
                />
                <StatCard
                    icon={<TrendingUp className="w-6 h-6 text-green-500" />}
                    label="Completion Rate"
                    value={`${completionRate}%`}
                    subtext="Last 30 days"
                />
                <StatCard
                    icon={<Trophy className="w-6 h-6 text-orange-500" />}
                    label="Best Streak"
                    value={`${bestStreak} days`}
                />
                <StatCard
                    icon={<CheckCircle className="w-6 h-6 text-purple-500" />}
                    label="Total Check-ins"
                    value={totalCompletions}
                    subtext="Last 30 days"
                />
            </div>

            {/* Weekly Bar Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Weekly Overview
                </h3>
                <div className="flex items-end justify-between gap-2 h-40">
                    {weeklyData.map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex flex-col items-center justify-end h-28">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    {day.completed}/{day.total}
                                </span>
                                <div
                                    className={cn(
                                        "w-full max-w-[40px] rounded-t-lg transition-all duration-300",
                                        day.percent >= 100 ? "bg-green-500" : "bg-blue-500"
                                    )}
                                    style={{ height: `${Math.max(day.percent, 4)}%` }}
                                />
                            </div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {day.day}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Contribution Heatmap */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Activity Heatmap
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Last {heatmapWeeks} weeks
                </p>
                <div className="overflow-x-auto">
                    <div className="grid grid-rows-7 grid-flow-col gap-1" style={{ width: 'fit-content' }}>
                        {heatmapDays.map((day, i) => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const completedCount = habits.filter(h =>
                                (h.completedDates || []).includes(dateStr)
                            ).length;

                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        "w-3 h-3 rounded-sm transition-colors",
                                        getHeatmapColor(completedCount, totalHabits)
                                    )}
                                    title={`${format(day, 'MMM d')}: ${completedCount}/${totalHabits} habits`}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Less</span>
                    <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
                    <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/40" />
                    <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-800/60" />
                    <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700/80" />
                    <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
                    <span>More</span>
                </div>
            </div>

            {/* Habit Performance */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Habit Performance
                </h3>
                {habits.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No habits yet. Create some habits to see your performance!
                    </p>
                ) : (
                    <div className="space-y-6">
                        {habits.map(habit => {
                            const habitCompletions = (habit.completedDates || []).filter(d =>
                                isAfter(parseISO(d), thirtyDaysAgo)
                            ).length;
                            const habitRate = Math.round((habitCompletions / 30) * 100);

                            return (
                                <div key={habit.id}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                {habit.name}
                                            </span>
                                            {habit.habitType === 'count' && (
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                                    ×{habit.dailyGoal}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {habitRate}%
                                            </span>
                                            <div className="flex items-center gap-1 text-orange-500">
                                                <Flame className="w-4 h-4" />
                                                <span className="font-medium">{habit.streak || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                        <div
                                            className={cn(
                                                "h-2.5 rounded-full transition-all duration-500",
                                                habitRate >= 80 ? "bg-green-500" : habitRate >= 50 ? "bg-blue-500" : "bg-orange-500"
                                            )}
                                            style={{ width: `${habitRate}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, subtext }: { icon: React.ReactNode, label: string, value: string | number, subtext?: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                    {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
                </div>
            </div>
        </div>
    );
}
