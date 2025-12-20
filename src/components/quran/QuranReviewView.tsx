import { useState } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { RefreshCw, Clock, ChevronRight } from 'lucide-react';
import type { QuranProgress } from '../../types/quran';
import { logJuzReview, removeJuzReview } from '../../services/quranService';
import ReviewHistoryModal from './ReviewHistoryModal';

interface Props {
    userId: string;
    progress: QuranProgress | null;
}

const TOTAL_JUZ = 30;
const HIZB_PER_JUZ = 2;

export default function QuranReviewView({ userId, progress }: Props) {
    const [selectedJuz, setSelectedJuz] = useState<number | null>(null);

    const handleReviewClick = async (juz: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const today = format(new Date(), 'yyyy-MM-dd');
        await logJuzReview(userId, juz, today, progress);
    };

    const handleRemoveReview = async (date: string) => {
        if (selectedJuz === null) return;
        await removeJuzReview(userId, selectedJuz, date, progress);
    };

    // Calculate overall stats
    const totalReviews = Object.values(progress?.juzReviews || {}).reduce((sum, arr) => sum + arr.length, 0);
    const juzWithReviews = Object.keys(progress?.juzReviews || {}).filter(k => (progress?.juzReviews?.[parseInt(k)]?.length || 0) > 0).length;

    return (
        <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-indigo-500">{totalReviews}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Reviews</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-green-500">{juzWithReviews}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Juz Reviewed</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-purple-500">{juzWithReviews * HIZB_PER_JUZ}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Hizb Reviewed</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-blue-500">{((juzWithReviews / TOTAL_JUZ) * 100).toFixed(0)}%</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Coverage</div>
                </div>
            </div>

            {/* Juz Grid */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Review Tracker</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Click on a Juz card to view review history. Click "Log Review" to mark today's review.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: TOTAL_JUZ }, (_, i) => i + 1).map((juz) => {
                        const reviews = progress?.juzReviews?.[juz] || [];
                        const lastReviewDate = reviews.length > 0 ? reviews[reviews.length - 1] : null;
                        const reviewedToday = lastReviewDate === format(new Date(), 'yyyy-MM-dd');

                        let daysSinceReview = 'Never reviewed';
                        let statusColor = 'text-gray-500';
                        let bgAccent = '';

                        if (lastReviewDate) {
                            const days = differenceInDays(new Date(), parseISO(lastReviewDate));
                            if (days === 0) {
                                daysSinceReview = 'Today';
                                statusColor = 'text-green-500';
                                bgAccent = 'border-l-4 border-l-green-500';
                            } else if (days === 1) {
                                daysSinceReview = 'Yesterday';
                                statusColor = 'text-green-500';
                                bgAccent = 'border-l-4 border-l-green-400';
                            } else {
                                daysSinceReview = `${days} days ago`;
                                if (days > 7) {
                                    statusColor = 'text-red-500';
                                    bgAccent = 'border-l-4 border-l-red-500';
                                } else if (days > 3) {
                                    statusColor = 'text-yellow-500';
                                    bgAccent = 'border-l-4 border-l-yellow-500';
                                } else {
                                    statusColor = 'text-green-600';
                                    bgAccent = 'border-l-4 border-l-green-500';
                                }
                            }
                        }

                        return (
                            <div
                                key={juz}
                                onClick={() => setSelectedJuz(juz)}
                                className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition ${bgAccent}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                            Juz {juz}
                                            <ChevronRight size={16} className="text-gray-400" />
                                        </h3>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Hizb {(juz - 1) * 2 + 1} & {(juz - 1) * 2 + 2}
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                        {reviews.length} reviews
                                    </span>
                                </div>

                                <div className="flex items-center text-sm mb-4">
                                    <Clock size={14} className="mr-1 text-gray-400" />
                                    <span className={statusColor}>{daysSinceReview}</span>
                                </div>

                                <button
                                    onClick={(e) => handleReviewClick(juz, e)}
                                    disabled={reviewedToday}
                                    className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md transition text-sm font-medium ${reviewedToday
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 cursor-default'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        }`}
                                >
                                    <RefreshCw size={16} />
                                    {reviewedToday ? 'Reviewed Today' : 'Log Review'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Review History Modal */}
            {selectedJuz !== null && (
                <ReviewHistoryModal
                    juzNumber={selectedJuz}
                    reviewDates={progress?.juzReviews?.[selectedJuz] || []}
                    onRemoveReview={handleRemoveReview}
                    onClose={() => setSelectedJuz(null)}
                />
            )}
        </div>
    );
}
