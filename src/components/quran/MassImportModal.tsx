import { useState } from 'react';
import { X, Upload, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { markPageAsMemorized } from '../../services/quranService';
import type { QuranProgress } from '../../types/quran';
import { getJuzPageRange } from '../../types/quran';

interface Props {
    userId: string;
    progress: QuranProgress | null;
    onClose: () => void;
}

type ImportMode = 'pages' | 'juz';

export default function MassImportModal({ userId, progress, onClose }: Props) {
    const [importMode, setImportMode] = useState<ImportMode>('juz');
    const [importText, setImportText] = useState('');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedJuz, setSelectedJuz] = useState<number[]>([]);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

    const handleJuzToggle = (juz: number) => {
        setSelectedJuz(prev =>
            prev.includes(juz)
                ? prev.filter(j => j !== juz)
                : [...prev, juz]
        );
    };

    const handleImport = async () => {
        setImporting(true);
        setResult(null);

        let success = 0;
        let failed = 0;

        if (importMode === 'juz') {
            // Import all pages for selected Juz
            for (const juz of selectedJuz) {
                const { start, end } = getJuzPageRange(juz);
                for (let page = start; page <= end; page++) {
                    try {
                        await markPageAsMemorized(userId, page, selectedDate, progress);
                        success++;
                    } catch (error) {
                        failed++;
                    }
                }
            }
        } else {
            // Import from text
            const lines = importText.split('\n').filter(l => l.trim());

            for (const line of lines) {
                try {
                    const parts = line.trim().split(/[,\s]+/);
                    const page = parseInt(parts[0]);
                    const date = parts[1] || selectedDate;

                    if (page >= 1 && page <= 604) {
                        await markPageAsMemorized(userId, page, date, progress);
                        success++;
                    } else {
                        failed++;
                    }
                } catch (error) {
                    failed++;
                }
            }
        }

        setResult({ success, failed });
        setImporting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Upload className="text-blue-500" size={24} />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mass Import</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Mode Selector */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setImportMode('juz')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition ${importMode === 'juz'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            <FileText size={16} />
                            Select Juz
                        </button>
                        <button
                            onClick={() => setImportMode('pages')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition ${importMode === 'pages'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            <FileText size={16} />
                            Enter Pages
                        </button>
                    </div>

                    {/* Date Selector */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Calendar size={14} className="inline mr-2" />
                            Memorization Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={format(new Date(), 'yyyy-MM-dd')}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {importMode === 'juz' ? (
                        <>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Select the Juz you have already memorized:
                            </p>
                            <div className="grid grid-cols-6 gap-2 mb-4">
                                {Array.from({ length: 30 }, (_, i) => i + 1).map(juz => (
                                    <button
                                        key={juz}
                                        onClick={() => handleJuzToggle(juz)}
                                        className={`
                                            aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition
                                            ${selectedJuz.includes(juz)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }
                                        `}
                                    >
                                        {juz}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {selectedJuz.length} Juz selected ({selectedJuz.reduce((sum, juz) => sum + getJuzPageRange(juz).total, 0)} pages)
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Enter page numbers (one per line). Optionally add a date after each.
                            </p>
                            <textarea
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                placeholder="1&#10;2 2024-01-15&#10;3,2024-02-20"
                                className="w-full h-40 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                disabled={importing}
                            />
                        </>
                    )}

                    {result && (
                        <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <div className="text-sm">
                                <span className="text-green-600 dark:text-green-400 font-semibold">✓ {result.success} pages imported</span>
                                {result.failed > 0 && (
                                    <span className="text-red-600 dark:text-red-400 font-semibold ml-3">✗ {result.failed} failed</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleImport}
                            disabled={importing || (importMode === 'juz' ? selectedJuz.length === 0 : !importText.trim())}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {importing ? 'Importing...' : 'Import Pages'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
