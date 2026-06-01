"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, User, Bell, Search, Plus, X, Sparkles } from 'lucide-react';
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

  return (
    <div className="flex h-screen overflow-hidden text-[#F5EDD8] font-sans">
      <nav className="w-20 md:w-64 glass-panel border-r border-t-0 border-b-0 border-l-0 flex flex-col items-center md:items-start py-8 z-40 transition-all flex-shrink-0">
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
          <NavItem icon={<Bell size={20} />} label="Notifications" />
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

      <main className="flex-1 relative overflow-y-auto overflow-x-hidden p-6 bg-[#0E0B08]">
        {children}
      </main>
    </div>
  );
}
