import { useState } from 'react';
import { Target, Calendar, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';
import DailyHabitsView from '../components/habits/DailyHabitsView';
import HabitCalendarView from '../components/habits/HabitCalendarView';
import HabitGridView from '../components/habits/HabitGridView';

type ViewMode = 'daily' | 'calendar' | 'grid';

export default function HabitsPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('daily');

    const tabs = [
        { id: 'daily', label: 'Daily', icon: Target },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'grid', label: 'Grid', icon: LayoutGrid },
    ] as const;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Tab Navigation */}
            <div className="flex items-center justify-center mb-8">
                <div className="bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 inline-flex">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = viewMode === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setViewMode(tab.id as ViewMode)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive && "fill-current")} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                {viewMode === 'daily' && <DailyHabitsView />}
                {viewMode === 'calendar' && <HabitCalendarView />}
                {viewMode === 'grid' && <HabitGridView />}
            </div>
        </div>
    );
}
