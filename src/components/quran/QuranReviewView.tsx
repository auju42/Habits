import { useState } from 'react';
import { format, endOfMonth, subMonths, addMonths } from 'date-fns';
import { RefreshCw, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { QuranProgress } from '../../types/quran';
import { logHizbReview, removeHizbReview } from '../../services/quranService';
import { getJuzPageRange } from '../../types/quran';

interface Props {
    userId: string;
    progress: QuranProgress | null;
}

const TOTAL_JUZ = 30;

export default function QuranReviewView({ userId, progress }: Props) {
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'quarter'>('month');

    const handleHizbReview = async (hizb: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const today = format(new Date(), 'yyyy-MM-dd');

        // Check if already reviewed today (only in hizbReviews, not legacy juzReviews)
        const hizbReviews = progress?.hizbReviews || {};
        const reviewsForThisHizb = hizbReviews[hizb] || [];
        const isReviewedInHizb = reviewsForThisHizb.includes(today);

        console.log('Toggle Hizb Review:', { hizb, today, reviewsForThisHizb, isReviewedInHizb });

        if (isReviewedInHizb) {
            console.log('Removing review for hizb', hizb);
            await removeHizbReview(userId, hizb, today, progress);
        } else {
            console.log('Adding review for hizb', hizb);
            await logHizbReview(userId, hizb, today, progress);
        }
    };

    // Calculate total reviews (Hizb level)
    const totalHizbReviews = Object.values(progress?.hizbReviews || {}).reduce((sum, dates) => sum + dates.length, 0);
    // Add legacy Juz reviews (count as 2 hizbs)
    const totalLegacyReviews = Object.values(progress?.juzReviews || {}).reduce((sum, dates) => sum + dates.length * 2, 0);
    const grandTotalReviews = totalHizbReviews + totalLegacyReviews;

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

    const handlePrev = () => {
        if (viewMode === 'month') setSelectedMonth(subMonths(selectedMonth, 1));
        else setSelectedMonth(subMonths(selectedMonth, 3));
    };

    const handleNext = () => {
        if (viewMode === 'month') setSelectedMonth(addMonths(selectedMonth, 1));
        else setSelectedMonth(addMonths(selectedMonth, 3));
    };

    return (
        <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="text-3xl font-bold text-indigo-500">{grandTotalReviews}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Hizbs Reviewed</div>
                </div>
            </div>

            {/* Month/Quarter Selector */}
            <div className="flex items-center justify-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <button
                    onClick={handlePrev}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode(viewMode === 'month' ? 'quarter' : 'month')}
                        className="text-xs px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition font-medium"
                    >
                        {viewMode === 'month' ? 'Quarterly View' : 'Monthly View'}
                    </button>
                    <div className="text-lg font-semibold text-gray-800 dark:text-white min-w-[150px] text-center">
                        {dateLabel}
                    </div>
                </div>

                <button
                    onClick={handleNext}
                    disabled={dateEnd > new Date()}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Juz Grid */}
            <div className={`grid gap-4 ${viewMode === 'quarter' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
                {Array.from({ length: TOTAL_JUZ }, (_, i) => i + 1).map((juz) => {
                    const { start, end } = getJuzPageRange(juz);

                    // Check memorization count
                    let memorizedCount = 0;
                    for (let p = start; p <= end; p++) {
                        if (progress?.memorizedPages?.[p]) memorizedCount++;
                    }
                    // Smart unlock logic
                    const { total: juzTotal } = getJuzPageRange(juz);
                    const isFullJuz = memorizedCount === juzTotal;
                    const canReviewH1 = memorizedCount >= 10;
                    const canReviewH2 = isFullJuz;

                    const hizb1 = (juz - 1) * 2 + 1;
                    const hizb2 = (juz - 1) * 2 + 2;

                    // Get review status for today
                    const today = format(new Date(), 'yyyy-MM-dd');

                    // Check hizbReviews only (these can be toggled)
                    const h1ReviewedHizb = progress?.hizbReviews?.[hizb1]?.includes(today) || false;
                    const h2ReviewedHizb = progress?.hizbReviews?.[hizb2]?.includes(today) || false;

                    // Check legacy juzReviews (these CANNOT be toggled, shown differently)
                    const juzReviewedLegacy = progress?.juzReviews?.[juz]?.includes(today) || false;

                    // For button visuals: only hizbReviews controls the toggle state
                    const h1Reviewed = h1ReviewedHizb;
                    const h2Reviewed = h2ReviewedHizb;

                    // Generate history dots for selected range
                    const historyDots: Array<{ date: Date; intensity: number }> = [];
                    // Iterate day by day from start to end
                    for (let d = new Date(dateStart); d <= dateEnd; d.setDate(d.getDate() + 1)) {
                        const currentDate = new Date(d);
                        const dateStr = format(currentDate, 'yyyy-MM-dd');

                        const isLegacy = progress?.juzReviews?.[juz]?.includes(dateStr);
                        const isH1 = progress?.hizbReviews?.[hizb1]?.includes(dateStr);
                        const isH2 = progress?.hizbReviews?.[hizb2]?.includes(dateStr);

                        let intensity = 0; // 0, 1 (half), 2 (full)
                        if (isLegacy) intensity = 2;
                        else intensity = (isH1 ? 1 : 0) + (isH2 ? 1 : 0);

                        historyDots.push({ date: currentDate, intensity });
                    }

                    // Chunk dots for display
                    const dotRows: Array<typeof historyDots> = [];
                    if (viewMode === 'month') {
                        // Monthly view: 10 per row, allow last to be longer
                        dotRows.push(historyDots.slice(0, 10));
                        dotRows.push(historyDots.slice(10, 20));
                        const rest = historyDots.slice(20);
                        if (rest.length > 0) dotRows.push(rest);
                    } else {
                        // Quarterly view: Group by month (approx 3 rows)
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
                        <div key={juz} className={`bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition ${viewMode === 'quarter' ? 'max-w-none' : 'max-w-[200px]'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-base text-gray-900 dark:text-white">Juz {juz}</h3>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                        H{hizb1} & H{hizb2}
                                    </div>
                                </div>
                                {juzReviewedLegacy && (
                                    <div className="text-[8px] text-purple-500 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded" title="Legacy review from old system - can't be toggled">
                                        Legacy
                                    </div>
                                )}
                                {!canReviewH1 && !juzReviewedLegacy && (
                                    <div className="flex items-center gap-0.5 text-[10px] text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded">
                                        <Lock size={10} />
                                        <span>{memorizedCount}/10</span>
                                    </div>
                                )}
                            </div>

                            {/* Mini Dot Calendar */}
                            <div className="mb-3">
                                <div className="flex flex-col gap-1">
                                    {dotRows.map((rowDots, rowIdx) => (
                                        <div key={rowIdx} className="flex gap-1">
                                            {rowDots.map((d, idx) => (
                                                <div
                                                    key={idx}
                                                    className="w-2.5 h-2.5 rounded-sm relative overflow-hidden bg-gray-100 dark:bg-gray-700"
                                                    title={`${format(d.date, 'MMM d')}: ${d.intensity === 2 ? 'Full' : d.intensity === 1 ? 'Half' : 'None'}`}
                                                >
                                                    {/* Half-filled for intensity 1, full for intensity 2 */}
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

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    onClick={(e) => handleHizbReview(hizb1, e)}
                                    disabled={!canReviewH1}
                                    className={`
                                        flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[10px] font-medium transition
                                        ${!canReviewH1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                                            : h1Reviewed
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40'
                                        }
                                    `}
                                >
                                    <RefreshCw size={10} className={h1Reviewed ? "opacity-50" : ""} />
                                    H{hizb1}
                                </button>

                                <button
                                    onClick={(e) => handleHizbReview(hizb2, e)}
                                    disabled={!canReviewH2}
                                    className={`
                                        flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[10px] font-medium transition
                                        ${!canReviewH2
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                                            : h2Reviewed
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40'
                                        }
                                    `}
                                >
                                    <RefreshCw size={10} className={h2Reviewed ? "opacity-50" : ""} />
                                    H{hizb2}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
