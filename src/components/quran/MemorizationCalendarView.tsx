import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths, subWeeks, addWeeks, startOfWeek, endOfWeek, subYears, addYears, startOfYear, endOfYear, eachMonthOfInterval, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, LayoutGrid } from 'lucide-react';
import type { QuranProgress } from '../../types/quran';

interface Props {
    progress: QuranProgress | null;
}

type ViewMode = 'monthly' | 'yearly';

export default function MemorizationCalendarView({ progress }: Props) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('monthly');

    // Calculate pages memorized per day
    const pagesPerDay: Record<string, number> = {};

    if (progress?.memorizedPages) {
        Object.values(progress.memorizedPages).forEach((dateStr) => {
            pagesPerDay[dateStr] = (pagesPerDay[dateStr] || 0) + 1;
        });
    }

    // Calculate stats for the SELECTED month (only in monthly view)
    const calculateStatsForMonth = (month: Date) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);

        // Find the week containing the first day of the month for "this week" context
        const weekStart = startOfWeek(monthStart);
        const weekEnd = endOfWeek(monthStart);

        let pagesThisWeek = 0;
        eachDayOfInterval({ start: weekStart, end: weekEnd }).forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const count = pagesPerDay[dateStr] || 0;
            if (count <= 20) pagesThisWeek += count;
        });

        let pagesThisMonth = 0;
        eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const count = pagesPerDay[dateStr] || 0;
            if (count <= 20) pagesThisMonth += count;
        });

        return { pagesThisWeek, pagesThisMonth };
    };

    const stats = viewMode === 'monthly' ? calculateStatsForMonth(currentMonth) : null;

    const prevPeriod = () => {
        if (viewMode === 'monthly') {
            setCurrentMonth(subMonths(currentMonth, 1));
        } else {
            setCurrentMonth(subYears(currentMonth, 1));
        }
    };

    const nextPeriod = () => {
        if (viewMode === 'monthly') {
            setCurrentMonth(addMonths(currentMonth, 1));
        } else {
            setCurrentMonth(addYears(currentMonth, 1));
        }
    };

    // Monthly view rendering
    const renderMonthlyView = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const startDayOffset = getDay(monthStart);

        return (
            <div className="grid grid-cols-7 gap-1.5">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-center text-[10px] text-blue-100 font-medium pb-1">
                        {d}
                    </div>
                ))}
                {Array.from({ length: startDayOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {daysInMonth.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const count = pagesPerDay[dateStr] || 0;
                    const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

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
        );
    };

    // Yearly view rendering
    const renderYearlyView = () => {
        const yearStart = startOfYear(currentMonth);
        const yearEnd = endOfYear(currentMonth);
        const monthsInYear = eachMonthOfInterval({ start: yearStart, end: yearEnd });

        return (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {monthsInYear.map(month => {
                    const mStart = startOfMonth(month);
                    const mEnd = endOfMonth(month);
                    const daysInMonth = eachDayOfInterval({ start: mStart, end: mEnd });
                    const startDayOffset = getDay(mStart);

                    let monthTotal = 0;
                    daysInMonth.forEach(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        monthTotal += pagesPerDay[dateStr] || 0;
                    });

                    const isCurrentMonth = isSameMonth(month, new Date());

                    return (
                        <div
                            key={format(month, 'yyyy-MM')}
                            className={`bg-white/5 rounded-lg p-2 ${isCurrentMonth ? 'ring-1 ring-white/30' : ''}`}
                        >
                            <div className="text-xs font-medium text-blue-100 mb-1.5 flex justify-between">
                                <span>{format(month, 'MMM')}</span>
                                <span className="bg-white/20 px-1 rounded text-[10px]">{monthTotal}p</span>
                            </div>
                            <div className="grid grid-cols-7 gap-px">
                                {Array.from({ length: startDayOffset }).map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square" />
                                ))}
                                {daysInMonth.map(day => {
                                    const dateStr = format(day, 'yyyy-MM-dd');
                                    const count = pagesPerDay[dateStr] || 0;

                                    return (
                                        <div
                                            key={dateStr}
                                            className={`
                                                aspect-square rounded-sm
                                                ${count > 0
                                                    ? 'bg-white'
                                                    : 'bg-white/10'}
                                            `}
                                            title={count > 0 ? `${count} page(s)` : ''}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const periodLabel = viewMode === 'monthly'
        ? format(currentMonth, 'MMM yyyy')
        : format(currentMonth, 'yyyy');

    return (
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg shadow-blue-500/20">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h4 className="font-bold text-lg">Memorization Overview</h4>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex bg-white/10 rounded-lg p-0.5">
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={`p-1.5 rounded transition ${viewMode === 'monthly' ? 'bg-white/20' : 'hover:bg-white/10'}`}
                            title="Monthly View"
                        >
                            <Calendar size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode('yearly')}
                            className={`p-1.5 rounded transition ${viewMode === 'yearly' ? 'bg-white/20' : 'hover:bg-white/10'}`}
                            title="Yearly View"
                        >
                            <LayoutGrid size={14} />
                        </button>
                    </div>

                    {/* Period Navigation */}
                    <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                        <button onClick={prevPeriod} className="p-1 hover:bg-white/20 rounded transition">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-medium min-w-[70px] text-center">
                            {periodLabel}
                        </span>
                        <button onClick={nextPeriod} className="p-1 hover:bg-white/20 rounded transition">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className={`grid gap-6 ${viewMode === 'monthly' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {/* Stats Column - Only in Monthly View */}
                {viewMode === 'monthly' && stats && (
                    <div className="space-y-4">
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-xs text-blue-100 mb-1">Consistency</div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs opacity-80">This Month</span>
                                    <span className="text-xl font-bold">{stats.pagesThisMonth}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Calendar Grid */}
                <div className={viewMode === 'monthly' ? 'lg:col-span-2' : ''}>
                    {viewMode === 'monthly' ? renderMonthlyView() : renderYearlyView()}
                </div>
            </div>
        </div>
    );
}
