import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths } from 'date-fns';
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
            pagesPerDay[dateStr] = (pagesPerDay[dateStr] || 0) + 1;
        });
    }

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const startDayOffset = getDay(monthStart);

    // Count pages this month
    const pagesThisMonth = daysInMonth.reduce((sum, day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return sum + (pagesPerDay[dateStr] || 0);
    }, 0);

    // Get recent 3 months data for mini view (logic removed as unused)

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-800 dark:text-white text-sm">Monthly Progress</h4>
                <div className="flex items-center gap-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[100px] text-center">
                        {format(currentMonth, 'MMM yyyy')}
                    </span>
                    <button onClick={nextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Compact inline stats */}
            <div className="flex items-center gap-4 mb-3 text-sm">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-gray-600 dark:text-gray-400">{pagesThisMonth} pages this month</span>
                </div>
            </div>

            {/* Days grid - compact */}
            <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-center text-[10px] text-gray-400 font-medium pb-1">
                        {d}
                    </div>
                ))}

                {/* Empty cells for offset */}
                {Array.from({ length: startDayOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Days */}
                {daysInMonth.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const count = pagesPerDay[dateStr] || 0;
                    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                    return (
                        <div
                            key={dateStr}
                            className={`
                                aspect-square rounded-sm flex items-center justify-center text-[10px]
                                ${count > 0 ? 'bg-blue-500 text-white font-medium' : 'bg-gray-50 dark:bg-gray-900/50 text-gray-400'}
                                ${isToday ? 'ring-1 ring-blue-400 ring-offset-1' : ''}
                            `}
                            title={count > 0 ? `${count} page(s) - ${format(day, 'MMM d')}` : format(day, 'MMM d')}
                        >
                            {count > 0 ? count : ''}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
