"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Compass, LogOut, Menu, Sparkles, User, X } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

function NavItem({ icon, label, onClick, badge }: { icon: React.ReactNode; label: string; onClick?: () => void; badge?: number }) {
  return (
    <div onClick={onClick} className="flex items-center gap-3 w-full p-3 rounded-xl cursor-pointer transition-all text-[#9C8B72] hover:bg-white/5 hover:text-[#F5EDD8]">
      <div className="flex-shrink-0">{icon}</div>
      <span className="font-medium hidden md:block text-sm">{label}</span>
      {badge && <span className="ml-auto hidden md:flex w-5 h-5 bg-[#C4622D] rounded-full text-[10px] items-center justify-center text-white font-bold">{badge}</span>}
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        setProfile(userProfile ?? null);
      } catch (e) {
        // ignore
      }
    };
    loadProfile();
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      router.push('/login');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden text-[#F5EDD8] font-sans">
      <div className="md:hidden fixed inset-x-0 top-0 z-50 bg-[#0E0B08]/95 border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#16120E] text-[#F5EDD8] hover:bg-[#1b1713] transition"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C4622D] to-[#E07340] flex items-center justify-center font-serif text-2xl font-bold">O</div>
          <span className="font-serif text-lg font-bold tracking-wide">OutThere</span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#16120E] text-[#F5EDD8] hover:bg-[#1b1713] transition"
        >
          <LogOut size={18} />
        </button>
      </div>

      <nav className="hidden md:flex w-20 md:w-64 glass-panel border-r border-t-0 border-b-0 border-l-0 flex-col items-center md:items-start py-8 z-40 transition-all flex-shrink-0">
        <div className="mb-12 md:px-8 flex items-center justify-center w-full md:justify-start">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C4622D] to-[#E07340] flex items-center justify-center font-serif text-2xl font-bold shadow-[0_0_20px_rgba(196,98,45,0.4)]">O</div>
          <span className="hidden md:block ml-3 font-serif text-2xl font-bold tracking-wide">OutThere</span>
        </div>

        <div className="flex flex-col gap-3 w-full px-3 md:px-6">
          <NavItem icon={<Compass size={20} />} label="Discovery" onClick={() => router.push('/discover')} />
          <NavItem icon={<User size={20} />} label="Profile" onClick={() => router.push('/profile')} />
          <NavItem icon={<Sparkles size={20} />} label="My Events" onClick={() => router.push('/profile/my-events')} />
        </div>

        <div className="mt-auto flex flex-col gap-3 w-full px-3 md:px-6">
          <NavItem icon={<Bell size={20} />} label="Notifications" onClick={() => router.push('/notifications')} />
          <div className="w-full">{profile && (
            <div className="mt-6 hidden md:flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#E07340]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.avatar_url || '/profile-placeholder.png'} alt={profile.name || 'Profile'} className="w-full h-full object-cover" />
              </div>
              <div className="text-sm">{profile.name}</div>
            </div>
          )}</div>
        </div>
      </nav>

      <main className="flex-1 relative overflow-y-auto overflow-x-hidden p-6 pt-20 md:pt-0 bg-[#0E0B08]">
        {children}
      </main>

      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity ${isMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden={!isMenuOpen}
      >
        <div
          className="absolute inset-0 bg-black/60"
          onClick={() => setIsMenuOpen(false)}
        />
        <div className={`absolute inset-y-0 left-0 w-72 bg-[#0E0B08]/95 border-r border-white/10 p-6 transition-transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C4622D] to-[#E07340] flex items-center justify-center font-serif text-2xl font-bold">O</div>
              <span className="font-serif text-lg font-bold tracking-wide">OutThere</span>
            </div>
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#16120E] text-[#F5EDD8] hover:bg-[#1b1713] transition"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3">
            <NavItem icon={<Compass size={20} />} label="Discovery" onClick={() => { router.push('/discover'); setIsMenuOpen(false); }} />
            <NavItem icon={<User size={20} />} label="Profile" onClick={() => { router.push('/profile'); setIsMenuOpen(false); }} />
            <NavItem icon={<Sparkles size={20} />} label="My Events" onClick={() => { router.push('/profile/my-events'); setIsMenuOpen(false); }} />
            <NavItem icon={<Bell size={20} />} label="Notifications" onClick={() => { router.push('/notifications'); setIsMenuOpen(false); }} />
            <div className="mt-6 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-left text-sm text-[#F5EDD8] hover:bg-[#1b1713] transition"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
