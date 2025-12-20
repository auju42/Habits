export interface PageProgress {
    pageNumber: number;
    completedDate: string; // YYYY-MM-DD
}

export interface JuzReview {
    juzNumber: number;
    reviewDates: string[]; // List of YYYY-MM-DD
}

export type JuzStrength = 'strong' | 'medium' | 'weak' | null;


export interface QuranProgress {
    userId: string;
    memorizedPages: Record<number, string>; // pageNumber -> YYYY-MM-DD
    juzReviews: Record<number, string[]>; // juzNumber -> YYYY-MM-DD[] (Legacy/Aggregate)
    hizbReviews?: Record<number, string[]>; // hizbNumber (1-60) -> YYYY-MM-DD[]
    juzStrengths?: Record<number, JuzStrength>; // juzNumber -> strength
}

export const TOTAL_PAGES = 604;
export const TOTAL_JUZ = 30;

// Standard Madani Mushaf Start Pages for each Juz (1-30)
// Index 0 is dummy, Index 1 is Juz 1 start page, etc.
export const JUZ_START_PAGES = [
    0, 1, 22, 42, 62, 82, 102, 122, 142, 162, 182, 202, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582
];

export const getJuzPageRange = (juz: number) => {
    if (juz < 1 || juz > 30) return { start: 0, end: 0, total: 0 };
    const start = JUZ_START_PAGES[juz];
    const end = juz === 30 ? 604 : JUZ_START_PAGES[juz + 1] - 1;
    return { start, end, total: end - start + 1 };
};

export const PAGES_PER_JUZ = 20; // Deprecated, use getJuzPageRange instead
