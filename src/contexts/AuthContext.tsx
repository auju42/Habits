import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithCredential, signOut, type User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';


export interface EnabledModules {
    habits: boolean;
    tasks: boolean;
    quran: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    accessToken: string | null;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string) => Promise<void>;
    signInAsGuest: () => Promise<void>;
    logout: () => Promise<void>;
    enabledModules: EnabledModules;
    setModuleEnabled: (module: keyof EnabledModules, enabled: boolean) => void;
    setAllModules: (modules: EnabledModules) => void;
    hasCompletedSetup: boolean;
    completeSetup: () => void;
}

const DEFAULT_MODULES: EnabledModules = { habits: true, tasks: false, quran: true };

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('google_access_token'));
    const [enabledModules, setEnabledModules] = useState<EnabledModules>(DEFAULT_MODULES);
    const [hasCompletedSetup, setHasCompletedSetup] = useState(false);

    // Check if running on native platform (Capacitor)
    const isNative = Capacitor.isNativePlatform();

    useEffect(() => {
        // Initialize Native Google Auth
        if (isNative) {
            GoogleAuth.initialize({
                clientId: '183255939378-g58pvmqmuujm7nhsu5ptrl5rl5oitc5f.apps.googleusercontent.com',
                scopes: ['profile', 'email'],
                grantOfflineAccess: true,
            });
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // Load enabled modules for this user
                const savedModules = localStorage.getItem(`modules_${currentUser.uid} `);
                if (savedModules) {
                    try {
                        const parsed = JSON.parse(savedModules);
                        // Force disable tasks even if saved as true
                        parsed.tasks = false;
                        setEnabledModules(parsed);
                    } catch {
                        setEnabledModules(DEFAULT_MODULES);
                    }
                } else {
                    setEnabledModules(DEFAULT_MODULES);
                }

                // Check if user has completed setup
                const setupComplete = localStorage.getItem(`setup_complete_${currentUser.uid} `);
                setHasCompletedSetup(setupComplete === 'true');


            } else {
                setEnabledModules(DEFAULT_MODULES);
                setHasCompletedSetup(false);
            }

            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        try {
            if (isNative) {
                // Native Google Sign In
                const googleUser = await GoogleAuth.signIn();
                const idToken = googleUser.authentication.idToken;
                const credential = GoogleAuthProvider.credential(idToken);

                await signInWithCredential(auth, credential);

                // Store token if needed (though Firebase handles auth state)
                if (idToken) {
                    setAccessToken(idToken);
                    localStorage.setItem('google_access_token', idToken);
                }
            } else {
                // Use popup on web
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                const credential = GoogleAuthProvider.credentialFromResult(result);
                if (credential?.accessToken) {
                    setAccessToken(credential.accessToken);
                    localStorage.setItem('google_access_token', credential.accessToken);
                }
            }
        } catch (error: any) {
            console.error("Error signing in with Google", error);
            // Alert for easier debugging on physical device
            alert("Sign-in error: " + (error.message || JSON.stringify(error)));
            throw error;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Error signing in with email", error);
            throw error;
        }
    };

    const signUpWithEmail = async (email: string, password: string) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Error signing up with email", error);
            throw error;
        }
    };

    const signInAsGuest = async () => {
        try {
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
        setEnabledModules(DEFAULT_MODULES);
        setHasCompletedSetup(false);
    };

    const setModuleEnabled = (module: keyof EnabledModules, enabled: boolean) => {
        const newModules = { ...enabledModules, [module]: enabled };
        setEnabledModules(newModules);
        if (user) {
            localStorage.setItem(`modules_${user.uid} `, JSON.stringify(newModules));
        }
    };

    const setAllModules = (modules: EnabledModules) => {
        setEnabledModules(modules);
        if (user) {
            localStorage.setItem(`modules_${user.uid} `, JSON.stringify(modules));
        }
    };

    const completeSetup = () => {
        setHasCompletedSetup(true);
        if (user) {
            localStorage.setItem(`setup_complete_${user.uid} `, 'true');
        }
    };

    const value = {
        user,
        loading,
        accessToken,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAsGuest,
        logout,
        enabledModules,
        setModuleEnabled,
        setAllModules,
        hasCompletedSetup,
        completeSetup
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
