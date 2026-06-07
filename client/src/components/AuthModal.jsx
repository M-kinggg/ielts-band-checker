import React, { useState } from 'react';
import { X, Mail, Lock, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { signIn, signUp } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic Validations
    if (!email || !password) {
      setError("Please fill out all fields.");
      return;
    }

    if (activeTab === 'signup' && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (activeTab === 'login') {
        const { data, error: authError } = await signIn(email, password);
        if (authError) throw authError;
      } else {
        const { data, error: authError } = await signUp(email, password);
        if (authError) throw authError;
      }
      onClose(); // Close modal on success
    } catch (err) {
      console.error(err);
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-[#1C1917]/75 backdrop-blur-md transition-opacity duration-300" 
      />

      {/* Modal Card */}
      <div 
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl shadow-yellow-600/5 border animate-in fade-in zoom-in-95 duration-300"
        style={{
          background: 'rgba(28,25,23,0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(202,138,4,0.3)'
        }}
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#CA8A04] transition-all duration-300 cursor-pointer"
          title="Close dialog"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Header Tabs */}
        <div className="flex border-b border-[#44403C]/50 bg-[#1C1917]/40">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all duration-300 cursor-pointer ${
              activeTab === 'login'
                ? 'border-[#CA8A04] text-[#CA8A04] bg-[#CA8A04]/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#CA8A04]/5'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchTab('signup')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all duration-300 cursor-pointer ${
              activeTab === 'signup'
                ? 'border-[#CA8A04] text-[#CA8A04] bg-[#CA8A04]/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#CA8A04]/5'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
          
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-slate-200 flex items-center justify-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#CA8A04] animate-pulse" />
              {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h3>
            <p className="text-xs text-slate-400 font-light">
              {activeTab === 'login' 
                ? 'Sign in to save and sync your IELTS band scores' 
                : 'Register to start tracking your essay history online'}
            </p>
          </div>

          {/* Error display */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-450 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#1C1917]/55 text-sm border border-[#44403C] rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/20 text-slate-200 placeholder-slate-650 transition-all duration-300"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-450 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1C1917]/55 text-sm border border-[#44403C] rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/20 text-slate-200 placeholder-slate-650 transition-all duration-300"
              />
            </div>
          </div>

          {/* Confirm Password (only on Sign Up) */}
          {activeTab === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-455 block">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1C1917]/55 text-sm border border-[#44403C] rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/20 text-slate-200 placeholder-slate-655 transition-all duration-300"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-gold w-full text-xs font-bold uppercase tracking-wider py-3 mt-4"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#0C0A09]" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{activeTab === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
