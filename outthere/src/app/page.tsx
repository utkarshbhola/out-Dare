"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Compass, Sparkles, MapPin, Map, User, CheckCircle2 } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LandingPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();

      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/welcome`,
        },
      });

      if (authError) throw authError;

      setIsSuccess(true);
    } catch (err: any) {
      console.error("Error joining waitlist:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0B08] text-[#F5EDD8] font-sans selection:bg-[#E07340]/30 overflow-x-hidden">
      
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass-panel border-b border-t-0 border-l-0 border-r-0 px-6 py-4 flex justify-between items-center bg-[#0E0B08]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C4622D] to-[#E07340] flex items-center justify-center font-serif text-2xl font-bold shadow-[0_0_20px_rgba(196,98,45,0.4)]">
            O
          </div>

          <span className="font-serif text-2xl font-bold tracking-wide">
            Out-Dare
          </span>
        </div>
      </header>

      <main>

        {/* Hero Section */}
        <section className="relative pt-40 pb-20 px-6 lg:pt-48 lg:pb-32 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">

          <div className="flex-1 text-center lg:text-left z-10">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E07340]/10 border border-[#E07340]/20 text-[#E07340] text-sm font-semibold mb-8">

                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E07340] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E07340]"></span>
                </span>

                Early Access Opening Soon
              </div>

              {/* Heading */}
              <h1 className="text-5xl lg:text-7xl font-serif font-bold leading-tight mb-6">
                Find your tribe <br />

                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C4622D] to-[#E07340]">
                  tonight.
                </span>
              </h1>

              {/* Description */}
              <p className="text-xl text-[#9C8B72] mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                The real-world social discovery platform for people attending the same events,
                treks, cafés, and experiences. Stop swiping. Start living.
              </p>

              {/* Waitlist Form */}
              <div className="glass-panel p-6 rounded-3xl max-w-md mx-auto lg:mx-0">

                {isSuccess ? (

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6"
                  >

                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-400">
                      <CheckCircle2 size={32} />
                    </div>

                    <h3 className="text-xl font-serif font-bold mb-2">
                      You're on the list!
                    </h3>

                    <p className="text-[#9C8B72] text-sm">
                      We've sent a magic link to{" "}
                      <span className="text-white">{email}</span>.
                      Click it to verify your email and secure your spot.
                    </p>

                  </motion.div>

                ) : (

                  <form onSubmit={handleJoinWaitlist} className="space-y-4">

                    <h3 className="font-serif text-xl font-bold mb-4">
                      Join the early access list
                    </h3>

                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#1a1510] border border-white/10 rounded-xl px-4 py-3 focus:border-[#E07340]/50 focus:outline-none transition text-sm"
                      />
                    </div>

                    <div>
                      <input
                        type="email"
                        required
                        placeholder="Your Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#1a1510] border border-white/10 rounded-xl px-4 py-3 focus:border-[#E07340]/50 focus:outline-none transition text-sm"
                      />
                    </div>

                    {error && (
                      <p className="text-red-400 text-xs">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-[#C4622D] to-[#E07340] text-white px-6 py-3.5 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(196,98,45,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isLoading ? "Securing Spot..." : "Get Early Access"}
                    </button>

                    <p className="text-[10px] text-center text-[#9C8B72] mt-4">
                      By joining, you agree to receive updates about Out-Dare.
                    </p>

                  </form>
                )}
              </div>
            </motion.div>
          </div>

          {/* Mockup Section */}
          <div className="flex-1 relative w-full max-w-lg lg:max-w-none hidden md:block">

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#C4622D]/20 rounded-full filter blur-[100px] pointer-events-none"></div>

              <div className="relative glass-card rounded-[40px] p-2 border-white/10 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 z-10 bg-[#0E0B08]/80 backdrop-blur-xl">

                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#0E0B08] rounded-full z-20"></div>

                <div className="rounded-[32px] overflow-hidden border border-white/5 bg-[#110d0a] h-[600px] w-[300px] relative flex flex-col">

                  <div className="p-5 pt-12 flex-1 flex flex-col">

                    <h3 className="font-serif font-bold text-xl mb-4 text-[#E07340]">
                      Tonight's Radar
                    </h3>

                    <div className="space-y-3">

                      {[
                        { emoji: "🎸", title: "Indie Nights", count: 12 },
                        { emoji: "☕", title: "Coffee Tasting", count: 8 },
                        { emoji: "🍸", title: "Mixology 101", count: 24 }
                      ].map((item, i) => (

                        <div
                          key={i}
                          className="bg-white/5 p-3 rounded-2xl flex items-center gap-3 border border-white/5"
                        >

                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
                            {item.emoji}
                          </div>

                          <div>
                            <h4 className="font-bold text-sm">
                              {item.title}
                            </h4>

                            <p className="text-[#9C8B72] text-[10px]">
                              {item.count} people interested
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* AI Concierge */}
                    <div className="mt-auto glass-panel p-4 rounded-2xl border border-[#E07340]/20">

                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-[#E07340]" />
                        <span className="text-xs font-bold">
                          AI Concierge
                        </span>
                      </div>

                      <p className="text-[10px] text-[#9C8B72]">
                        "Found 3 events nearby matching your vibe tonight."
                      </p>

                    </div>
                  </div>

                  {/* Bottom Nav */}
                  <div className="h-16 bg-[#0E0B08]/90 border-t border-white/5 flex items-center justify-around px-4">
                    <Compass size={20} className="text-[#E07340]" />
                    <Map size={20} className="text-[#9C8B72]" />
                    <User size={20} className="text-[#9C8B72]" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-6 relative border-t border-white/5 bg-gradient-to-b from-transparent to-[#110d0a]">

          <div className="max-w-7xl mx-auto">

            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">
                What's to come
              </h2>

              <p className="text-[#9C8B72] max-w-2xl mx-auto">
                Experience social discovery designed for the real world.
                No endless swiping, just genuine experiences.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              <FeatureCard
                icon={<MapPin size={24} className="text-[#E07340]" />}
                title="Live Discovery Map"
                description="See what's happening around you in real-time. Explore events, cafés, communities, and experiences nearby."
              />

              <FeatureCard
                icon={<Compass size={24} className="text-[#E07340]" />}
                title="Real-World Connections"
                description="Meet people through shared experiences instead of endless swiping and superficial matching."
              />

              <FeatureCard
                icon={<Sparkles size={24} className="text-[#E07340]" />}
                title="AI Concierge"
                description="Your personal guide for discovering experiences, social plans, and hidden gems around you."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-sm text-[#9C8B72]">

        <div className="flex items-center justify-center gap-2 mb-2">

          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#C4622D] to-[#E07340] flex items-center justify-center font-serif text-xs font-bold text-white">
            O
          </div>

          <span className="font-serif font-bold text-white">
            Out-Dare
          </span>
        </div>

        <p>© 2026 Out-Dare. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-card p-8 rounded-3xl group hover:-translate-y-2 transition-transform duration-300">

      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/10 group-hover:border-[#E07340]/30">
        {icon}
      </div>

      <h3 className="text-xl font-serif font-bold mb-3">
        {title}
      </h3>

      <p className="text-[#9C8B72] text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}