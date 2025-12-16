import { useState } from 'react';
import { X, Target, Ban } from 'lucide-react';

interface HabitFormProps {
    onClose: () => void;
    onSubmit: (name: string, habitType: 'simple' | 'count', dailyGoal?: number, isQuitting?: boolean) => Promise<void>;
}

export default function HabitForm({ onClose, onSubmit }: HabitFormProps) {
    const [name, setName] = useState('');
    const [habitType, setHabitType] = useState<'simple' | 'count'>('simple');
    const [dailyGoal, setDailyGoal] = useState(3);
    const [isQuitting, setIsQuitting] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            await onSubmit(name, habitType, habitType === 'count' ? dailyGoal : undefined, isQuitting);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl transform transition-all">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Habit</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Building vs Quitting Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Habit Type
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setIsQuitting(false)}
                                className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${!isQuitting
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                    }`}
                            >
                                <Target className={`w-5 h-5 ${!isQuitting ? 'text-green-600' : 'text-gray-400'}`} />
                                <div className="text-left">
                                    <div className={`font-medium ${!isQuitting ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>Building</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Start doing</div>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsQuitting(true)}
                                className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${isQuitting
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                    }`}
                            >
                                <Ban className={`w-5 h-5 ${isQuitting ? 'text-red-600' : 'text-gray-400'}`} />
                                <div className="text-left">
                                    <div className={`font-medium ${isQuitting ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>Quitting</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Stop doing</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {isQuitting ? 'Habit to Quit' : 'Habit Name'}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={isQuitting ? "e.g., Smoking, Junk food" : "e.g., Read 30 minutes"}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Tracking Mode Selection - Available for all habit types now */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tracking Mode
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setHabitType('simple')}
                                className={`p-3 rounded-xl border-2 transition-all text-left ${habitType === 'simple'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                    }`}
                            >
                                <div className="font-medium text-gray-900 dark:text-white">Simple</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {isQuitting ? "Don't do it at all" : "One-click done"}
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setHabitType('count')}
                                className={`p-3 rounded-xl border-2 transition-all text-left ${habitType === 'count'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                    }`}
                            >
                                <div className="font-medium text-gray-900 dark:text-white">Count</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {isQuitting ? "Limit daily amount" : "Track times"}
                                </div>
                            </button>
                        </div>
                    </div>

                    {habitType === 'count' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {isQuitting ? "Daily Limit" : "Daily Goal"}
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={dailyGoal}
                                    onChange={(e) => setDailyGoal(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-20 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                                />
                                <span className="text-gray-500 dark:text-gray-400">times per day</span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className={`px-5 py-2.5 font-medium rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isQuitting
                                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-red-500/25'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-blue-500/25'
                                }`}
                        >
                            {loading ? 'Creating...' : isQuitting ? 'Start Quitting' : 'Create Habit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
