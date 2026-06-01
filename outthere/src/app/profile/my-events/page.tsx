"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  ArrowRight,
  CheckCircle2,
  Calendar,
  Clock,
  Edit3,
  Eye,
  MapPin,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import AppShell from '@/components/AppShell';

interface EventRecord {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  emoji: string | null;
  location: string | null;
  venue?: string | null;
  city?: string | null;
  event_time: string | null;
  image_url?: string | null;
  max_attendees?: number | null;
  created_by: string | null;
  created_at: string;
  event_attendees: Array<{ profile_id: string }>;
}

interface AttendeeProfile {
  id: string;
  name: string | null;
  handle: string | null;
  avatar_url: string | null;
  city: string | null;
}

interface AttendeeRow {
  profiles: AttendeeProfile | null;
}

interface EditEventForm {
  id: string;
  title: string;
  description: string;
  category: string;
  emoji: string;
  date: string;
  time: string;
  city: string;
  venue: string;
  maxAttendees: string;
  imageUrl: string;
}

const CATEGORY_OPTIONS = ['Concerts', 'Treks', 'Cafés', 'Nightlife', 'Art', 'Community'];

function buildLocation(city: string, venue: string) {
  const values = [city.trim(), venue.trim()].filter(Boolean);
  return values.join(' • ');
}

function parseEventTime(raw: string | null) {
  if (!raw) {
    return { date: '', time: '' };
  }
  const trimmed = raw.trim();
  if (trimmed.includes('•')) {
    const [cityPart, venuePart] = trimmed.split('•').map((part) => part.trim());
    return { date: cityPart, time: venuePart };
  }
  if (trimmed.includes(',')) {
    const [maybeDate, ...rest] = trimmed.split(',');
    return { date: maybeDate.trim(), time: rest.join(',').trim() };
  }
  return { date: trimmed, time: '' };
}

function isUpcoming(eventTime: string | null) {
  if (!eventTime) return false;
  const normalized = eventTime.toLowerCase();
  if (normalized.includes('tonight') || normalized.includes('tomorrow') || normalized.includes('today')) {
    return true;
  }
  if (normalized.includes('yesterday') || normalized.includes('last') || normalized.includes('past')) {
    return false;
  }
  const parsed = Date.parse(eventTime);
  if (!Number.isNaN(parsed)) {
    return parsed >= Date.now();
  }
  return true;
}

function formatAttendeeCount(count: number) {
  return `${count} attendee${count === 1 ? '' : 's'}`;
}

