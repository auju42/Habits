import { useState } from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { PAGES_PER_JUZ } from '../../types/quran';
import type { QuranProgress } from '../../types/quran';
import { markPageAsMemorized, removePageMemorization } from '../../services/quranService';
import PageDatePickerModal from './PageDatePickerModal';
import MemorizationCalendarView from './MemorizationCalendarView';

interface Props {
    userId: string;
    progress: QuranProgress | null;
}

const TOTAL_JUZ = 30;
const PAGES_PER_HIZB = 10; // Each Juz has 2 Hizbs

export default function QuranMemorizationView({ userId, progress }: Props) {
    const [expandedJuz, setExpandedJuz] = useState<number | null>(null);
    const [selectedPage, setSelectedPage] = useState<number | null>(null);

    const toggleJuz = (juz: number) => {
        setExpandedJuz(expandedJuz === juz ? null : juz);
    };

    const handlePageClick = (page: number) => {
        setSelectedPage(page);
    };

    const handleConfirmMemorization = async (date: string) => {
        if (selectedPage === null) return;
        await markPageAsMemorized(userId, selectedPage, date, progress);
        setSelectedPage(null);
    };

    const handleRemoveMemorization = async () => {
        if (selectedPage === null) return;
        await removePageMemorization(userId, selectedPage, progress);
        setSelectedPage(null);
    };

    // Calculate total memorized
    const totalMemorized = Object.keys(progress?.memorizedPages || {}).length;

    return (
        <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-green-500">{totalMemorized}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Pages Memorized</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-indigo-500">{Math.floor(totalMemorized / PAGES_PER_HIZB)}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Hizb Complete</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-purple-500">{Math.floor(totalMemorized / PAGES_PER_JUZ)}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Juz Complete</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-blue-500">{((totalMemorized / 604) * 100).toFixed(1)}%</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Progress</div>
                </div>
            </div>

            {/* Calendar View */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Memorization Calendar</h3>
                <MemorizationCalendarView progress={progress} />
            </div>

            {/* Juz List */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Juz Progress</h3>
                <div className="grid gap-2">
                    {Array.from({ length: TOTAL_JUZ }, (_, i) => i + 1).map((juz) => {
                        const startPage = (juz - 1) * PAGES_PER_JUZ + 1;
                        const endPage = juz * PAGES_PER_JUZ;

                        let memorizedCount = 0;
                        for (let p = startPage; p <= endPage; p++) {
                            if (progress?.memorizedPages?.[p]) memorizedCount++;
                        }

                        const isComplete = memorizedCount === PAGES_PER_JUZ;
                        const hizb1Memorized = Array.from({ length: PAGES_PER_HIZB }, (_, i) => startPage + i)
                            .filter(p => progress?.memorizedPages?.[p]).length;
                        const hizb2Memorized = Array.from({ length: PAGES_PER_HIZB }, (_, i) => startPage + PAGES_PER_HIZB + i)
                            .filter(p => progress?.memorizedPages?.[p]).length;

                        return (
                            <div key={juz} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleJuz(juz)}
                                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                >
                                    <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        {expandedJuz === juz ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        Juz {juz}
                                        {isComplete && <Check size={16} className="text-green-500 ml-2" />}
                                    </span>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">
                                            H1: {hizb1Memorized}/{PAGES_PER_HIZB}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            H2: {hizb2Memorized}/{PAGES_PER_HIZB}
                                        </span>
                                        <span className="font-medium text-indigo-500">
                                            {memorizedCount}/{PAGES_PER_JUZ}
                                        </span>
                                    </div>
                                </button>

                                {expandedJuz === juz && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900">
                                        {/* Hizb 1 */}
                                        <div className="mb-4">
                                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                Hizb 1 ({hizb1Memorized}/{PAGES_PER_HIZB})
                                            </div>
                                            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                                                {Array.from({ length: PAGES_PER_HIZB }, (_, i) => startPage + i).map((page) => {
                                                    const isMemorized = progress?.memorizedPages?.[page];
                                                    return (
                                                        <button
                                                            key={page}
                                                            onClick={() => handlePageClick(page)}
                                                            className={`
                                                                aspect-square rounded flex items-center justify-center text-sm font-medium transition
                                                                ${isMemorized
                                                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-green-500'}
                                                            `}
                                                            title={isMemorized ? `Memorized: ${progress?.memorizedPages?.[page]}` : `Page ${page}`}
                                                        >
                                                            {page}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Hizb 2 */}
                                        <div>
                                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                Hizb 2 ({hizb2Memorized}/{PAGES_PER_HIZB})
                                            </div>
                                            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                                                {Array.from({ length: PAGES_PER_HIZB }, (_, i) => startPage + PAGES_PER_HIZB + i).map((page) => {
                                                    const isMemorized = progress?.memorizedPages?.[page];
                                                    return (
                                                        <button
                                                            key={page}
                                                            onClick={() => handlePageClick(page)}
                                                            className={`
                                                                aspect-square rounded flex items-center justify-center text-sm font-medium transition
                                                                ${isMemorized
                                                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-green-500'}
                                                            `}
                                                            title={isMemorized ? `Memorized: ${progress?.memorizedPages?.[page]}` : `Page ${page}`}
                                                        >
                                                            {page}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Date Picker Modal */}
            {selectedPage !== null && (
                <PageDatePickerModal
                    pageNumber={selectedPage}
                    isMemorized={!!progress?.memorizedPages?.[selectedPage]}
                    memorizedDate={progress?.memorizedPages?.[selectedPage]}
                    onConfirm={handleConfirmMemorization}
                    onRemove={handleRemoveMemorization}
                    onClose={() => setSelectedPage(null)}
                />
            )}
        </div>
    );
}
