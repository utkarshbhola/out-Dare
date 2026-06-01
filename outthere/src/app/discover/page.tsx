"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { fetchEvents, joinEvent } from '@/lib/api';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { ArrowRight, Calendar, MapPin, Search, Sparkles, Users, Plus } from 'lucide-react';

type EventAttendee = {
  profile_id?: string;
  is_solo?: boolean;
  profiles?: { avatar_url?: string };
};

type EventData = {
  id: string;
  title: string;
  category?: string | null;
  emoji?: string | null;
  location?: string | null;
  description?: string | null;
  event_time?: string | null;
  image_url?: string | null;
  event_attendees?: EventAttendee[];
};

const cityFromLocation = (location?: string | null) => {
  if (!location) return 'Your city';
  return location.split(',')[0].trim() || 'Your city';
};

const formatAttendeeCount = (count: number) => `${count} attendee${count === 1 ? '' : 's'}`;

export default function DiscoverPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [joiningEvents, setJoiningEvents] = useState<string[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<string[]>([]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) setCurrentUserId(user.id);
      } catch (err) {
        console.error('Failed to load user', err);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadEvents = async () => {
      try {
        const data = await fetchEvents();
        if (!mounted) return;
        setEvents(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('Failed to fetch events', err);
        setError(err?.message || 'Failed to load events');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadEvents();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      setJoinedEvents([]);
      return;
    }

    const joined = events
      .filter((event) =>
        event.event_attendees?.some((attendee) => attendee.profile_id === currentUserId)
      )
      .map((event) => event.id);

    setJoinedEvents(joined);
  }, [events, currentUserId]);

  const cityOptions = useMemo(() => {
    const cities = new Set<string>();
    events.forEach((event) => {
      const city = cityFromLocation(event.location);
      if (city) cities.add(city);
    });
    return ['All Cities', ...Array.from(cities).filter((item) => item && item !== 'Your city')];
  }, [events]);

  const categories = useMemo(() => {
    const found = new Set<string>();
    events.forEach((event) => {
      const category = event.category?.trim() || 'Other';
      found.add(category);
    });
    return ['All', ...Array.from(found).sort()];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !normalizedQuery ||
        [event.title, event.description, event.location, event.category, event.emoji]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));

      const matchesCategory =
        activeCategory === 'All' || (event.category?.trim() || 'Other') === activeCategory;

      const matchesCity =
        selectedCity === 'All Cities' || cityFromLocation(event.location) === selectedCity;

      return matchesSearch && matchesCategory && matchesCity;
    });
  }, [events, searchQuery, activeCategory, selectedCity]);

  const trendingEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => (b.event_attendees?.length ?? 0) - (a.event_attendees?.length ?? 0))
      .slice(0, 3);
  }, [events]);

  const displayCity = selectedCity === 'All Cities' ? cityOptions[1] || 'Your city' : selectedCity;

  const handleJoin = async (eventId: string) => {
    if (joinedEvents.includes(eventId) || joiningEvents.includes(eventId)) {
      return;
    }

    setJoiningEvents((current) => [...current, eventId]);
    try {
      await joinEvent(eventId);
      setJoinedEvents((current) => [...current, eventId]);
      setEvents((current) =>
        current.map((event) =>
          event.id === eventId
            ? {
                ...event,
                event_attendees: [
                  ...(event.event_attendees ?? []),
                  { profile_id: currentUserId ?? undefined, is_solo: true },
                ],
              }
            : event
        )
      );
    } catch (joinError: any) {
      console.error('Join event failed:', joinError);
      setError(joinError?.message || 'Unable to join event.');
    } finally {
      setJoiningEvents((current) => current.filter((id) => id !== eventId));
    }
  };

  const featuredEvents = filteredEvents.slice(0, 3);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-white/10 bg-[#0E0B08]/80 p-8 shadow-2xl">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E07340]/20 bg-[#E07340]/10 px-4 py-2 text-sm font-semibold text-[#E07340]">
                <Sparkles size={16} /> Premium discovery
              </div>
              <div className="space-y-4">
                <div className="text-sm uppercase tracking-[0.3em] text-[#E07340]/80 font-semibold">Find your tribe tonight</div>
                <h1 className="text-4xl font-serif font-bold leading-tight md:text-5xl text-white">
                  Discover experiences, meet new people, and create unforgettable memories in your city.
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#9C8B72]">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-[#F5EDD8]">
                    <span>📍</span>
                    <span>{displayCity}</span>
                  </span>
                  <span className="rounded-full border border-white/10 bg-[#16120E]/70 px-3 py-2">{events.length} events live</span>
                </div>
              </div>
            </div>
            <div className="grid gap-4 rounded-[28px] border border-white/10 bg-[#16120E]/80 p-6">
              <div className="text-sm uppercase tracking-[0.25em] text-[#E07340] font-semibold">Premium platform</div>
              <p className="text-sm text-[#9C8B72] leading-relaxed">
                Search across cities, filter by themes, and join the best experiences with friends or new groups.
              </p>
              <Link
                href="/profile/my-events"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#C4622D] to-[#E07340] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(224,115,64,0.22)] transition hover:brightness-110"
              >
                <Plus size={16} /> Create Event
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.25em] text-[#E07340]/80 font-semibold">Discover</p>
              <h2 className="text-3xl font-serif font-bold text-white">Events curated for your city</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-[220px]">
                <label className="sr-only" htmlFor="city-select">
                  Select city
                </label>
                <select
                  id="city-select"
                  value={selectedCity}
                  onChange={(event) => setSelectedCity(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#16120E] px-4 py-3 text-sm text-white outline-none transition focus:border-[#E07340]/50"
                >
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <Link
                href="/profile/my-events"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#C4622D] to-[#E07340] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(224,115,64,0.22)] transition hover:brightness-110"
              >
                <Plus size={16} /> Create Event
              </Link>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="relative rounded-3xl border border-white/10 bg-[#16120E]/80 px-4 py-3 text-sm text-[#9C8B72]">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#E07340]" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search events, locations, and creators"
                className="w-full bg-transparent pl-11 pr-4 text-sm text-white placeholder:text-[#7a6c51] outline-none"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeCategory === category
                      ? 'bg-[#E07340] text-[#0E0B08]'
                      : 'border border-white/10 bg-white/5 text-[#F5EDD8] hover:border-[#E07340]/50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 space-y-6">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((index) => (
                <div key={index} className="animate-pulse rounded-[32px] border border-white/10 bg-[#16120E]/50 p-6 h-64" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="glass-panel rounded-[32px] border border-white/10 p-10 text-center text-[#9C8B72]">
              <p className="text-lg font-semibold text-white">No events found.</p>
              <p className="mt-3 mb-6">Try changing your city, category, or search term to discover a new experience.</p>
              <Link
                href="/profile/my-events"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#C4622D] to-[#E07340] px-6 py-3 text-sm font-semibold text-white"
              >
                Create the First Event
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {filteredEvents.map((event) => {
                const isJoined = joinedEvents.includes(event.id);
                return (
                  <article
                    key={event.id}
                    className="glass-panel flex flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#16120E]/80 shadow-2xl"
                  >
                    <div className="relative h-56 bg-[#16120E]">
                      {event.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-6xl text-[#E07340] bg-gradient-to-br from-[#C4622D]/15 to-[#1a1510]">
                          {event.emoji || '📍'}
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#0E0B08]/80 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#E07340] font-bold">
                          {event.category || 'Event'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-6 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-xl font-serif font-bold text-white">{event.title}</h3>
                          <span className="text-xs uppercase tracking-[0.2em] text-[#9C8B72]">{formatAttendeeCount(event.event_attendees?.length ?? 0)}</span>
                        </div>
                        <p className="text-sm leading-relaxed text-[#d3c8b6] line-clamp-3">{event.description || 'No description available.'}</p>
                      </div>
                      <div className="space-y-3 text-sm text-[#9C8B72]">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-[#E07340]" />
                          <span>{event.event_time || 'TBD'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-[#E07340]" />
                          <span>{cityFromLocation(event.location)}</span>
                        </div>
                      </div>
                      <div className="mt-auto grid gap-3 sm:grid-cols-2">
                        <Link
                          href={`/events/${event.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#0E0B08] px-4 py-3 text-sm font-semibold text-white hover:border-[#E07340]/30 transition"
                        >
                          View Details
                          <ArrowRight size={16} />
                        </Link>
                        <button
                          type="button"
                          disabled={isJoined || joiningEvents.includes(event.id)}
                          onClick={() => handleJoin(event.id)}
                          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                            isJoined
                              ? 'border border-[#E07340]/20 bg-[#E07340]/10 text-[#E07340]'
                              : 'bg-gradient-to-r from-[#C4622D] to-[#E07340] text-white hover:brightness-110'
                          } ${joiningEvents.includes(event.id) ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {isJoined ? 'Joined ✓' : joiningEvents.includes(event.id) ? 'Joining…' : 'Join Event'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {trendingEvents.length > 0 && (
          <section className="mt-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-[#E07340]/80 font-semibold">Trending Events</p>
                <h2 className="text-3xl font-serif font-bold text-white">Popular right now</h2>
              </div>
              <p className="text-sm text-[#9C8B72] max-w-xl">
                Sorted by attendee count so you can join the events that are building momentum.
              </p>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {trendingEvents.map((event) => (
                <div key={event.id} className="glass-panel rounded-[32px] border border-white/10 bg-[#16120E]/80 p-6 shadow-2xl">
                  <div className="flex items-center justify-between gap-3 text-sm text-[#9C8B72]">
                    <span className="rounded-full bg-[#0E0B08]/80 px-3 py-1 uppercase tracking-[0.2em] text-[#E07340] font-semibold">
                      {event.category || 'Event'}
                    </span>
                    <span>{formatAttendeeCount(event.event_attendees?.length ?? 0)}</span>
                  </div>
                  <div className="mt-6 space-y-4">
                    <h3 className="text-2xl font-serif font-bold text-white">{event.title}</h3>
                    <p className="text-sm leading-relaxed text-[#d3c8b6] line-clamp-3">{event.description || 'No description available.'}</p>
                  </div>
                  <div className="mt-6 grid gap-3 text-sm text-[#9C8B72]">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#E07340]" />
                      <span>{event.event_time || 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#E07340]" />
                      <span>{cityFromLocation(event.location)}</span>
                    </div>
                  </div>
                  <Link
                    href={`/events/${event.id}`}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-[#0E0B08] px-4 py-3 text-sm font-semibold text-white hover:border-[#E07340]/30 transition"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {selectedEvent && (
          <section className="mt-10 glass-panel rounded-[32px] border border-white/10 bg-[#0E0B08]/80 p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[#E07340] font-semibold">Event details</p>
                <h2 className="text-3xl font-serif font-bold text-white">{selectedEvent.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-[#16120E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1b1713] transition"
              >
                Close
              </button>
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="space-y-4 text-[#d3c8b6]">
                <p>{selectedEvent.description || 'No description available for this event.'}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-[#16120E]/70 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#9C8B72]">When</p>
                    <p className="mt-3 text-white font-semibold">{selectedEvent.event_time || 'TBD'}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-[#16120E]/70 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#9C8B72]">Location</p>
                    <p className="mt-3 text-white font-semibold">{selectedEvent.location || 'TBD'}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[32px] border border-white/10 bg-[#16120E]/80 p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-[#E07340] font-semibold">Attendees</span>
                  <span className="text-sm text-[#9C8B72]">{formatAttendeeCount(selectedEvent.event_attendees?.length ?? 0)}</span>
                </div>
                <div className="mt-6 grid gap-4">
                  {selectedEvent.event_attendees?.slice(0, 4).map((attendee, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-[#0E0B08]/90 p-4">
                      <div className="h-12 w-12 rounded-full bg-[#16120E] border border-white/10 overflow-hidden flex items-center justify-center text-xl text-[#E07340]">
                        {attendee.profiles?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={attendee.profiles.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                        ) : (
                          '👤'
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-white">{attendee.profiles?.avatar_url ? 'Guest' : 'Attendee'}</p>
                        <p className="text-xs text-[#9C8B72]">{attendee.is_solo ? 'Solo attendee' : 'Group attendee'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
