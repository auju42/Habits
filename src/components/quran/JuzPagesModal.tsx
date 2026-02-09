import { useState } from 'react';
import { format } from 'date-fns';
import { X, Droplets } from 'lucide-react';
import { getJuzPageRange } from '../../types/quran';
import type { QuranProgress, JuzStrength } from '../../types/quran';
import SmartDatePicker from '../common/SmartDatePicker';

interface Props {
    juzNumber: number;
    progress: QuranProgress | null;
    onMarkPage: (page: number, date: string) => void;
    onRemovePage: (page: number) => void;
    onSetStrength: (strength: JuzStrength) => void;
    onClose: () => void;
}

const STRENGTH_CONFIG = {
    strong: { color: 'from-blue-600 to-blue-700', label: 'Strong', icon: null },
    medium: { color: 'from-cyan-400 to-cyan-500', label: 'Medium', icon: null },
    weak: { color: 'from-slate-400 to-slate-500', label: 'Weak', icon: null },
};

export default function JuzPagesModal({ juzNumber, progress, onMarkPage, onRemovePage, onSetStrength, onClose }: Props) {
    const [selectedPage, setSelectedPage] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const { start, total } = getJuzPageRange(juzNumber);
    const pages = Array.from({ length: total }, (_, i) => start + i);

    let memorizedCount = 0;
    pages.forEach(p => {
        if (progress?.memorizedPages?.[p]) memorizedCount++;
    });

    const percentage = (memorizedCount / total) * 100;
    const isComplete = memorizedCount === total;
    const currentStrength = progress?.juzStrengths?.[juzNumber];

    const handlePageClick = (page: number) => {
        if (progress?.memorizedPages?.[page]) {
            // Already memorized - show remove option
            setSelectedPage(page);
        } else {
            // Not memorized - show date picker
            setSelectedPage(page);
        }
    };

    const handleConfirm = () => {
        if (selectedPage === null) return;
        onMarkPage(selectedPage, selectedDate);
        setSelectedPage(null);
        setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    };

    const handleRemove = () => {
        if (selectedPage === null) return;
        onRemovePage(selectedPage);
        setSelectedPage(null);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header with water fill visualization */}
                <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
                    {/* Water fill animation */}
                    <div
                        className={`absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out ${isComplete && currentStrength
                            ? `bg-gradient-to-t ${STRENGTH_CONFIG[currentStrength].color}`
                            : 'bg-gradient-to-t from-blue-500 to-blue-400'
                            }`}
                        style={{ height: `${percentage}%` }}
                    >
                        {/* Wave effect */}
                        <div className="absolute -top-2 left-0 right-0 h-4">
                            <svg viewBox="0 0 1200 120" className="w-full h-full" preserveAspectRatio="none">
                                <path
                                    d="M0,60 C200,100 400,20 600,60 C800,100 1000,20 1200,60 L1200,120 L0,120 Z"
                                    className="fill-current text-blue-500/30"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Juz number and close button */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Juz {juzNumber}</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{memorizedCount}/{total} pages</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-full hover:bg-white dark:hover:bg-gray-700">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Percentage */}
                    <div className="absolute bottom-4 left-4">
                        <span className="text-3xl font-bold text-white drop-shadow-lg">{Math.round(percentage)}%</span>
                    </div>
                </div>

                {/* Strength selector for complete Juz */}
                {isComplete && (
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <Droplets size={16} />
                            <span>Retention Level</span>
                        </div>
                        <div className="flex gap-2">
                            {(['strong', 'medium', 'weak'] as JuzStrength[]).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => onSetStrength(s)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${currentStrength === s
                                        ? `bg-gradient-to-r ${STRENGTH_CONFIG[s!].color} text-white shadow-md scale-105`
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Droplets size={14} className={s === 'weak' ? 'opacity-50' : s === 'medium' ? 'opacity-75' : 'opacity-100'} />
                                    {STRENGTH_CONFIG[s!].label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pages Grid or Selected Page View */}
                <div className="p-4 max-h-[50vh] overflow-y-auto">
                    {selectedPage === null ? (
                        <div className="grid grid-cols-5 gap-2">
                            {pages.map((page) => {
                                const isMemorized = progress?.memorizedPages?.[page];
                                return (
                                    <button
                                        key={page}
                                        onClick={() => handlePageClick(page)}
                                        className={`
                                            aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all
                                            ${isMemorized
                                                ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md hover:shadow-lg hover:scale-105'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}
                                        `}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xl font-bold mb-2">
                                    {selectedPage}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Page {selectedPage}</h3>
                            </div>

                            {progress?.memorizedPages?.[selectedPage] ? (
                                <div className="space-y-3">
                                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                                        Memorized on {progress.memorizedPages[selectedPage]}
                                    </p>
                                    <button
                                        onClick={handleRemove}
                                        className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium"
                                    >
                                        Remove Memorization
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">

                                    <SmartDatePicker
                                        value={selectedDate}
                                        onChange={setSelectedDate}
                                        max={format(new Date(), 'yyyy-MM-dd')}
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        💡 Tip: You can type dates like "23/04/2015" or use quick selects
                                    </p>
                                    <button
                                        onClick={handleConfirm}

                                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition font-medium shadow-md"
                                    >
                                        Mark as Memorized
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => setSelectedPage(null)}
                                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                ← Back to pages
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
