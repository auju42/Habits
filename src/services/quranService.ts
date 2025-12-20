import { db } from '../lib/firebase';
import {
    collection,
    doc,
    setDoc,
    onSnapshot,
    serverTimestamp,
    getDocs,
    query,
    where,
    limit
} from 'firebase/firestore';
import type { QuranProgress } from '../types/quran';
import { addHabit, setHabitCompletion } from './habitService';
import type { Habit } from '../types';

const COLLECTION_NAME = 'quran_progress';

export const subscribeToQuranProgress = (userId: string, callback: (progress: QuranProgress | null) => void) => {
    const docRef = doc(db, `users/${userId}/${COLLECTION_NAME}/main`);

    return onSnapshot(docRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            callback(docSnapshot.data() as QuranProgress);
        } else {
            callback(null);
        }
    });
};

export const initializeQuranProgress = async (userId: string) => {
    const docRef = doc(db, `users/${userId}/${COLLECTION_NAME}/main`);
    await setDoc(docRef, {
        userId,
        memorizedPages: {},
        juzReviews: {},
        updatedAt: serverTimestamp()
    });
};

export const markPageAsMemorized = async (userId: string, pageNumber: number, date: string, progress: QuranProgress | null) => {
    const docRef = doc(db, `users/${userId}/${COLLECTION_NAME}/main`);

    if (!progress) {
        await initializeQuranProgress(userId);
    }

    const currentMemorized = progress?.memorizedPages || {};
    const newMemorized = { ...currentMemorized, [pageNumber]: date };

    await setDoc(docRef, {
        memorizedPages: newMemorized,
        updatedAt: serverTimestamp()
    }, { merge: true });

    // Update "Memorize a page" habit
    await updateLinkedHabit(userId, "Memorize a page", date);
};

export const logJuzReview = async (userId: string, juzNumber: number, date: string, progress: QuranProgress | null) => {
    const docRef = doc(db, `users/${userId}/${COLLECTION_NAME}/main`);

    if (!progress) {
        await initializeQuranProgress(userId);
    }

    const currentReviews = progress?.juzReviews || {};
    const currentJuzReviews = currentReviews[juzNumber] || [];

    if (!currentJuzReviews.includes(date)) {
        const newJuzReviews = [...currentJuzReviews, date].sort();
        const newReviews = { ...currentReviews, [juzNumber]: newJuzReviews };

        await setDoc(docRef, {
            juzReviews: newReviews,
            updatedAt: serverTimestamp()
        }, { merge: true });

        // Update "Review a Juz" habit
        await updateLinkedHabit(userId, "Review a Juz", date);
    }
};

export const removePageMemorization = async (userId: string, pageNumber: number, progress: QuranProgress | null) => {
    if (!progress?.memorizedPages?.[pageNumber]) return;

    const docRef = doc(db, `users/${userId}/${COLLECTION_NAME}/main`);
    const currentMemorized = { ...progress.memorizedPages };
    delete currentMemorized[pageNumber];

    await setDoc(docRef, {
        memorizedPages: currentMemorized,
        updatedAt: serverTimestamp()
    }, { merge: true });
};

export const removeJuzReview = async (userId: string, juzNumber: number, date: string, progress: QuranProgress | null) => {
    if (!progress?.juzReviews?.[juzNumber]) return;

    const docRef = doc(db, `users/${userId}/${COLLECTION_NAME}/main`);
    const currentReviews = { ...progress.juzReviews };
    const currentJuzReviews = currentReviews[juzNumber] || [];

    const newJuzReviews = currentJuzReviews.filter(d => d !== date);
    currentReviews[juzNumber] = newJuzReviews;

    await setDoc(docRef, {
        juzReviews: currentReviews,
        updatedAt: serverTimestamp()
    }, { merge: true });
};

const updateLinkedHabit = async (userId: string, habitName: string, date: string) => {
    // Find the habit by name
    const q = query(
        collection(db, `users/${userId}/habits`),
        where('name', '==', habitName),
        limit(1)
    );
    const snapshot = await getDocs(q);

    let habit: Habit;

    if (snapshot.empty) {
        // Create if doesn't exist. Note: Since we need the ID to update, we'll create it now.
        // But addHabit is async and we need to wait for it.
        // Actually simplest is to just create it.
        await addHabit(userId, habitName, 'simple');
        // Now fetch it again to be safe and get the ID? Or simpler, addHabit creates it.
        // Ideally we should probably ensure these habits exist on app start or first use of feature.
        // For now, let's try to fetch again or just creating one means next time we find it.
        // Wait, addHabit returns void in current implementation? Let's check.
        // Yes it returns void. 
        // Let's fetch again.
        const retrySnapshot = await getDocs(q);
        if (retrySnapshot.empty) return; // Should not happen
        habit = { id: retrySnapshot.docs[0].id, ...retrySnapshot.docs[0].data() } as Habit;
    } else {
        habit = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Habit;
    }

    await setHabitCompletion(userId, habit, date, true);
}
