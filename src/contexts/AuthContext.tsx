import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    accessToken: string | null;
    signInWithGoogle: () => Promise<void>;
    signInAsGuest: () => Promise<void>;
    logout: () => Promise<void>;
    appMode: 'habits' | 'quran' | 'both' | null;
    setAppMode: (mode: 'habits' | 'quran' | 'both') => void;
}

export type AppMode = 'habits' | 'quran' | 'both';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('google_access_token'));
    const [appMode, setAppModeState] = useState<AppMode | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

            // Load app mode for this user if exists
            if (currentUser) {
                const savedMode = localStorage.getItem(`app_mode_${currentUser.uid}`) as AppMode | null;
                if (savedMode) {
                    setAppModeState(savedMode);
                }
            } else {
                setAppModeState(null);
            }

            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/calendar.events');
        try {
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
                setAccessToken(credential.accessToken);
                localStorage.setItem('google_access_token', credential.accessToken);
            }
        } catch (error) {
            console.error("Error signing in with Google", error);
            throw error;
        }
    };

    const signInAsGuest = async () => {
        try {
            // Dynamically import to keep bundle size optimized if desired, though standard import is fine here
            const { signInAnonymously } = await import('firebase/auth');
            await signInAnonymously(auth);
        } catch (error) {
            console.error("Error signing in as guest", error);
            throw error;
        }
    };

    const logout = async () => {
        await signOut(auth);
        setAccessToken(null);
        localStorage.removeItem('google_access_token');
        setAppModeState(null);
    };

    const setAppMode = (mode: AppMode) => {
        setAppModeState(mode);
        if (user) {
            localStorage.setItem(`app_mode_${user.uid}`, mode);
        }
    };

    const value = {
        user,
        loading,
        accessToken,
        signInWithGoogle,
        signInAsGuest,
        logout,
        appMode,
        setAppMode
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
