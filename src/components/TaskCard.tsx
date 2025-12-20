import { Check, Trash2, Calendar, RefreshCw } from 'lucide-react';
import type { Task } from '../types';
import { cn } from '../lib/utils';
import { format, parseISO, isPast, isToday } from 'date-fns';

interface TaskCardProps {
    task: Task;
    onToggle: () => void;
    onDelete: () => void;
}

const priorityColors = {
    low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
    const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate)) && !task.completed;
    const isDueToday = task.dueDate && isToday(parseISO(task.dueDate));

    return (
        <div className={cn(
            "bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border transition-all",
            task.completed
                ? "border-gray-200 dark:border-gray-700 opacity-60"
                : isOverdue
                    ? "border-red-300 dark:border-red-800"
                    : "border-gray-200 dark:border-gray-700 hover:shadow-md"
        )}>
            <div className="flex items-start gap-4">
                <button
                    onClick={onToggle}
                    className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                        task.completed
                            ? "bg-green-500 text-white"
                            : "border-2 border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500"
                    )}
                >
                    {task.completed && <Check className="w-4 h-4" />}
                </button>

                <div className="flex-1 min-w-0">
                    <h3 className={cn(
                        "font-medium text-gray-900 dark:text-white",
                        task.completed && "line-through text-gray-500 dark:text-gray-400"
                    )}>
                        {task.title}
                    </h3>

                    {task.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {task.description}
                        </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={cn("text-xs px-2 py-1 rounded-full font-medium", priorityColors[task.priority])}>
                            {task.priority}
                        </span>

                        {task.dueDate && (
                            <span className={cn(
                                "text-xs flex items-center gap-1",
                                isOverdue && "text-red-500",
                                isDueToday && !task.completed && "text-orange-500",
                                !isOverdue && !isDueToday && "text-gray-500 dark:text-gray-400"
                            )}>
                                <Calendar className="w-3 h-3" />
                                {format(parseISO(task.dueDate), 'MMM d')}
                                {isOverdue && ' (overdue)'}
                                {isDueToday && !task.completed && ' (today)'}
                            </span>
                        )}

                        {task.isRecurring && (
                            <span className="text-xs flex items-center gap-1 text-blue-500 dark:text-blue-400">
                                <RefreshCw className="w-3 h-3" />
                                {task.recurrence}
                            </span>
                        )}
                    </div>
                </div>

                <button
                    onClick={onDelete}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
