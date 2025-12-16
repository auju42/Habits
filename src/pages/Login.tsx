import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export default function Login() {
    const { signInWithGoogle, user } = useAuth();

    if (user) {
        return <Navigate to="/" />;
    }

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-blue-500/10 rounded-full">
                        <CheckCircle2 className="w-12 h-12 text-blue-500" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-center text-white mb-2">
                    Habit Tracker
                </h1>
                <p className="text-gray-400 text-center mb-8">
                    Build better habits, one day at a time.
                </p>

                <button
                    onClick={signInWithGoogle}
                    className="w-full bg-white text-gray-900 hover:bg-gray-100 font-semibold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-3"
                >
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        className="w-5 h-5"
                    />
                    Sign in with Google
                </button>
            </div>
        </div>
    );
}
