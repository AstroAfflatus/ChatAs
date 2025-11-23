import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../App';
import { Phone, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

export const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Sign Up
        // Note: We create the auth user first. The profile setup component 
        // will handle saving the phone number to the DB later if it's missing from Auth.
        // But here we can temporarily store it in localStorage or pass it via context if needed.
        // For simplicity, we'll store phone in localStorage to retrieve in ProfileSetup.
        if (phone) localStorage.setItem('signup_phone', phone);
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/permission-denied') {
          setError('Permission denied. Please check network.');
      } else {
          setError(err.message.replace('Firebase:', '').trim());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-bg p-4">
      <div className="w-full max-w-md space-y-8 bg-dark-container p-8 rounded-2xl border border-dark-surface shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary">ChatAs</h2>
          <p className="mt-2 text-text-secondary">{isLogin ? 'Welcome back' : 'Create an account'}</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-text-secondary" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-dark-surface rounded-lg bg-dark-surface text-text-primary placeholder-text-secondary focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Email address"
              />
            </div>

            {!isLogin && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-text-secondary" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-dark-surface rounded-lg bg-dark-surface text-text-primary placeholder-text-secondary focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Phone Number (e.g., +1234567890)"
                />
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-text-secondary" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-dark-surface rounded-lg bg-dark-surface text-text-primary placeholder-text-secondary focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-primary hover:text-primary-light transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};