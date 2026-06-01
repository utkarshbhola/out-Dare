"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, MapPin, Pencil, Sparkles, User } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type ProfileData = {
  avatar_url?: string | null;
  name?: string | null;
  handle?: string | null;
  bio?: string | null;
  city?: string | null;
  profile_completed?: boolean | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);
  const [createdEvents, setCreatedEvents] = useState<number>(0);
  const [joinedEvents, setJoinedEvents] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      setUnauthorized(false);

      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setUnauthorized(true);
          setError('You are not signed in. Please log in to view your profile.');
          return;
        }

        const [profileResult, createdResult, joinedResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('avatar_url,name,handle,bio,city,profile_completed')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('events')
            .select('id', { count: 'exact' })
            .eq('created_by', user.id),
          supabase
            .from('event_attendees')
            .select('event_id', { count: 'exact' })
            .eq('profile_id', user.id),
        ]);

        if (profileResult.error) {
          throw profileResult.error;
        }
        if (createdResult.error) {
          throw createdResult.error;
        }
        if (joinedResult.error) {
          throw joinedResult.error;
        }

        setProfile(profileResult.data ?? null);
        setProfileCompleted(profileResult.data?.profile_completed === true);
        setCreatedEvents(createdResult.count ?? createdResult.data?.length ?? 0);
        setJoinedEvents(joinedResult.count ?? joinedResult.data?.length ?? 0);
      } catch (err: any) {
        console.error('Profile load failed:', err);
        setError(err?.message || 'Unable to load your profile right now.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const showProfileInfo = Boolean(profile && (profile.name || profile.handle || profile.bio || profile.city || profile.avatar_url));
  const hasStats = createdEvents > 0 || joinedEvents > 0;
  const needsCompletion = profileCompleted === false;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto py-8 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[#E07340]/80 font-semibold">Profile</p>
            <h1 className="text-4xl font-serif font-bold mt-3">Your profile</h1>
            <p className="text-[#9C8B72] mt-2 max-w-2xl">
              Manage your Out-Dare identity, keep your details up to date, and see how many events you have created or joined.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => router.push(profile ? '/profile/edit' : '/onboarding')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#C4622D] to-[#E07340] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(196,98,45,0.25)] transition hover:brightness-110"
            >
              <Pencil size={16} /> Edit Profile
            </button>
            <Link
              href="/discover"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#16120E] px-5 py-3 text-sm font-semibold text-white hover:border-[#E07340]/30 transition"
            >
              <ArrowRight size={16} /> Browse Events
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="glass-panel rounded-[32px] border border-white/10 p-10 text-center text-[#9C8B72]">
            Loading your profile...
          </div>
        ) : error ? (
          <div className="glass-panel rounded-[32px] border border-red-500/20 bg-red-500/10 p-8 text-sm text-red-200">
            {error}
            {unauthorized && (
              <div className="mt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-[#E07340] px-4 py-2 text-sm font-semibold text-white"
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            {needsCompletion && (
              <div className="glass-panel rounded-[32px] border border-[#E07340]/20 bg-[#0E0B08]/80 p-8 text-[#F5EDD8]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#E07340] font-semibold">Complete your profile</p>
                    <h2 className="text-2xl font-serif font-bold mt-2">Finish onboarding to unlock Out-Dare features.</h2>
                    <p className="text-[#9C8B72] mt-2 max-w-2xl">
                      Your profile is almost ready. Complete the final details so your community can discover you.
                    </p>
                  </div>
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#E07340] px-5 py-3 text-sm font-semibold text-white hover:brightness-110 transition"
                  >
                    Continue Onboarding
                  </Link>
                </div>
              </div>
            )}

            {showProfileInfo ? (
              <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
                <div className="glass-panel rounded-[32px] border border-white/10 p-6 bg-[#0E0B08]/80">
                  <div className="flex flex-col items-center gap-4 text-center">
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt={profile.name || 'Avatar'}
                        className="h-32 w-32 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#16120E] border border-white/10 text-3xl text-[#E07340]">
                        <User size={42} />
                      </div>
                    )}

                    {profile?.name && <h2 className="text-2xl font-serif font-bold">{profile.name}</h2>}
                    {profile?.handle && <p className="text-sm text-[#9C8B72]">{profile.handle}</p>}

                    <div className="space-y-3 pt-4 text-left w-full">
                      {profile?.bio && (
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-[#E07340] font-semibold">Bio</p>
                          <p className="mt-2 text-sm text-[#F5EDD8] leading-relaxed">{profile.bio}</p>
                        </div>
                      )}

                      {profile?.city && (
                        <div className="flex items-center gap-2 text-sm text-[#9C8B72]">
                          <MapPin size={16} className="text-[#E07340]" />
                          {profile.city}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-[32px] border border-white/10 p-6 bg-[#0E0B08]/80">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-[#E07340] font-semibold">Profile details</p>
                      <h2 className="text-2xl font-serif font-bold mt-2">Account overview</h2>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#E07340]/20 bg-[#E07340]/10 px-3 py-1 text-xs font-semibold text-[#E07340]">
                      Live
                    </span>
                  </div>

                  <div className="space-y-4 text-sm text-[#9C8B72]">
                    {profile?.name && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#E07340] font-semibold">Name</p>
                        <p className="mt-1 text-white">{profile.name}</p>
                      </div>
                    )}
                    {profile?.handle && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#E07340] font-semibold">Handle</p>
                        <p className="mt-1 text-white">{profile.handle}</p>
                      </div>
                    )}
                    {profile?.bio && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#E07340] font-semibold">About</p>
                        <p className="mt-1 text-white">{profile.bio}</p>
                      </div>
                    )}
                    {profile?.city && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#E07340] font-semibold">City</p>
                        <p className="mt-1 text-white">{profile.city}</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ) : (
              <section className="glass-panel rounded-[32px] border border-white/10 p-8 bg-[#0E0B08]/80 text-[#F5EDD8]">
                <div className="flex flex-col gap-3">
                  <p className="text-sm uppercase tracking-[0.2em] text-[#E07340] font-semibold">Complete your profile</p>
                  <h2 className="text-3xl font-serif font-bold">Your profile is not ready yet.</h2>
                  <p className="text-[#9C8B72] text-sm max-w-2xl">
                    Add your name, handle, bio, and city so others can discover you on Out-Dare.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href="/onboarding" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E07340] px-5 py-3 text-sm font-semibold text-white hover:brightness-110 transition">
                      Complete your profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => router.push('/profile/edit')}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#16120E] px-5 py-3 text-sm font-semibold text-white hover:border-[#E07340]/30 transition"
                    >
                      <Pencil size={16} /> Edit profile details
                    </button>
                  </div>
                </div>
              </section>
            )}

            {hasStats && (
              <section className="grid gap-6 md:grid-cols-2">
                {createdEvents > 0 && (
                  <div className="glass-panel rounded-[32px] border border-white/10 p-6 bg-[#0E0B08]/80">
                    <p className="text-sm uppercase tracking-[0.2em] text-[#E07340] font-semibold">Created Events</p>
                    <p className="text-5xl font-serif font-bold mt-4 text-white">{createdEvents}</p>
                    <p className="text-sm text-[#9C8B72] mt-3">Events you have created on Out-Dare.</p>
                  </div>
                )}
                {joinedEvents > 0 && (
                  <div className="glass-panel rounded-[32px] border border-white/10 p-6 bg-[#0E0B08]/80">
                    <p className="text-sm uppercase tracking-[0.2em] text-[#E07340] font-semibold">Joined Events</p>
                    <p className="text-5xl font-serif font-bold mt-4 text-white">{joinedEvents}</p>
                    <p className="text-sm text-[#9C8B72] mt-3">Events you have joined through the platform.</p>
                  </div>
                )}
              </section>
            )}

            <section className="glass-panel rounded-[32px] border border-white/10 p-6 bg-[#0E0B08]/80">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#E07340] font-semibold">OutThere AI Concierge</p>
                  <h2 className="text-2xl font-serif font-bold mt-2">Launching Soon 🚀</h2>
                </div>
                <div className="rounded-full border border-[#E07340]/20 bg-[#E07340]/10 px-4 py-2 text-sm font-semibold text-[#E07340]">
                  Coming in a future release
                </div>
              </div>
              <p className="text-[#9C8B72] mt-4 max-w-3xl">
                Discover events, find people attending solo, and get personalized recommendations.
              </p>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
