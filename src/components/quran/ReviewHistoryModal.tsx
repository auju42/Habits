import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react';

interface Props {
    juzNumber: number;
    reviewDates: string[];
    onRemoveReview: (date: string) => void;
    onClose: () => void;
}

export default function ReviewHistoryModal({ juzNumber, reviewDates, onRemoveReview, onClose }: Props) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOffset = getDay(monthStart);

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    // Reviews in this month
    const reviewsThisMonth = reviewDates.filter(d => {
        const date = parseISO(d);
        return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Juz {juzNumber} Review History
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Total reviews: <span className="font-semibold text-indigo-500">{reviewDates.length}</span>
                </div>

                {/* Calendar Navigation */}
                <div className="flex items-center justify-between mb-4">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                    {Array.from({ length: startDayOffset }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                    ))}

                    {daysInMonth.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const hasReview = reviewDates.includes(dateStr);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={dateStr}
                                className={`
                                    aspect-square rounded flex items-center justify-center text-xs
                                    ${hasReview ? 'bg-indigo-500 text-white font-medium' : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400'}
                                    ${isToday ? 'ring-2 ring-yellow-400' : ''}
                                `}
                            >
                                {format(day, 'd')}
                            </div>
                        );
                    })}
                </div>

                {/* Reviews this month list */}
                {reviewsThisMonth.length > 0 && (
                    <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Reviews this month ({reviewsThisMonth.length})
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {reviewsThisMonth.sort().reverse().map(date => (
                                <div key={date} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">{format(parseISO(date), 'EEEE, MMM d')}</span>
                                    <button
                                        onClick={() => onRemoveReview(date)}
                                        className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                        title="Remove review"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
