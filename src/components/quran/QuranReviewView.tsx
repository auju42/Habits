import { useState } from 'react';
import { format, endOfMonth, subMonths, addMonths } from 'date-fns';
import { Lock, ChevronLeft, ChevronRight, CalendarPlus } from 'lucide-react';
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



    return (
        <div className="space-y-6">
            {/* Date Selector with Enter Reviews Button */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">


                    {/* Enter Reviews Button */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-green-500/20 w-full sm:w-auto"
                    >
                        <CalendarPlus size={16} />
                        <span className="sm:inline">Enter Reviews</span>
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

                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('month')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'month'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setViewMode('quarter')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'quarter'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                    >
                        Quarterly
                    </button>
                </div>
                <div className="text-base font-semibold text-gray-800 dark:text-white min-w-[120px] text-center hidden sm:block">
                    {dateLabel}
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
                        // Single row for month view - let flex-wrap handle layout
                        dotRows.push(historyDots);
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
                            <div className="hidden sm:flex flex-col gap-1.5">
                                {dotRows.map((rowDots, rowIdx) => (
                                    <div key={rowIdx} className="flex gap-1 flex-wrap">
                                        {rowDots.map((d, idx) => (
                                            <div
                                                key={idx}
                                                className="w-3 h-3 rounded-full relative overflow-hidden bg-gray-100 dark:bg-gray-700"
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
                onDateChange={setSelectedDate}
                onSave={handleSaveReviews}
            />
        </div>
    );
}
