import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { CheckCircle2, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Login() {
    const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuest, user } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    if (user) {
        return <Navigate to="/" />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isSignUp) {
                await signUpWithEmail(email, password);
            } else {
                await signInWithEmail(email, password);
            }
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error(err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Invalid email or password.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else {
                setError('Failed to sign in. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            setError('Please enter your email address first.');
            return;
        }
        setError(null);
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setResetSent(true);
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/user-not-found') {
                setError('No account found with this email.');
            } else {
                setError('Failed to send reset email. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-blue-500/10 rounded-full">
                        <CheckCircle2 className="w-12 h-12 text-blue-500" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-center text-white mb-2">
                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h1>
                <p className="text-gray-400 text-center mb-8">
                    {isSignUp ? 'Start building better habits today.' : 'Build better habits, one day at a time.'}
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                placeholder="hello@example.com"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>

                    {!isSignUp && (
                        <div className="text-center">
                            {resetSent ? (
                                <span className="text-green-400 text-sm">Password reset email sent!</span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handlePasswordReset}
                                    disabled={loading}
                                    className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
                                >
                                    Forgot password?
                                </button>
                            )}
                        </div>
                    )}
                </form>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-800 text-gray-500">Or continue with</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={signInWithGoogle}
                        className="w-full bg-white text-gray-900 hover:bg-gray-100 font-semibold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-3"
                    >
                        <img
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                            alt="Google"
                            className="w-5 h-5"
                        />
                        Google
                    </button>

                    <button
                        onClick={signInAsGuest}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition duration-200"
                    >
                        Continue as Guest
                    </button>
                </div>

                <div className="mt-8 text-center text-sm text-gray-400">
                    {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="ml-1 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                        {isSignUp ? 'Sign in' : 'Create one'}
                    </button>
                </div>
            </div>
        </div>
    );
}
