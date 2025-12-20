import { format, parseISO, differenceInDays } from 'date-fns';
import { RefreshCw, Clock } from 'lucide-react';
import type { QuranProgress } from '../../types/quran';
import { logJuzReview } from '../../services/quranService';

interface Props {
    userId: string;
    progress: QuranProgress | null;
}

const TOTAL_JUZ = 30;

export default function QuranReviewView({ userId, progress }: Props) {
    const handleReviewClick = async (juz: number) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        // Check if already reviewed today? 
        // Requirement 2.2: "User can enter pages reviewed everyday". Actually requirement is "Juz wise".
        // 2.4 says "Review a Juz".
        // Let's check if reviewed today, if so maybe don't duplicate or allow multiple?
        // Service handles duplicates for same date.

        await logJuzReview(userId, juz, today, progress);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Review Tracker</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: TOTAL_JUZ }, (_, i) => i + 1).map((juz) => {
                    const reviews = progress?.juzReviews?.[juz] || [];
                    const lastReviewDate = reviews.length > 0 ? reviews[reviews.length - 1] : null;

                    let daysSinceReview = 'Never';
                    let statusColor = 'text-gray-500';

                    if (lastReviewDate) {
                        const days = differenceInDays(new Date(), parseISO(lastReviewDate));
                        if (days === 0) {
                            daysSinceReview = 'Today';
                            statusColor = 'text-green-500';
                        } else if (days === 1) {
                            daysSinceReview = 'Yesterday';
                            statusColor = 'text-green-500';
                        } else {
                            daysSinceReview = `${days} days ago`;
                            if (days > 7) statusColor = 'text-red-500';
                            else if (days > 3) statusColor = 'text-yellow-500';
                            else statusColor = 'text-green-600';
                        }
                    }

                    return (
                        <div key={juz} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Juz {juz}</h3>
                                    <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                        {reviews.length} reviews
                                    </span>
                                </div>
                                <div className="flex items-center text-sm mb-4">
                                    <Clock size={14} className="mr-1 text-gray-400" />
                                    <span className={statusColor}>{daysSinceReview}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleReviewClick(juz)}
                                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition text-sm font-medium"
                            >
                                <RefreshCw size={16} />
                                Log Review
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
