"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Mail, User, Sparkles, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function AuthPageContent() {
  const searchParams = useSearchParams();
  const defaultMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const redirectNext = searchParams.get('next') || '/discover';

  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync mode if query parameter changes
  useEffect(() => {
    const qMode = searchParams.get('mode');
    if (qMode === 'signup' || qMode === 'login') {
      setMode(qMode);
    }
  }, [searchParams]);

  const handleAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || (mode === 'signup' && !name.trim())) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      
      // Determine emailRedirectTo so user gets sent to the callback
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      if (redirectNext) {
        callbackUrl.searchParams.set('next', redirectNext);
      }

      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: mode === 'signup' ? { full_name: name } : undefined,
          emailRedirectTo: callbackUrl.toString(),
        },
      });

      if (authError) throw authError;

      setIsSuccess(true);
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Unable to send magic link. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0B08] text-[#F5EDD8] font-sans selection:bg-[#E07340]/30 overflow-x-hidden flex flex-col justify-between relative">
      
      {/* Background radial glowing gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#C4622D]/10 rounded-full filter blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-[#E07340]/5 rounded-full filter blur-[100px] pointer-events-none z-0"></div>

      {/* Header */}
      <header className="w-full z-10 px-6 py-6 max-w-7xl mx-auto flex justify-between items-center relative">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C4622D] to-[#E07340] flex items-center justify-center font-serif text-2xl font-bold shadow-[0_0_20px_rgba(196,98,45,0.4)] group-hover:scale-105 transition-transform duration-300">
            O
          </div>
          <span className="font-serif text-2xl font-bold tracking-wide group-hover:text-white transition-colors">
            Out-Dare
          </span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-[#9C8B72] hover:text-[#F5EDD8] transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Form Area */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 z-10 relative">
        <div className="w-full max-w-md">
          
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.5 }}
                className="glass-panel p-8 md:p-10 rounded-[32px] border border-[#E07340]/20 text-center relative overflow-hidden bg-[#0E0B08]/85 backdrop-blur-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#E07340]/10 rounded-full filter blur-[40px] pointer-events-none" />

                <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400">
                  <CheckCircle2 size={32} />
                </div>

                <h3 className="text-2xl md:text-3xl font-serif font-bold mb-3">
                  Check your inbox!
                </h3>

                <p className="text-[#9C8B72] text-sm mb-6 leading-relaxed">
                  We've sent an email magic link to <br />
                  <span className="text-[#F5EDD8] font-semibold break-all">{email}</span>.
                </p>

                <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/5">
                  <p className="text-xs text-[#9C8B72] leading-relaxed">
                    Click the link in the email to verify your address, establish your session, and continue your entry into the closed beta.
                  </p>
                </div>

                <button
                  onClick={() => setIsSuccess(false)}
                  className="text-xs text-[#E07340] hover:underline font-semibold"
                >
                  Didn't receive it? Try again
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="glass-panel p-8 md:p-10 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden bg-[#0E0B08]/80 backdrop-blur-xl"
              >
                {/* Header elements */}
                <div className="mb-8 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E07340]/10 border border-[#E07340]/25 text-[#E07340] text-xs font-bold mb-4">
                    <Sparkles size={12} />
                    <span>Out-Dare Closed Beta</span>
                  </div>
                  
                  <h2 className="text-3xl font-serif font-bold tracking-tight mb-2">
                    {mode === 'login' ? 'Welcome back' : 'Create an account'}
                  </h2>
                  
                  <p className="text-[#9C8B72] text-sm">
                    {mode === 'login' 
                      ? 'Sign in to access your tribe' 
                      : 'Secure your invite spot in the closed beta'}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleAuthentication} className="space-y-4">
                  {mode === 'signup' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#9C8B72] pl-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9C8B72] pointer-events-none">
                          <User size={16} />
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="Aisha Sharma"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-[#16120E] border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 focus:border-[#E07340]/50 focus:outline-none transition-all text-sm text-white placeholder:text-[#9C8B72]/50"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#9C8B72] pl-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9C8B72] pointer-events-none">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#16120E] border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 focus:border-[#E07340]/50 focus:outline-none transition-all text-sm text-white placeholder:text-[#9C8B72]/50"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-start gap-2 leading-relaxed"
                    >
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full relative overflow-hidden group bg-gradient-to-r from-[#C4622D] to-[#E07340] text-white px-6 py-4 rounded-2xl font-bold shadow-[0_0_20px_rgba(196,98,45,0.3)] hover:shadow-[0_0_28px_rgba(196,98,45,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending Link...
                      </span>
                    ) : (
                      <span>{mode === 'login' ? 'Send Magic Link' : 'Register & Join Beta'}</span>
                    )}
                  </button>
                </form>

                {/* Mode Selector Toggle */}
                <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm">
                  {mode === 'login' ? (
                    <p className="text-[#9C8B72]">
                      New to Out-Dare?{' '}
                      <button
                        onClick={() => setMode('signup')}
                        className="text-[#E07340] hover:underline font-semibold"
                      >
                        Request early access
                      </button>
                    </p>
                  ) : (
                    <p className="text-[#9C8B72]">
                      Already have an account?{' '}
                      <button
                        onClick={() => setMode('login')}
                        className="text-[#E07340] hover:underline font-semibold"
                      >
                        Log in here
                      </button>
                    </p>
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-6 text-center text-xs text-[#9C8B72] z-10 relative">
        <p>© 2026 Out-Dare. Closed Beta Access. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0E0B08] text-[#F5EDD8] flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-[#E07340]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}
