import { useState } from 'react';
import { format, endOfMonth, subMonths, addMonths, subDays, addDays } from 'date-fns';
import { Lock, ChevronLeft, ChevronRight, CalendarPlus, CheckCircle2 } from 'lucide-react';
import type { QuranProgress } from '../../types/quran';
import { saveHizbReviewsForDate } from '../../services/quranService';
import { getJuzPageRange } from '../../types/quran';
import EnterReviewsModal from './EnterReviewsModal';

interface Props {
    userId: string;
    progress: QuranProgress | null;
}

const TOTAL_JUZ = 30;

export default function QuranReviewView({ userId, progress }: Props) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'quarter'>('month');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Check if any reviews exist for a specific date
    const hasReviewsForDate = (date: Date): boolean => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const hizbReviews = progress?.hizbReviews || {};
        for (let h = 1; h <= 60; h++) {
            if (hizbReviews[h]?.includes(dateStr)) return true;
        }
        // Also check legacy juzReviews
        const juzReviews = progress?.juzReviews || {};
        for (let j = 1; j <= 30; j++) {
            if (juzReviews[j]?.includes(dateStr)) return true;
        }
        return false;
    };

    const handleSaveReviews = async (hizbNumbers: number[], date: string) => {
        await saveHizbReviewsForDate(userId, hizbNumbers, date, progress);
    };

    // Calculate date range based on view mode
    const getRange = () => {
        if (viewMode === 'month') {
            return {
                start: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1),
                end: endOfMonth(selectedMonth),
                label: format(selectedMonth, 'MMMM yyyy')
            };
        } else {
            const quarterStartMonth = Math.floor(selectedMonth.getMonth() / 3) * 3;
            const start = new Date(selectedMonth.getFullYear(), quarterStartMonth, 1);
            const end = endOfMonth(new Date(selectedMonth.getFullYear(), quarterStartMonth + 2, 1));
            const qNum = Math.floor(selectedMonth.getMonth() / 3) + 1;
            return {
                start,
                end,
                label: `Q${qNum} ${selectedMonth.getFullYear()}`
            };
        }
    };

    const { start: dateStart, end: dateEnd, label: dateLabel } = getRange();

    const handlePrevMonth = () => {
        if (viewMode === 'month') setSelectedMonth(subMonths(selectedMonth, 1));
        else setSelectedMonth(subMonths(selectedMonth, 3));
    };

    const handleNextMonth = () => {
        if (viewMode === 'month') setSelectedMonth(addMonths(selectedMonth, 1));
        else setSelectedMonth(addMonths(selectedMonth, 3));
    };

    const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
    const handleNextDay = () => {
        const tomorrow = addDays(selectedDate, 1);
        if (tomorrow <= new Date()) setSelectedDate(tomorrow);
    };

    const selectedDateHasReviews = hasReviewsForDate(selectedDate);

    return (
        <div className="space-y-6">
            {/* Date Selector with Enter Reviews Button */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between gap-4">
                    {/* Date Navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevDay}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex items-center gap-2 min-w-[180px] justify-center">
                            <span className="text-base font-medium text-gray-800 dark:text-white">
                                {format(selectedDate, 'EEE, MMM d, yyyy')}
                            </span>
                            {selectedDateHasReviews && (
                                <CheckCircle2 size={16} className="text-green-500" />
                            )}
                        </div>
                        <button
                            onClick={handleNextDay}
                            disabled={addDays(selectedDate, 1) > new Date()}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Enter Reviews Button */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-green-500/20"
                    >
                        <CalendarPlus size={16} />
                        Enter Reviews
                    </button>
                </div>
            </div>

            {/* Month/Quarter Selector */}
            <div className="flex items-center justify-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                    <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode(viewMode === 'month' ? 'quarter' : 'month')}
                        className="text-xs px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition font-medium"
                    >
                        {viewMode === 'month' ? 'Quarterly' : 'Monthly'}
                    </button>
                    <div className="text-base font-semibold text-gray-800 dark:text-white min-w-[120px] text-center">
                        {dateLabel}
                    </div>
                </div>

                <button
                    onClick={handleNextMonth}
                    disabled={dateEnd > new Date()}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Juz Grid */}
            <div className={`grid gap-4 ${viewMode === 'quarter' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'}`}>
                {Array.from({ length: TOTAL_JUZ }, (_, i) => i + 1).map((juz) => {
                    const { start, end } = getJuzPageRange(juz);

                    // Check memorization count
                    let memorizedCount = 0;
                    for (let p = start; p <= end; p++) {
                        if (progress?.memorizedPages?.[p]) memorizedCount++;
                    }
                    const { total: juzTotal } = getJuzPageRange(juz);
                    const canReviewH1 = memorizedCount >= 10;

                    const hizb1 = (juz - 1) * 2 + 1;
                    const hizb2 = (juz - 1) * 2 + 2;

                    // Generate history dots for selected range
                    const historyDots: Array<{ date: Date; intensity: number }> = [];
                    for (let d = new Date(dateStart); d <= dateEnd; d.setDate(d.getDate() + 1)) {
                        const currentDate = new Date(d);
                        const dateStr = format(currentDate, 'yyyy-MM-dd');

                        const isLegacy = progress?.juzReviews?.[juz]?.includes(dateStr);
                        const isH1 = progress?.hizbReviews?.[hizb1]?.includes(dateStr);
                        const isH2 = progress?.hizbReviews?.[hizb2]?.includes(dateStr);

                        let intensity = 0;
                        if (isLegacy) intensity = 2;
                        else intensity = (isH1 ? 1 : 0) + (isH2 ? 1 : 0);

                        historyDots.push({ date: currentDate, intensity });
                    }

                    // Chunk dots for display
                    const dotRows: Array<typeof historyDots> = [];
                    if (viewMode === 'month') {
                        dotRows.push(historyDots.slice(0, 10));
                        dotRows.push(historyDots.slice(10, 20));
                        const rest = historyDots.slice(20);
                        if (rest.length > 0) dotRows.push(rest);
                    } else {
                        let currentMonth = -1;
                        let currentRow: typeof historyDots = [];

                        historyDots.forEach(dot => {
                            const m = dot.date.getMonth();
                            if (m !== currentMonth && currentRow.length > 0) {
                                dotRows.push(currentRow);
                                currentRow = [];
                            }
                            currentMonth = m;
                            currentRow.push(dot);
                        });
                        if (currentRow.length > 0) dotRows.push(currentRow);
                    }

                    return (
                        <div key={juz} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-base text-gray-900 dark:text-white">Juz {juz}</h3>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                        H{hizb1} & H{hizb2}
                                    </div>
                                </div>
                                {!canReviewH1 && (
                                    <div className="flex items-center gap-0.5 text-[10px] text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded">
                                        <Lock size={10} />
                                        <span>{memorizedCount}/{juzTotal}</span>
                                    </div>
                                )}
                            </div>

                            {/* Larger Dot Calendar */}
                            <div className="flex flex-col gap-1.5">
                                {dotRows.map((rowDots, rowIdx) => (
                                    <div key={rowIdx} className="flex gap-1 flex-wrap">
                                        {rowDots.map((d, idx) => (
                                            <div
                                                key={idx}
                                                className="w-4 h-4 rounded-sm relative overflow-hidden bg-gray-100 dark:bg-gray-700"
                                                title={`${format(d.date, 'MMM d')}: ${d.intensity === 2 ? 'Full' : d.intensity === 1 ? 'Half' : 'None'}`}
                                            >
                                                {d.intensity > 0 && (
                                                    <div
                                                        className="absolute bottom-0 left-0 right-0 bg-green-500 transition-all"
                                                        style={{ height: d.intensity === 2 ? '100%' : '50%' }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Enter Reviews Modal */}
            <EnterReviewsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userId={userId}
                progress={progress}
                selectedDate={selectedDate}
                onSave={handleSaveReviews}
            />
        </div>
    );
}
