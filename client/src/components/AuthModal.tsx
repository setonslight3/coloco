'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Mail, Key, User, LogIn, UserPlus, LogOut, ShieldCheck, Trophy, History } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);
    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ text: 'Logged in successfully!', type: 'success' });
      onAuthSuccess(data.user);
      setTimeout(onClose, 800);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.trim() || email.split('@')[0] }
      }
    });

    if (error) {
      setLoading(false);
      setMessage({ text: error.message, type: 'error' });
      return;
    }

    if (data.user) {
      // Upsert profile in public.profiles table
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: username.trim() || email.split('@')[0]
      });

      // Auto-sign in immediately
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      setLoading(false);
      if (!signInError && signInData.user) {
        setMessage({ text: 'Account created! Welcome to ColoCo!', type: 'success' });
        onAuthSuccess(signInData.user);
        setTimeout(onClose, 900);
      } else {
        setMessage({ text: 'Account registered! Please sign in with your password to continue.', type: 'success' });
        setTab('login');
      }
    } else {
      setLoading(false);
      setMessage({ text: 'Account registered! Please sign in with your credentials.', type: 'success' });
      setTab('login');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : 'https://coloco-game.vercel.app'
    });

    setLoading(false);
    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ text: 'Password reset link sent to your email!', type: 'success' });
      setTimeout(onClose, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn">
      <div className="bg-white dark:bg-navy-900 border border-sky-200/80 dark:border-navy-700 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-navy-700 flex items-center justify-between bg-slate-50 dark:bg-navy-800/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-500" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              {tab === 'login' ? 'Painter Sign In' : tab === 'signup' ? 'Create Artist Account' : 'Reset Password'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-100 dark:bg-navy-800 m-5 mb-3 rounded-2xl">
          <button
            type="button"
            onClick={() => { setTab('login'); setMessage(null); }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'login'
                ? 'bg-white dark:bg-navy-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setMessage(null); }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'signup'
                ? 'bg-white dark:bg-navy-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => { setTab('reset'); setMessage(null); }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'reset'
                ? 'bg-white dark:bg-navy-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Reset
          </button>
        </div>

        {/* Message notification */}
        {message && (
          <div
            className={`mx-5 p-3 rounded-xl text-xs font-semibold ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Forms */}
        <form
          onSubmit={tab === 'login' ? handleLogin : tab === 'signup' ? handleSignup : handlePasswordReset}
          className="p-5 pt-2 space-y-4"
        >
          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Artist Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. VanGogh99"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="painter@example.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {tab !== 'reset' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-500 hover:opacity-95 text-white font-black text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              'Processing...'
            ) : tab === 'login' ? (
              <>
                <LogIn className="w-4 h-4" /> Sign In
              </>
            ) : tab === 'signup' ? (
              <>
                <UserPlus className="w-4 h-4" /> Register Account
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
