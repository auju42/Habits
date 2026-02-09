import { useState } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import SmartDatePicker from '../common/SmartDatePicker';

interface Props {
    pageNumber: number;
    isMemorized: boolean;
    memorizedDate?: string;
    onConfirm: (date: string) => void;
    onRemove: () => void;
    onClose: () => void;
}

export default function PageDatePickerModal({ pageNumber, isMemorized, memorizedDate, onConfirm, onRemove, onClose }: Props) {
    const [selectedDate, setSelectedDate] = useState(memorizedDate || format(new Date(), 'yyyy-MM-dd'));

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Page {pageNumber}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {isMemorized ? (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            This page was memorized on <span className="font-semibold">{memorizedDate}</span>
                        </p>
                        <button
                            onClick={onRemove}
                            className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-md transition font-medium"
                        >
                            Remove Memorization
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <SmartDatePicker
                            value={selectedDate}
                            onChange={setSelectedDate}
                            max={format(new Date(), 'yyyy-MM-dd')}
                        />
                        <button
                            onClick={() => onConfirm(selectedDate)}
                            className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-md transition font-medium"
                        >
                            Mark as Memorized
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
