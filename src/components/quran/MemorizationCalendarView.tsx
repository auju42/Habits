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

    // Calculate pages memorized per day & stats
    const pagesPerDay: Record<string, number> = {};
    let firstDate: Date | null = null;
    let totalPages = 0;

    if (progress?.memorizedPages) {
        Object.values(progress.memorizedPages).forEach((dateStr) => {
            pagesPerDay[dateStr] = (pagesPerDay[dateStr] || 0) + 1;
            totalPages++;

            const date = new Date(dateStr);
            if (!firstDate || date < firstDate) {
                firstDate = date;
            }
        });
    }



    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const startDayOffset = getDay(monthStart);

    // Count pages this month and calculate stats
    let pagesThisMonth = 0;
    let validImpactPages = 0;
    let activeDaysCount = 0;

    daysInMonth.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const count = pagesPerDay[dateStr] || 0;

        if (count > 0) {
            pagesThisMonth += count;

            // Check for outlier (e.g. Mass Import) - threshold > 20 pages/day (1 Juz)
            if (count <= 20) {
                validImpactPages += count;
                activeDaysCount++;
            }
        }
    });

    // Impact: Pages / Week (based on valid activity only)
    // If no active days, impact is 0. 
    // Otherwise, assume the pace continues: (valid pages / active days) * 7
    // Alternatively, just do validPages / 4.33 to show "monthly pace excluding imports"
    // The user asked for "Estimated weekly pace for that specific month".
    // Simple approach: Total Valid Pages / 4.33
    const impactScore = (validImpactPages / 4.33).toFixed(1);

    return (
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg shadow-blue-500/20">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h4 className="font-bold text-lg">Daily Tracker</h4>
                    <span className="px-2 py-0.5 bg-white/20 rounded-md text-xs font-medium">
                        {pagesThisMonth} pages this month
                    </span>
                </div>

                <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-white/20 rounded transition">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-medium min-w-[90px] text-center">
                        {format(currentMonth, 'MMM yyyy')}
                    </span>
                    <button onClick={nextMonth} className="p-1 hover:bg-white/20 rounded transition">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Column */}
                <div className="space-y-4">
                    <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-xs text-blue-100 mb-1">Impact</div>
                        <div className="text-2xl font-bold">{impactScore}</div>
                        <div className="text-xs opacity-80">Pages / Week</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-xs text-blue-100 mb-1">Consistency</div>
                        <div className="text-2xl font-bold">{validImpactPages}</div>
                        <div className="text-xs opacity-80">Pages / Month</div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="lg:col-span-2">
                    <div className="grid grid-cols-7 gap-1.5">
                        {/* Day headers */}
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} className="text-center text-[10px] text-blue-100 font-medium pb-1">
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
                                        aspect-square rounded-md flex items-center justify-center text-[10px] transition-all
                                        ${count > 0
                                            ? 'bg-white text-blue-600 font-bold shadow-sm'
                                            : 'bg-white/10 text-blue-200 hover:bg-white/20'}
                                        ${isToday ? 'ring-2 ring-white ring-offset-1 ring-offset-blue-500' : ''}
                                    `}
                                    title={count > 0 ? `${count} page(s) - ${format(day, 'MMM d')}` : format(day, 'MMM d')}
                                >
                                    {count > 0 ? count : ''}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
