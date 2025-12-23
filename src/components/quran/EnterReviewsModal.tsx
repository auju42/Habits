import { useState, useEffect } from 'react';
import { X, Check, RotateCcw, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import type { QuranProgress } from '../../types/quran';
import { getJuzPageRange } from '../../types/quran';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    progress: QuranProgress | null;
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    onSave: (hizbNumbers: number[], date: string) => Promise<void>;
}

const TOTAL_JUZ = 30;

export default function EnterReviewsModal({ isOpen, onClose, progress, selectedDate, onDateChange, onSave }: Props) {
    const [selectedHizbs, setSelectedHizbs] = useState<Set<number>>(new Set());
    const [saving, setSaving] = useState(false);

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    // Initialize selectedHizbs with already reviewed hizbs for this date
    useEffect(() => {
        if (isOpen) {
            const alreadyReviewed = new Set<number>();
            const hizbReviews = progress?.hizbReviews || {};
            for (let h = 1; h <= 60; h++) {
                if (hizbReviews[h]?.includes(dateStr)) {
                    alreadyReviewed.add(h);
                }
            }
            setSelectedHizbs(alreadyReviewed);
        }
    }, [isOpen, progress, dateStr]);

    const toggleHizb = (hizb: number) => {
        setSelectedHizbs(prev => {
            const next = new Set(prev);
            if (next.has(hizb)) {
                next.delete(hizb);
            } else {
                next.add(hizb);
            }
            return next;
        });
    };

    const toggleJuz = (juz: number) => {
        const hizb1 = (juz - 1) * 2 + 1;
        const hizb2 = (juz - 1) * 2 + 2;
        const bothSelected = selectedHizbs.has(hizb1) && selectedHizbs.has(hizb2);

        setSelectedHizbs(prev => {
            const next = new Set(prev);
            if (bothSelected) {
                next.delete(hizb1);
                next.delete(hizb2);
            } else {
                next.add(hizb1);
                next.add(hizb2);
            }
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(Array.from(selectedHizbs), dateStr);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const clearAll = () => setSelectedHizbs(new Set());

    const handlePrevDay = () => onDateChange(subDays(selectedDate, 1));
    const handleNextDay = () => {
        if (addDays(selectedDate, 1) <= new Date()) {
            onDateChange(addDays(selectedDate, 1));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-xl">
                {/* Header */}
                <div className="flex flex-col border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between p-4 pb-2">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Enter Reviews</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={clearAll}
                                className="flex items-center gap-1 text-xs px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
                            >
                                <RotateCcw size={12} />
                                Clear
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Date Navigation */}
                    <div className="px-4 pb-4 flex items-center justify-between">
                        <button
                            onClick={handlePrevDay}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                        >
                            <ChevronLeft size={20} className="text-gray-500" />
                        </button>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </span>
                        <button
                            onClick={handleNextDay}
                            disabled={addDays(selectedDate, 1) > new Date()}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-30"
                        >
                            <ChevronRight size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {Array.from({ length: TOTAL_JUZ }, (_, i) => i + 1).map((juz) => {
                            const hizb1 = (juz - 1) * 2 + 1;
                            const hizb2 = (juz - 1) * 2 + 2;

                            // Check memorization for unlock logic
                            const { start, end, total } = getJuzPageRange(juz);
                            let memorizedCount = 0;
                            for (let p = start; p <= end; p++) {
                                if (progress?.memorizedPages?.[p]) memorizedCount++;
                            }
                            const canReviewH1 = memorizedCount >= 10;
                            const canReviewH2 = memorizedCount === total;

                            const h1Selected = selectedHizbs.has(hizb1);
                            const h2Selected = selectedHizbs.has(hizb2);
                            const bothSelected = h1Selected && h2Selected;

                            return (
                                <div
                                    key={juz}
                                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-200 dark:border-gray-600"
                                >
                                    {/* Juz Header - clickable to toggle both */}
                                    <button
                                        onClick={() => toggleJuz(juz)}
                                        disabled={!canReviewH1}
                                        className={`w-full text-left mb-2 ${!canReviewH1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm text-gray-800 dark:text-white">
                                                Juz {juz}
                                            </span>
                                            {bothSelected && canReviewH1 && (
                                                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                                    <Check size={10} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </button>

                                    {/* Hizb Checkboxes */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleHizb(hizb1)}
                                            disabled={!canReviewH1}
                                            title={!canReviewH1 ? `Need 10+ pages memorized (${memorizedCount}/${total})` : undefined}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${!canReviewH1
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-600 dark:text-gray-500'
                                                : h1Selected
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30'
                                                }`}
                                        >
                                            H{hizb1}
                                        </button>
                                        <button
                                            onClick={() => toggleHizb(hizb2)}
                                            disabled={!canReviewH2}
                                            title={!canReviewH2 ? `Need full Juz memorized (${memorizedCount}/${total})` : undefined}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${!canReviewH2
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-600 dark:text-gray-500'
                                                : h2Selected
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30'
                                                }`}
                                        >
                                            H{hizb2}
                                        </button>
                                    </div>

                                    {/* Lock indicator */}
                                    {(!canReviewH1 || !canReviewH2) && (
                                        <div className="mt-2 flex items-center gap-1 text-[10px] text-orange-500">
                                            <Lock size={10} />
                                            <span>{memorizedCount}/{total} pages</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedHizbs.size} hizb{selectedHizbs.size !== 1 ? 's' : ''} selected
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Reviews'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
