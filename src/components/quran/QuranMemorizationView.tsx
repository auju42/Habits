import { useState } from 'react';
import { Droplets, Upload } from 'lucide-react';
import { getJuzPageRange } from '../../types/quran';
import type { QuranProgress, JuzStrength } from '../../types/quran';
import { markPageAsMemorized, removePageMemorization, setJuzStrength } from '../../services/quranService';
import MemorizationCalendarView from './MemorizationCalendarView';
import JuzPagesModal from './JuzPagesModal';
import MassImportModal from './MassImportModal';

interface Props {
    userId: string;
    progress: QuranProgress | null;
}

const TOTAL_JUZ = 30;

const STRENGTH_COLORS: Record<string, string> = {
    strong: 'from-blue-600 to-blue-700',
    medium: 'from-cyan-400 to-cyan-500',
    weak: 'from-slate-400 to-slate-500',
};

export default function QuranMemorizationView({ userId, progress }: Props) {
    const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);

    const handleMarkPage = async (page: number, date: string) => {
        await markPageAsMemorized(userId, page, date, progress);
    };

    const handleRemovePage = async (page: number) => {
        await removePageMemorization(userId, page, progress);
    };

    const handleSetStrength = async (strength: JuzStrength) => {
        if (selectedJuz === null) return;
        await setJuzStrength(userId, selectedJuz, strength, progress);
    };

    const totalMemorized = Object.keys(progress?.memorizedPages || {}).length;

    // Calculate total juz equivalent
    const totalJuzMemorized = (totalMemorized / 20).toFixed(1);
    const totalJuzPercentage = ((parseFloat(totalJuzMemorized) / 30) * 100).toFixed(0);

    return (
        <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white">
                    <div className="text-3xl font-bold">{totalMemorized}</div>
                    <div className="text-sm opacity-80">Pages ({((totalMemorized / 604) * 100).toFixed(0)}%)</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl text-white">
                    <div className="text-3xl font-bold">{totalJuzMemorized}</div>
                    <div className="text-sm opacity-80">Juz ({totalJuzPercentage}%)</div>
                </div>
            </div>

            {/* Juz Bubbles - Water Fill Style */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Droplets className="text-blue-500" size={20} />
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Juz Progress</h3>
                    </div>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition text-sm font-medium"
                    >
                        <Upload size={14} />
                        Mass Import
                    </button>
                </div>
                <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
                    {Array.from({ length: TOTAL_JUZ }, (_, i) => i + 1).map((juz) => {
                        const { start, end, total } = getJuzPageRange(juz);

                        let memorizedCount = 0;
                        for (let p = start; p <= end; p++) {
                            if (progress?.memorizedPages?.[p]) memorizedCount++;
                        }

                        const percentage = (memorizedCount / total) * 100;
                        const isComplete = memorizedCount === total;
                        const strength = progress?.juzStrengths?.[juz];

                        return (
                            <button
                                key={juz}
                                onClick={() => setSelectedJuz(juz)}
                                className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 hover:scale-105 transition-all shadow-sm hover:shadow-md group"
                            >
                                {/* Water fill */}
                                <div
                                    className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${isComplete && strength
                                        ? `bg-gradient-to-t ${STRENGTH_COLORS[strength]}`
                                        : 'bg-gradient-to-t from-blue-500 to-blue-400'
                                        }`}
                                    style={{ height: `${percentage}%` }}
                                />

                                {/* Number */}
                                <div className={`absolute inset-0 flex items-center justify-center font-bold ${percentage > 50 ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {juz}
                                </div>

                                {/* Hover effect */}
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all" />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Calendar View */}
            <MemorizationCalendarView progress={progress} />

            {/* Juz Pages Modal */}
            {selectedJuz !== null && (
                <JuzPagesModal
                    juzNumber={selectedJuz}
                    progress={progress}
                    onMarkPage={handleMarkPage}
                    onRemovePage={handleRemovePage}
                    onSetStrength={handleSetStrength}
                    onClose={() => setSelectedJuz(null)}
                />
            )}

            {/* Mass Import Modal */}
            {showImportModal && (
                <MassImportModal
                    userId={userId}
                    progress={progress}
                    onClose={() => setShowImportModal(false)}
                />
            )}
        </div>
    );
}
