import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';


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
    signInAsGuest: () => Promise<void>;
    logout: () => Promise<void>;
    enabledModules: EnabledModules;
    setModuleEnabled: (module: keyof EnabledModules, enabled: boolean) => void;
    setAllModules: (modules: EnabledModules) => void;
    hasCompletedSetup: boolean;
    completeSetup: () => void;
}

const DEFAULT_MODULES: EnabledModules = { habits: true, tasks: true, quran: true };

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('google_access_token'));
    const [enabledModules, setEnabledModules] = useState<EnabledModules>(DEFAULT_MODULES);
    const [hasCompletedSetup, setHasCompletedSetup] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // Load enabled modules for this user
                const savedModules = localStorage.getItem(`modules_${currentUser.uid} `);
                if (savedModules) {
                    try {
                        setEnabledModules(JSON.parse(savedModules));
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
        const provider = new GoogleAuthProvider();
        // provider.addScope('https://www.googleapis.com/auth/calendar.events'); // Removed to avoid verification warning
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
