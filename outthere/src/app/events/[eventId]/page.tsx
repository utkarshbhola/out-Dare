"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Sparkles } from 'lucide-react';

interface EventRecord {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  emoji: string | null;
  location: string | null;
  event_time: string | null;
  image_url?: string | null;
  event_attendees: Array<{ profile_id: string }>;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.eventId as string | undefined;
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setError('Event not found.');
      setLoading(false);
      return;
    }

    const loadEvent = async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('events')
          .select('*, event_attendees(*)')
          .eq('id', eventId)
          .single();

        if (error) {
          throw error;
        }
        if (!data) {
          setError('Event not found.');
          return;
        }

        setEvent({
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category,
          emoji: data.emoji,
          location: data.location,
          event_time: data.event_time,
          image_url: data.image_url ?? null,
          event_attendees: data.event_attendees ?? [],
        });
      } catch (err: any) {
        console.error('Failed to load event:', err);
        setError(err.message || 'Failed to load event.');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  return (
    <div className="min-h-screen bg-[#0E0B08] text-[#F5EDD8] px-4 py-6 sm:px-6 lg:px-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-sm text-[#F5EDD8] hover:bg-[#1b1713] transition"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {loading ? (
          <div className="space-y-4">
            <div className="h-64 rounded-[32px] bg-white/5 animate-pulse"></div>
            <div className="h-6 w-2/3 rounded-full bg-white/10 animate-pulse"></div>
            <div className="h-4 w-1/2 rounded-full bg-white/10 animate-pulse"></div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="h-28 rounded-[24px] bg-white/5 animate-pulse"></div>
              <div className="h-28 rounded-[24px] bg-white/5 animate-pulse"></div>
            </div>
          </div>
        ) : error ? (
          <div className="glass-panel rounded-[32px] border border-red-500/20 bg-red-500/10 p-8 text-red-200">
            <p className="text-lg font-semibold">{error}</p>
          </div>
        ) : event ? (
          <div className="space-y-6">
            <div className="glass-panel rounded-[32px] overflow-hidden border border-white/10 bg-[#0E0B08]/95 shadow-2xl">
              <div className="relative h-80 bg-[#16120E]">
                {event.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-8xl text-[#E07340] bg-gradient-to-br from-[#C4622D]/15 to-[#1a1510]">
                    {event.emoji || '📍'}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0E0B08]/95 to-transparent px-6 py-5">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#0E0B08]/80 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#E07340] font-bold">
                    {event.category || 'Event'}
                  </span>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <h1 className="text-4xl font-serif font-bold">{event.title}</h1>
                  <p className="text-[#9C8B72] text-base leading-relaxed">{event.description || 'No description provided yet.'}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="glass-panel rounded-3xl border border-white/10 bg-[#16120E]/70 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-[#9C8B72] font-semibold">When</p>
                    <p className="mt-3 text-white font-semibold">{event.event_time || 'TBD'}</p>
                  </div>
                  <div className="glass-panel rounded-3xl border border-white/10 bg-[#16120E]/70 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-[#9C8B72] font-semibold">Where</p>
                    <p className="mt-3 text-white font-semibold">{event.location || 'TBD'}</p>
                  </div>
                  <div className="glass-panel rounded-3xl border border-white/10 bg-[#16120E]/70 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-[#9C8B72] font-semibold">Attendees</p>
                    <p className="mt-3 text-white font-semibold">{event.event_attendees.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[32px] border border-white/10 p-6 bg-[#0E0B08]/95">
              <div className="flex items-center gap-3 text-sm text-[#9C8B72]">
                <Calendar size={16} className="text-[#E07340]" />
                <span>{event.event_time || 'No date available'}</span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-sm text-[#9C8B72]">
                <MapPin size={16} className="text-[#E07340]" />
                <span>{event.location || 'No location available'}</span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-sm text-[#9C8B72]">
                <Users size={16} className="text-[#E07340]" />
                <span>{formatAttendeeCount(event.event_attendees.length)}</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatAttendeeCount(count: number) {
  return `${count} attendee${count === 1 ? '' : 's'}`;
}
