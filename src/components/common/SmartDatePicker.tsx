
import { useState, useEffect } from 'react';
import { format, subDays, isValid, parse, getYear, getMonth, getDate, setYear, setMonth, setDate } from 'date-fns';
import { Calendar, ChevronDown } from 'lucide-react';

interface Props {
    value: string;
    onChange: (date: string) => void;
    max?: string;
}

export default function SmartDatePicker({ value, onChange, max }: Props) {
    const [inputValue, setInputValue] = useState('');

    // Sync input value when prop changes
    useEffect(() => {
        if (value) {
            setInputValue(format(new Date(value), 'yyyy-MM-dd'));
        }
    }, [value]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setInputValue(text);

        // Try to parse the date from text
        // Supported formats: YYYY-MM-DD, DD/MM/YYYY
        let parsedDate: Date | null = null;

        if (text.match(/^\d{4}-\d{2}-\d{2}$/)) {
            parsedDate = parse(text, 'yyyy-MM-dd', new Date());
        } else if (text.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            parsedDate = parse(text, 'dd/MM/yyyy', new Date());
        }

        if (parsedDate && isValid(parsedDate)) {
            // Check max constraint
            if (max && parsedDate > new Date(max)) return;

            onChange(format(parsedDate, 'yyyy-MM-dd'));
        }
    };

    const handleQuickSelect = (daysToSubtract: number) => {
        const date = subDays(new Date(), daysToSubtract);
        onChange(format(date, 'yyyy-MM-dd'));
    };

    const handleDatePartChange = (type: 'year' | 'month' | 'day', val: number) => {
        const currentDate = new Date(value || new Date());
        let newDate = currentDate;

        if (type === 'year') newDate = setYear(currentDate, val);
        if (type === 'month') newDate = setMonth(currentDate, val);
        if (type === 'day') newDate = setDate(currentDate, val);

        if (isValid(newDate)) {
            if (max && newDate > new Date(max)) {
                // If exceeds max, clamp to max (or just ignore? Clamping is better UX usually, but simpler to just set)
                onChange(max);
            } else {
                onChange(format(newDate, 'yyyy-MM-dd'));
            }
        }
    };

    const years = Array.from({ length: 50 }, (_, i) => getYear(new Date()) - i);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    const currentYear = getYear(new Date(value));
    const currentMonth = getMonth(new Date(value));
    const currentDay = getDate(new Date(value));

    return (
        <div className="space-y-3">
            {/* Main Input Area */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-500" />
                </div>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleTextChange}
                    placeholder="YYYY-MM-DD or DD/MM/YYYY"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors"
                />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                    onClick={() => handleQuickSelect(0)}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                >
                    Today
                </button>
                <button
                    onClick={() => handleQuickSelect(1)}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                    Yesterday
                </button>
                <button
                    onClick={() => handleQuickSelect(7)}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                    1 Week Ago
                </button>
            </div>

            {/* Dropdown Selectors */}
            <details className="group">
                <summary className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition select-none">
                    <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
                    <span>Select via Dropdowns</span>
                </summary>

                <div className="grid grid-cols-3 gap-2 mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                    <select
                        value={currentDay}
                        onChange={(e) => handleDatePartChange('day', parseInt(e.target.value))}
                        className="w-full p-1.5 text-sm rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-1 focus:ring-blue-500"
                    >
                        {days.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>

                    <select
                        value={currentMonth}
                        onChange={(e) => handleDatePartChange('month', parseInt(e.target.value))}
                        className="w-full p-1.5 text-sm rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-1 focus:ring-blue-500"
                    >
                        {months.map((m, i) => (
                            <option key={m} value={i}>{m.slice(0, 3)}</option>
                        ))}
                    </select>

                    <select
                        value={currentYear}
                        onChange={(e) => handleDatePartChange('year', parseInt(e.target.value))}
                        className="w-full p-1.5 text-sm rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-1 focus:ring-blue-500"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </details>
        </div>
    );
}
