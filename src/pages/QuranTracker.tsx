import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToQuranProgress } from '../services/quranService';
import type { QuranProgress } from '../types/quran';
import QuranMemorizationView from '../components/quran/QuranMemorizationView';
import QuranReviewView from '../components/quran/QuranReviewView';
import { BookOpen, RefreshCw } from 'lucide-react';

export default function QuranTracker() {
    const { user } = useAuth();
    const [progress, setProgress] = useState<QuranProgress | null>(null);
    const [activeTab, setActiveTab] = useState<'memorization' | 'review'>('memorization');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToQuranProgress(user.uid, (data) => {
            setProgress(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading tracking data...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quran Tracker</h1>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-6">
                <button
                    onClick={() => setActiveTab('memorization')}
                    className={`flex items-center gap-2 pb-4 px-2 border-b-2 font-medium transition ${activeTab === 'memorization'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    <BookOpen size={20} />
                    Memorization
                </button>
                <button
                    onClick={() => setActiveTab('review')}
                    className={`flex items-center gap-2 pb-4 px-2 border-b-2 font-medium transition ${activeTab === 'review'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    <RefreshCw size={20} />
                    Review
                </button>
            </div>

            <div className="min-h-[600px]">
                {user && (
                    activeTab === 'memorization'
                        ? <QuranMemorizationView userId={user.uid} progress={progress} />
                        : <QuranReviewView userId={user.uid} progress={progress} />
                )}
            </div>
        </div>
    );
}
