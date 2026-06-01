"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { User, AtSign, MapPin, AlignLeft, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  
  // Validation States
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [handleStatus, setHandleStatus] = useState<'idle' | 'available' | 'taken' | 'invalid'>('idle');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/login');
        return;
      }
      setUser(user);
      setName(user.user_metadata?.full_name || '');
      
      // Auto-suggest handle from email if available
      if (user.email) {
        const emailPrefix = user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
        setHandle(emailPrefix);
      }
    };
    fetchUser();
  }, [router]);

  // Debounced handle validation
  useEffect(() => {
    if (!handle.trim()) {
      setHandleStatus('idle');
      return;
    }

    if (handle.length < 3) {
      setHandleStatus('invalid');
      return;
    }

    const cleanedHandle = handle.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    
    const validateHandle = async () => {
      setIsCheckingHandle(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const formattedHandle = `@${cleanedHandle}`;

        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('handle', formattedHandle)
          .maybeSingle();

        if (error) throw error;

        // If data is returned and it's not the current user's profile, it is taken
        if (data && data.id !== user?.id) {
          setHandleStatus('taken');
        } else {
          setHandleStatus('available');
        }
      } catch (err) {
        console.error("Error validating handle:", err);
      } finally {
        setIsCheckingHandle(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      validateHandle();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [handle, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim() || !handle.trim() || !bio.trim() || !city.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    if (handleStatus === 'taken' || handleStatus === 'invalid') {
      setError("Please choose a valid and available handle.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const cleanedHandle = `@${handle.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()}`;

      // Auto-assign avatar url based on name if not set in state
      const finalAvatarUrl = avatarUrl || `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=E07340&color=F5EDD8`;

      // 1. Save profile in the database
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: name.trim(),
          handle: cleanedHandle,
          avatar_url: finalAvatarUrl,
          bio: bio.trim(),
          city: city.trim(),
          profile_completed: true,
          trust_score: 80
        });

      if (profileError) throw profileError;

      // 2. Cache 'profile_completed' in user_metadata for Next.js Middleware check
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { profile_completed: true }
      });

      if (metadataError) throw metadataError;

      // 3. Force refresh the Supabase session token, then redirect to Discover page
      await supabase.auth.refreshSession();
      router.push('/discover');
      router.refresh();
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setError(err.message || "Failed to finalize your profile setup. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0E0B08] text-[#F5EDD8] flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-[#E07340]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    setUploadingAvatar(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const fileExt = (file.name.split('.').pop() || '').replace(/[^a-zA-Z0-9]/g, '');
      const filePath = `${user.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData, error: publicError } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath) as any;

      if (publicError) throw publicError;

      const publicUrl = publicData?.publicUrl || publicData?.public_url || '';
      if (!publicUrl) throw new Error('Could not get public URL for avatar.');

      setAvatarUrl(publicUrl);
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setError(err?.message || 'Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#0E0B08] text-[#F5EDD8] font-sans selection:bg-[#E07340]/30 overflow-x-hidden flex flex-col justify-between relative">
      
      {/* Decorative radial glows */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#C4622D]/10 rounded-full filter blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-[#E07340]/10 rounded-full filter blur-[120px] pointer-events-none z-0" />

      {/* Header */}
      <header className="w-full z-10 px-6 py-6 max-w-7xl mx-auto flex justify-between items-center relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C4622D] to-[#E07340] flex items-center justify-center font-serif text-2xl font-bold shadow-[0_0_20px_rgba(196,98,45,0.4)]">
            O
          </div>
          <span className="font-serif text-2xl font-bold tracking-wide">
            Out-Dare
          </span>
        </div>
      </header>

      {/* Onboarding Wizard Form */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 z-10 relative">
        <div className="w-full max-w-lg">
          
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-panel p-8 md:p-10 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden bg-[#0E0B08]/85 backdrop-blur-xl"
          >
            {/* Form Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#E07340]/10 rounded-full filter blur-[50px] pointer-events-none" />

            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E07340]/10 border border-[#E07340]/25 text-[#E07340] text-xs font-bold mb-4">
                <Sparkles size={12} />
                <span>Founding Member Setup</span>
              </div>
              
              <h2 className="text-3xl font-serif font-bold tracking-tight mb-2">
                Setup your profile
              </h2>
              
              <p className="text-[#9C8B72] text-sm">
                Before entering the closed beta, personalize your identity so others can connect with you.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-28 h-28 rounded-full bg-[#16120E] border border-white/10 overflow-hidden flex items-center justify-center">
                  {avatarUrl ? (
                    // Image preview
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-[#9C8B72] text-sm">No photo</div>
                  )}
                </div>

                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#16120E] border border-white/10 text-sm text-white hover:bg-[#1b1713] cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className="hidden"
                  />
                  <span className="text-[#E07340] font-bold">{uploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
                </label>
                <p className="text-[10px] text-[#9C8B72]">PNG, JPG or GIF. Max size 5MB.</p>
              </div>
              {/* Full Name */}
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

              {/* Unique Handle */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center pl-1">
                  <label className="text-xs font-semibold text-[#9C8B72]">
                    Unique Handle
                  </label>
                  
                  {/* Status Badges */}
                  <span className="text-[10px] font-bold">
                    {isCheckingHandle && (
                      <span className="text-amber-400 animate-pulse">Checking...</span>
                    )}
                    {!isCheckingHandle && handleStatus === 'available' && (
                      <span className="text-green-400">Available ✓</span>
                    )}
                    {!isCheckingHandle && handleStatus === 'taken' && (
                      <span className="text-red-400">Taken ✗</span>
                    )}
                    {!isCheckingHandle && handleStatus === 'invalid' && (
                      <span className="text-red-400">Min 3 characters</span>
                    )}
                  </span>
                </div>
                
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9C8B72] pointer-events-none">
                    <AtSign size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="aishasharma"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    className={`w-full bg-[#16120E] border rounded-2xl pl-10 pr-4 py-3.5 focus:outline-none transition-all text-sm text-white placeholder:text-[#9C8B72]/50 ${
                      handleStatus === 'available' ? 'border-green-500/50' : 
                      handleStatus === 'taken' ? 'border-red-500/50' : 'border-white/10 focus:border-[#E07340]/50'
                    }`}
                  />
                </div>
                <p className="text-[10px] text-[#9C8B72] pl-1">
                  Handles can only contain letters, numbers, and underscores. Used uniquely across the network.
                </p>
              </div>

              {/* City Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9C8B72] pl-1">
                  City
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9C8B72] pointer-events-none">
                    <MapPin size={16} />
                  </span>
                  <select
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#16120E] border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 focus:border-[#E07340]/50 focus:outline-none transition-all text-sm text-white"
                  >
                    <option value="" disabled>Select your city</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Pune">Pune</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Chennai">Chennai</option>
                  </select>
                </div>
              </div>

              {/* Bio Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9C8B72] pl-1">
                  Short Bio
                </label>
                <div className="relative">
                  <span className="absolute top-3.5 left-3.5 text-[#9C8B72] pointer-events-none">
                    <AlignLeft size={16} />
                  </span>
                  <textarea
                    required
                    rows={4}
                    placeholder="Exploring Bangalore one cold brew at a time. Always up for a weekend trek or an indie gig."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-[#16120E] border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 focus:border-[#E07340]/50 focus:outline-none transition-all text-sm text-white placeholder:text-[#9C8B72]/50 resize-none leading-relaxed"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-start gap-2 leading-relaxed">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || uploadingAvatar || handleStatus === 'taken' || handleStatus === 'invalid' || !name.trim() || !handle.trim()}
                className="w-full bg-gradient-to-r from-[#C4622D] to-[#E07340] text-white px-6 py-4 rounded-2xl font-bold shadow-[0_0_20px_rgba(196,98,45,0.3)] hover:shadow-[0_0_28px_rgba(196,98,45,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Profile...
                  </span>
                ) : (
                  <>
                    <span>Complete Onboarding</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

          </motion.div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-6 text-center text-xs text-[#9C8B72] z-10 relative">
        <p>© 2026 Out-Dare. Closed Beta Access. All rights reserved.</p>
      </footer>
    </div>
  );
}
