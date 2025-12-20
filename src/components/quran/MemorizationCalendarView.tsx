import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { QuranProgress } from '../../types/quran';

interface Props {
    progress: QuranProgress | null;
}

export default function MemorizationCalendarView({ progress }: Props) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Calculate pages memorized per day
    const pagesPerDay: Record<string, number> = {};
    if (progress?.memorizedPages) {
        Object.values(progress.memorizedPages).forEach(dateStr => {
            if (pagesPerDay[dateStr]) {
                pagesPerDay[dateStr]++;
            } else {
                pagesPerDay[dateStr] = 1;
            }
        });
    }

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    // Calculate starting day offset (0 = Sunday)
    const startDayOffset = getDay(monthStart);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <ChevronLeft size={20} />
                </button>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                    {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for offset */}
                {Array.from({ length: startDayOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {daysInMonth.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const count = pagesPerDay[dateStr] || 0;
                    const isToday = isSameDay(day, new Date());

                    // Color intensity based on count
                    let bgColor = 'bg-gray-50 dark:bg-gray-900';
                    if (count > 0) {
                        if (count >= 5) bgColor = 'bg-green-500';
                        else if (count >= 3) bgColor = 'bg-green-400';
                        else if (count >= 2) bgColor = 'bg-green-300';
                        else bgColor = 'bg-green-200';
                    }

                    return (
                        <div
                            key={dateStr}
                            className={`aspect-square rounded flex flex-col items-center justify-center text-xs ${bgColor} ${isToday ? 'ring-2 ring-indigo-500' : ''}`}
                            title={count > 0 ? `${count} pages memorized` : 'No pages'}
                        >
                            <span className={`${count > 0 ? 'text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                {format(day, 'd')}
                            </span>
                            {count > 0 && (
                                <span className="text-[10px] text-white font-bold">{count}</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-200 rounded" /> 1
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-300 rounded" /> 2
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-400 rounded" /> 3-4
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded" /> 5+
                </div>
            </div>
        </div>
    );
}
