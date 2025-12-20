import { db } from '../lib/firebase';
import {
    doc,
    setDoc,
    updateDoc,
    deleteField,
    onSnapshot,
    serverTimestamp,
} from 'firebase/firestore';
import type { QuranProgress, JuzStrength } from '../types/quran';

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
        juzStrengths: {},
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
    }
};

export const removePageMemorization = async (userId: string, pageNumber: number, progress: QuranProgress | null) => {
    if (!progress?.memorizedPages?.[pageNumber]) return;

    const docRef = doc(db, `users/${userId}/${COLLECTION_NAME}/main`);

    // Use deleteField to remove the specific key from the map
    await updateDoc(docRef, {
        [`memorizedPages.${pageNumber}`]: deleteField(),
        updatedAt: serverTimestamp()
    });
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

export const setJuzStrength = async (userId: string, juzNumber: number, strength: JuzStrength, progress: QuranProgress | null) => {
    const docRef = doc(db, `users/${userId}/${COLLECTION_NAME}/main`);

    if (!progress) {
        await initializeQuranProgress(userId);
    }

    const currentStrengths = progress?.juzStrengths || {};
    const newStrengths = { ...currentStrengths, [juzNumber]: strength };


    await setDoc(docRef, {
        juzStrengths: newStrengths,
        updatedAt: serverTimestamp()
    }, { merge: true });
};

export const logHizbReview = async (userId: string, hizbNumber: number, date: string, progress: QuranProgress | null) => {
    const docRef = doc(db, `users/${userId}/${COLLECTION_NAME}/main`);

    if (!progress) {
        await initializeQuranProgress(userId);
    }

    const currentHizbReviews = progress?.hizbReviews || {};
    const reviewsForHizb = currentHizbReviews[hizbNumber] || [];

    if (!reviewsForHizb.includes(date)) {
        const newReviewsForHizb = [...reviewsForHizb, date].sort();
        const newHizbReviews = { ...currentHizbReviews, [hizbNumber]: newReviewsForHizb };

        // Also update parent Juz review if both Hizbs are done? 
        // For now, we just track Hizbs. The UI will determine if the "Juz" is reviewed.

        await setDoc(docRef, {
            hizbReviews: newHizbReviews,
            updatedAt: serverTimestamp()
        }, { merge: true });
    }
};

export const removeHizbReview = async (userId: string, hizbNumber: number, date: string, progress: QuranProgress | null) => {
    if (!progress?.hizbReviews?.[hizbNumber]) return;

    const docRef = doc(db, `users/${userId}/${COLLECTION_NAME}/main`);
    const currentHizbReviews = { ...progress.hizbReviews };
    const reviewsForHizb = currentHizbReviews[hizbNumber] || [];

    const newReviewsForHizb = reviewsForHizb.filter(d => d !== date);
    currentHizbReviews[hizbNumber] = newReviewsForHizb;

    await setDoc(docRef, {
        hizbReviews: currentHizbReviews,
        updatedAt: serverTimestamp()
    }, { merge: true });
};
