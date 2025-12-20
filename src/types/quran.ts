export interface PageProgress {
    pageNumber: number;
    completedDate: string; // YYYY-MM-DD
}

export interface JuzReview {
    juzNumber: number;
    reviewDates: string[]; // List of YYYY-MM-DD
}

export interface QuranProgress {
    userId: string;
    memorizedPages: Record<number, string>; // pageNumber -> YYYY-MM-DD
    juzReviews: Record<number, string[]>; // juzNumber -> YYYY-MM-DD[]
}

export const TOTAL_PAGES = 604;
export const TOTAL_JUZ = 30;
export const PAGES_PER_JUZ = 20; // Approx, for UI rendering
