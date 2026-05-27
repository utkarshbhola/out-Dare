import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CheckCircle2, Star, Sparkles, MapPin } from 'lucide-react';
import Link from 'next/link';

export default async function WelcomePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/');
  }

  const name = user.user_metadata?.full_name || 'there';

  return (
    <div className="min-h-screen bg-[#0E0B08] text-[#F5EDD8] font-sans overflow-x-hidden flex flex-col items-center justify-center p-6 relative">
      {/* Background Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full max-h-[800px] bg-[#C4622D]/10 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="glass-panel p-10 md:p-14 rounded-[40px] max-w-2xl w-full text-center relative z-10 border border-[#E07340]/20 shadow-2xl bg-[#0E0B08]/80 backdrop-blur-xl">
        <div className="w-20 h-20 bg-gradient-to-br from-[#C4622D]/20 to-[#E07340]/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#E07340]/40">
          <CheckCircle2 size={40} className="text-[#E07340]" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
          Welcome to the club, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C4622D] to-[#E07340]">{name}</span>.
        </h1>
        
        <p className="text-[#9C8B72] text-lg mb-10 max-w-lg mx-auto leading-relaxed">
          You're officially on the exclusive waitlist for OutThere. We'll send you an email as soon as we open up spots in your city.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 text-left">
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col items-center text-center">
            <Star className="text-[#E07340] mb-3" size={24} />
            <h3 className="font-bold text-sm mb-1">Founding Member</h3>
            <p className="text-[10px] text-[#9C8B72]">Special badge unlocked</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col items-center text-center">
            <MapPin className="text-[#E07340] mb-3" size={24} />
            <h3 className="font-bold text-sm mb-1">City Access</h3>
            <p className="text-[10px] text-[#9C8B72]">Priority invite in Bangalore</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col items-center text-center">
            <Sparkles className="text-[#E07340] mb-3" size={24} />
            <h3 className="font-bold text-sm mb-1">Early Features</h3>
            <p className="text-[10px] text-[#9C8B72]">Test the AI Concierge</p>
          </div>
        </div>

        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[#9C8B72] hover:text-[#E07340] transition-colors text-sm font-bold uppercase tracking-wider"
        >
          Return to Home
        </Link>
      </div>

      {/* Footer */}
      <footer className="mt-20 text-center text-xs text-[#9C8B72] z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-[4px] bg-gradient-to-br from-[#C4622D] to-[#E07340] flex items-center justify-center font-serif text-[10px] font-bold text-white">
            O
          </div>
          <span className="font-serif font-bold text-white">OutThere</span>
        </div>
        <p>© 2026 OutThere Technologies.</p>
      </footer>
    </div>
  );
}