function SkeletonCard() {
  return (
    <div className="glass-panel rounded-[28px] border border-white/10 p-5 animate-pulse space-y-4">
      <div className="h-44 rounded-3xl bg-white/5" />
      <div className="h-5 rounded-full bg-white/10 w-3/4" />
      <div className="h-4 rounded-full bg-white/10 w-1/2" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-10 rounded-2xl bg-white/5" />
        <div className="h-10 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}

export default function MyEventsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<AttendeeProfile[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editEventForm, setEditEventForm] = useState<EditEventForm | null>(null);
  const [updating, setUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push('/login');
          return;
        }

        setUser(user);

        const { data, error: eventsError } = await supabase
          .from('events')
          .select('*, event_attendees(*)')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (eventsError) {
          throw eventsError;
        }

        const rows = (data ?? []) as Array<
          EventRecord & { event_attendees: Array<{ profile_id: string }> }
        >;

        setEvents(rows.map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          category: event.category,
          emoji: event.emoji,
          location: event.location,
          event_time: event.event_time,
          image_url: event.image_url ?? null,
          max_attendees: event.max_attendees ?? null,
          created_by: event.created_by,
          created_at: event.created_at,
          event_attendees: event.event_attendees ?? [],
        })));
      } catch (err: any) {
        console.error('Failed to load events:', err);
        setError('Unable to load your events right now.');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [router]);

  const upcomingEvents = useMemo(
    () => events.filter((event) => isUpcoming(event.event_time)),
    [events]
  );
  const pastEvents = useMemo(
    () => events.filter((event) => !isUpcoming(event.event_time)),
    [events]
  );

  const openAttendees = async (eventId: string) => {
    setSelectedEventId(eventId);
    setAttendeesLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: attendeesError } = await supabase
        .from('event_attendees')
        .select('profiles(id, name, handle, avatar_url, city)')
        .eq('event_id', eventId);

      if (attendeesError) {
        throw attendeesError;
      }

      const rows = (data ?? []) as AttendeeRow[];
      setAttendees(
        rows
          .map((row) => row.profiles)
          .filter((profile): profile is AttendeeProfile => Boolean(profile))
      );
    } catch (err: any) {
      console.error('Unable to load attendees:', err);
      setError('Unable to load attendees.');
    } finally {
      setAttendeesLoading(false);
    }
  };

  const closeAttendees = () => {
    setSelectedEventId(null);
    setAttendees([]);
  };

  const beginEdit = (event: EventRecord) => {
    const { date, time } = parseEventTime(event.event_time);
    let city = '';
    let venue = '';

    if (event.location?.includes('•')) {
      [city, venue] = event.location.split('•').map((item) => item.trim());
    } else {
      city = event.location ?? '';
    }

    setEditEventForm({
      id: event.id,
      title: event.title,
      description: event.description ?? '',
      category: event.category ?? CATEGORY_OPTIONS[0],
      emoji: event.emoji ?? '📍',
      date: date || '',
      time: time || '',
      city,
      venue,
      maxAttendees: event.max_attendees?.toString() ?? '',
      imageUrl: event.image_url ?? '',
    });
  };

  const closeEdit = () => setEditEventForm(null);

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEventForm || !user) return;
    setUpdating(true);
    setError(null);

    if (!editEventForm.title.trim() || !editEventForm.category.trim() || !editEventForm.date.trim() || !editEventForm.time.trim()) {
      setError('Please complete title, category, date, and time.');
      setUpdating(false);
      return;
    }

    const location = buildLocation(editEventForm.city, editEventForm.venue);
    const updatePayload: Record<string, any> = {
      title: editEventForm.title.trim(),
      description: editEventForm.description.trim(),
      category: editEventForm.category.trim(),
      emoji: editEventForm.emoji.trim() || '📍',
      event_time: `${editEventForm.date.trim()}, ${editEventForm.time.trim()}`,
      location,
    };

    if (editEventForm.maxAttendees.trim()) {
      updatePayload.max_attendees = Number(editEventForm.maxAttendees.trim());
    }
    if (editEventForm.imageUrl.trim()) {
      updatePayload.image_url = editEventForm.imageUrl.trim();
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: updateError } = await supabase
        .from('events')
        .update(updatePayload)
        .eq('id', editEventForm.id)
        .eq('created_by', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setEvents((current) =>
        current.map((event) => (event.id === editEventForm.id ? { ...event, ...data } : event))
      );
      setActionMessage('Event Updated Successfully');
      closeEdit();
    } catch (err: any) {
      console.error('Update failed:', err);
      setError(err.message || 'Unable to update the event.');
    } finally {
      setUpdating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteEventId || !user) return;
    setDeleting(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', deleteEventId)
        .eq('created_by', user.id);

      if (deleteError) {
        throw deleteError;
      }

      setEvents((current) => current.filter((event) => event.id !== deleteEventId));
      setActionMessage('Event Deleted Successfully');
      setDeleteEventId(null);
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError(err.message || 'Unable to delete the event.');
    } finally {
      setDeleting(false);
    }
  };

  const selectedEvent = events.find((event) => event.id === selectedEventId);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[#E07340]/80 font-semibold">
              Creator Dashboard
            </p>
            <h1 className="text-4xl font-serif font-bold mt-3">
              Manage your events
            </h1>
            <p className="text-[#9C8B72] mt-2 max-w-2xl">
              Review all events you have created, update details, invite attendees, and keep your launch calendar fresh.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/discover"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#16120E] border border-white/10 px-5 py-3 text-sm font-semibold text-white hover:border-[#E07340]/30 hover:bg-[#1c1814] transition"
            >
              Explore Events
              <ArrowRight size={16} />
            </Link>
          </div>
        </header>

        {actionMessage && (
          <div className="glass-panel rounded-3xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-sm text-green-200 flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-green-200 hover:text-white">
              <X size={18} />
            </button>
          </div>
        )}

        {error && (
          <div className="glass-panel rounded-3xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="grid gap-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-serif font-bold">Upcoming Events</h2>
              <p className="text-[#9C8B72] text-sm mt-1">Events scheduled for today or later.</p>
            </div>
            <span className="text-sm text-[#9C8B72] font-medium">
              {upcomingEvents.length} {upcomingEvents.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="glass-panel rounded-[32px] border border-white/10 p-10 text-[#9C8B72]">
              <p className="text-lg font-semibold mb-2">No upcoming events yet.</p>
              <p className="mb-4">Create an event in Discover so your community can join.</p>
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#C4622D] to-[#E07340] px-5 py-3 text-sm font-semibold text-white"
              >
                Create Your First Event
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-3">
              {upcomingEvents.map((event) => (
                <motion.div
                  key={event.id}
                  className="glass-panel rounded-[32px] border border-white/10 overflow-hidden shadow-2xl"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative h-52 overflow-hidden bg-[#16120E]">
                    {event.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-6xl text-[#E07340] bg-gradient-to-br from-[#C4622D]/15 to-[#1a1510]">
                        {event.emoji || '📍'}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0E0B08]/90 to-transparent p-4">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#0E0B08]/80 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#E07340] font-bold">
                        {event.category || 'Event'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xl font-serif font-bold leading-tight">{event.title}</h3>
                      <span className="rounded-full border border-[#E07340]/20 bg-[#E07340]/10 px-3 py-1 text-[11px] font-semibold text-[#E07340]">
                        Upcoming
                      </span>
                    </div>

                    <div className="space-y-3 text-sm text-[#9C8B72]">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-[#E07340]" />
                        {event.event_time || 'No date set'}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-[#E07340]" />
                        {event.location || 'Location unavailable'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-[#E07340]" />
                        {formatAttendeeCount(event.event_attendees.length)}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Link
                        href={`/events/${event.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-sm font-semibold text-white hover:border-[#E07340]/30 hover:text-[#E07340] transition"
                      >
                        <Eye size={16} /> View Event
                      </Link>
                      <button
                        type="button"
                        onClick={() => beginEdit(event)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-sm font-semibold text-white hover:border-[#E07340]/30 hover:text-[#E07340] transition"
                      >
                        <Edit3 size={16} /> Edit
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setDeleteEventId(event.id)}
                        disabled={deleting}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#3A1F16] px-4 py-3 text-sm font-semibold text-red-300 hover:border-red-400/40 hover:text-red-100 transition disabled:opacity-60"
                      >
                        <Trash2 size={16} /> Delete Event
                      </button>
                      <button
                        type="button"
                        onClick={() => openAttendees(event.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-sm font-semibold text-white hover:border-[#E07340]/30 hover:text-[#E07340] transition"
                      >
                        <Users size={16} /> View Attendees
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-serif font-bold">Past Events</h2>
              <p className="text-[#9C8B72] text-sm mt-1">Events you have already hosted.</p>
            </div>
            <span className="text-sm text-[#9C8B72] font-medium">
              {pastEvents.length} {pastEvents.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : pastEvents.length === 0 ? (
            <div className="glass-panel rounded-[32px] border border-white/10 p-10 text-[#9C8B72]">
              <p className="text-lg font-semibold mb-2">No past events yet.</p>
              <p className="mb-4">Your created events will appear here once they are completed.</p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-3">
              {pastEvents.map((event) => (
                <motion.div
                  key={event.id}
                  className="glass-panel rounded-[32px] border border-white/10 overflow-hidden shadow-2xl"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative h-52 overflow-hidden bg-[#16120E]">
                    {event.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-6xl text-[#E07340] bg-gradient-to-br from-[#C4622D]/15 to-[#1a1510]">
                        {event.emoji || '📍'}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0E0B08]/90 to-transparent p-4">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#0E0B08]/80 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#E07340] font-bold">
                        {event.category || 'Event'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xl font-serif font-bold leading-tight">{event.title}</h3>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#9C8B72]">
                        Past
                      </span>
                    </div>

                    <div className="space-y-3 text-sm text-[#9C8B72]">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-[#E07340]" />
                        {event.event_time || 'No date set'}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-[#E07340]" />
                        {event.location || 'Location unavailable'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-[#E07340]" />
                        {formatAttendeeCount(event.event_attendees.length)}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Link
                        href={`/events/${event.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-sm font-semibold text-white hover:border-[#E07340]/30 hover:text-[#E07340] transition"
                      >
                        <Eye size={16} /> View Event
                      </Link>
                      <button
                        type="button"
                        onClick={() => openAttendees(event.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-sm font-semibold text-white hover:border-[#E07340]/30 hover:text-[#E07340] transition"
                      >
                        <Users size={16} /> View Attendees
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {selectedEventId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="glass-panel w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#0E0B08]/95 p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold">Attendees</h2>
                  <p className="text-[#9C8B72] text-sm mt-1">
                    {attendees.length} {attendees.length === 1 ? 'attendee' : 'attendees'}
                  </p>
                </div>
                <button onClick={closeAttendees} className="rounded-full border border-white/10 bg-[#16120E] p-3 text-[#F5EDD8] hover:bg-[#1b1713] transition">
                  <X size={18} />
                </button>
              </div>

              {attendeesLoading ? (
                <div className="space-y-4">
                  <div className="h-4 w-1/3 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-20 rounded-3xl bg-white/5 animate-pulse" />
                </div>
              ) : attendees.length === 0 ? (
                <div className="glass-panel rounded-3xl border border-white/10 p-8 text-center text-[#9C8B72]">
                  <p className="font-semibold">No attendees yet.</p>
                  <p className="text-sm mt-2">Invite people by sharing your event link.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attendees.map((attendee) => (
                    <div key={attendee.id} className="glass-panel rounded-3xl border border-white/10 p-4 flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full overflow-hidden bg-[#16120E] border border-white/10">
                        {attendee.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={attendee.avatar_url} alt={attendee.name ?? 'Avatar'} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#9C8B72]">👤</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white">{attendee.name || 'No name'}</p>
                        <p className="text-sm text-[#9C8B72]">{attendee.handle || '@unknown'}</p>
                      </div>
                      <span className="ml-auto text-sm text-[#9C8B72]">{attendee.city || 'Unknown'}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteEventId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="glass-panel w-full max-w-lg rounded-[32px] border border-white/10 bg-[#0E0B08]/95 p-6 shadow-2xl"
            >
              <h2 className="text-2xl font-serif font-bold">Delete Event?</h2>
              <p className="text-[#9C8B72] mt-3">This action cannot be undone. The event and its registrations will be permanently removed.</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteEventId(null)}
                  className="rounded-2xl border border-white/10 bg-[#16120E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1b1713] transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="rounded-2xl bg-red-500/15 px-5 py-3 text-sm font-semibold text-red-100 hover:bg-red-500/25 transition disabled:opacity-60"
                >
                  {deleting ? 'Deleting…' : 'Delete Event'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editEventForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="glass-panel w-full max-w-3xl rounded-[32px] border border-white/10 bg-[#0E0B08]/95 p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold">Edit Event</h2>
                  <p className="text-[#9C8B72] text-sm mt-1">Update event details and keep your attendees in sync.</p>
                </div>
                <button onClick={closeEdit} className="rounded-full border border-white/10 bg-[#16120E] p-3 text-[#F5EDD8] hover:bg-[#1b1713] transition">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={submitEdit} className="grid gap-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block text-sm text-[#9C8B72]">
                    Event Title *
                    <input
                      value={editEventForm.title}
                      onChange={(e) => setEditEventForm({ ...editEventForm, title: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-white focus:border-[#E07340]/50 focus:outline-none"
                      required
                    />
                  </label>
                  <label className="block text-sm text-[#9C8B72]">
                    Category *
                    <select
                      value={editEventForm.category}
                      onChange={(e) => setEditEventForm({ ...editEventForm, category: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-white focus:border-[#E07340]/50 focus:outline-none"
                      required
                    >
                      {CATEGORY_OPTIONS.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block text-sm text-[#9C8B72]">
                  Description
                  <textarea
                    value={editEventForm.description}
                    onChange={(e) => setEditEventForm({ ...editEventForm, description: e.target.value })}
                    className="mt-2 min-h-[120px] w-full rounded-[26px] border border-white/10 bg-[#16120E] px-4 py-3 text-white focus:border-[#E07340]/50 focus:outline-none"
                  />
                </label>

                <div className="grid gap-5 md:grid-cols-3">
                  <label className="block text-sm text-[#9C8B72]">
                    Date *
                    <input
                      type="text"
                      value={editEventForm.date}
                      onChange={(e) => setEditEventForm({ ...editEventForm, date: e.target.value })}
                      placeholder="e.g. Saturday"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-white focus:border-[#E07340]/50 focus:outline-none"
                      required
                    />
                  </label>
                  <label className="block text-sm text-[#9C8B72]">
                    Time *
                    <input
                      type="text"
                      value={editEventForm.time}
                      onChange={(e) => setEditEventForm({ ...editEventForm, time: e.target.value })}
                      placeholder="e.g. 8 PM"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-white focus:border-[#E07340]/50 focus:outline-none"
                      required
                    />
                  </label>
                  <label className="block text-sm text-[#9C8B72]">
                    Emoji
                    <input
                      type="text"
                      value={editEventForm.emoji}
                      onChange={(e) => setEditEventForm({ ...editEventForm, emoji: e.target.value })}
                      placeholder="🎉"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-white focus:border-[#E07340]/50 focus:outline-none"
                    />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block text-sm text-[#9C8B72]">
                    City
                    <input
                      type="text"
                      value={editEventForm.city}
                      onChange={(e) => setEditEventForm({ ...editEventForm, city: e.target.value })}
                      placeholder="Bangalore"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-white focus:border-[#E07340]/50 focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm text-[#9C8B72]">
                    Venue
                    <input
                      type="text"
                      value={editEventForm.venue}
                      onChange={(e) => setEditEventForm({ ...editEventForm, venue: e.target.value })}
                      placeholder="Fandom"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-white focus:border-[#E07340]/50 focus:outline-none"
                    />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block text-sm text-[#9C8B72]">
                    Max attendees
                    <input
                      type="number"
                      min={1}
                      value={editEventForm.maxAttendees}
                      onChange={(e) => setEditEventForm({ ...editEventForm, maxAttendees: e.target.value })}
                      placeholder="Optional"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-white focus:border-[#E07340]/50 focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm text-[#9C8B72]">
                    Event image URL
                    <input
                      type="url"
                      value={editEventForm.imageUrl}
                      onChange={(e) => setEditEventForm({ ...editEventForm, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-white focus:border-[#E07340]/50 focus:outline-none"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="rounded-2xl border border-white/10 bg-[#16120E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1b1713] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="rounded-2xl bg-gradient-to-r from-[#C4622D] to-[#E07340] px-5 py-3 text-sm font-semibold text-white hover:shadow-[0_0_20px_rgba(196,98,45,0.35)] transition disabled:opacity-60"
                  >
                    {updating ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
