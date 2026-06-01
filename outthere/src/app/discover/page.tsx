"use client";

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { fetchEvents } from '@/lib/api';

type EventData = {
  id: string;
  title: string;
  category?: string;
  emoji?: string;
  location?: string;
  description?: string;
  event_time?: string;
  time?: string;
  event_attendees?: Array<{
    is_solo: boolean;
    profiles?: { avatar_url?: string };
  }>;
  groups?: any[];
};

function EventCard({ event, onSelect }: { event: EventData; onSelect: (e: EventData) => void }) {
  const displayTime = event.event_time || event.time || 'TBD';
  const attendeeCount = event.event_attendees?.length ?? 0;
  const soloCount = event.event_attendees?.filter((att) => att.is_solo).length ?? 0;

  return (
    <div
      className="bg-white/3 border border-white/5 rounded-2xl p-4 cursor-pointer hover:shadow-md transition"
      onClick={() => onSelect(event)}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{event.emoji || '📌'}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{event.title}</h3>
          <p className="text-sm text-[#9C8B72]">
            {event.location || 'No location'} · {displayTime}
          </p>
        </div>
        <div className="text-xs text-[#9C8B72] text-right">
          <div>{soloCount} solo</div>
          <div>{attendeeCount} going</div>
        </div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EventData | null>(null);

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

  const selectedTime = selected?.event_time || selected?.time || 'TBD';
  const selectedCount = selected?.event_attendees?.length ?? 0;

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold">Discover</h1>
            <p className="text-sm text-[#9C8B72] mt-2">Browse nearby events and find your next plan.</p>
          </div>
          <div className="text-sm text-[#9C8B72]">Loaded {events.length} event{events.length === 1 ? '' : 's'}</div>
        </div>

        {loading ? (
          <div className="text-sm text-[#9C8B72]">Loading events…</div>
        ) : error ? (
          <div className="text-sm text-red-400">{error}</div>
        ) : events.length === 0 ? (
          <div className="text-sm text-[#9C8B72]">No events found. Try creating one or check back later.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => (
              <EventCard key={ev.id} event={ev} onSelect={setSelected} />
            ))}
          </div>
        )}

        {selected && (
          <div className="mt-6 bg-white/5 border border-white/10 rounded-3xl p-6 shadow-lg">
            <button className="text-sm text-[#9C8B72] mb-4" onClick={() => setSelected(null)}>
              ← Back to discover
            </button>
            <h2 className="text-2xl font-semibold mb-2">{selected.title}</h2>
            <p className="text-sm text-[#9C8B72] mb-4">{selected.description || 'No description provided.'}</p>
            <div className="grid gap-3 sm:grid-cols-3 text-sm text-[#9C8B72]">
              <div>
                <div className="font-semibold text-white">When</div>
                <div>{selectedTime}</div>
              </div>
              <div>
                <div className="font-semibold text-white">Where</div>
                <div>{selected.location || 'Unknown'}</div>
              </div>
              <div>
                <div className="font-semibold text-white">Attendees</div>
                <div>{selectedCount} going</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
