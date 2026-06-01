"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { ArrowRight, ChevronLeft } from 'lucide-react';

type ProfileData = {
  avatar_url?: string | null;
  name?: string | null;
  handle?: string | null;
  bio?: string | null;
  city?: string | null;
};

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push('/login');
          return;
        }

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url,name,handle,bio,city')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (data) {
          setProfile(data);
          setAvatarUrl(data.avatar_url ?? '');
          setName(data.name ?? '');
          setBio(data.bio ?? '');
          setCity(data.city ?? '');
        }
      } catch (err: any) {
        console.error('Profile edit load failed:', err);
        setError(err?.message || 'Unable to load your profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!name.trim() || !bio.trim() || !city.trim()) {
      setError('Please fill out your name, bio, and city.');
      return;
    }

    setSaving(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/login');
        return;
      }

      const updatePayload: Record<string, unknown> = {
        id: user.id,
        name: name.trim(),
        bio: bio.trim(),
        city: city.trim(),
        avatar_url: avatarUrl.trim() || null,
        profile_completed: true,
      };

      if (profile?.handle) {
        updatePayload.handle = profile.handle;
      }

      const { error: updateError } = await supabase.from('profiles').upsert(updatePayload);
      if (updateError) {
        throw updateError;
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { profile_completed: true },
      });
      if (metadataError) {
        throw metadataError;
      }

      router.push('/profile');
    } catch (err: any) {
      console.error('Profile save failed:', err);
      setError(err?.message || 'Unable to save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload a valid image file.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('Image must be smaller than 5MB.');
      return;
    }

    setUploadingAvatar(true);
    setUploadError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const fileExt = (file.name.split('.').pop() || '').replace(/[^a-zA-Z0-9]/g, '');
      const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicData, error: publicError } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath) as any;

      if (publicError) {
        throw publicError;
      }

      const publicUrl = publicData?.publicUrl || publicData?.public_url || '';
      if (!publicUrl) {
        throw new Error('Unable to resolve avatar URL.');
      }

      setAvatarUrl(publicUrl);
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      setUploadError(err?.message || 'Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[#E07340]/80 font-semibold">Profile Settings</p>
            <h1 className="text-4xl font-serif font-bold mt-3">Edit your profile</h1>
            <p className="text-[#9C8B72] mt-2 max-w-2xl">
              Keep your avatar, name, bio, and city current so the Out-Dare community can recognize you.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#16120E] px-5 py-3 text-sm font-semibold text-white hover:border-[#E07340]/30 transition"
          >
            <ChevronLeft size={16} /> Back to profile
          </button>
        </div>

        <div className="glass-panel mt-8 rounded-[32px] border border-white/10 bg-[#0E0B08]/80 p-8">
          {loading ? (
            <div className="text-[#9C8B72]">Loading profile details…</div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-6">
              {error && (
                <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="block text-sm text-[#9C8B72]">
                  <div className="flex items-center justify-between gap-4">
                    <span>Profile avatar</span>
                    <span className="text-xs text-[#9C8B72]">PNG/JPG, max 5MB</span>
                  </div>

                  <div className="mt-3 flex items-center gap-4">
                    <div className="h-24 w-24 overflow-hidden rounded-3xl border border-white/10 bg-[#1B1814]">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Avatar preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-[#9C8B72]">
                          No avatar yet
                        </div>
                      )}
                    </div>
                    <label className="cursor-pointer rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#E07340]/50">
                      {uploadingAvatar ? 'Uploading…' : 'Choose file'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                    </label>
                  </div>

                  {uploadError && (
                    <p className="mt-3 text-sm text-red-300">{uploadError}</p>
                  )}
                </div>
                <label className="block text-sm text-[#9C8B72]">
                  Display name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-white focus:border-[#E07340]/50 focus:outline-none"
                    placeholder="Your name"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block text-sm text-[#9C8B72]">
                  City
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-white focus:border-[#E07340]/50 focus:outline-none"
                    placeholder="City, State"
                    required
                  />
                </label>
                <label className="block text-sm text-[#9C8B72]">
                  Handle
                  <input
                    value={profile?.handle ?? ''}
                    disabled
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-white/60 cursor-not-allowed"
                    placeholder="@handle"
                  />
                </label>
              </div>

              <label className="block text-sm text-[#9C8B72]">
                Bio
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-3xl border border-white/10 bg-[#16120E] px-4 py-3 text-white focus:border-[#E07340]/50 focus:outline-none"
                  placeholder="A short description of yourself"
                  required
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#9C8B72]">
                  Update your profile information and hit Save when ready.
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#C4622D] to-[#E07340] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
