"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, Map, User, Bell, Search, Filter, MessageSquare, 
  ChevronRight, MapPin, Calendar, Clock, Users, ShieldCheck, 
  Zap, Star, ArrowLeft, Send, Sparkles, Navigation, Plus, X
} from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { fetchEvents as apiFetchEvents, createEvent as apiCreateEvent, joinEvent as apiJoinEvent, sendChatMessage } from '@/lib/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- MOCK DATA ---
const MOCK_USER = {
  name: "Aisha Sharma",
  handle: "@aishasharma",
  avatar: "https://i.pravatar.cc/150?u=aisha",
  trustScore: 92,
  connections: 145,
  eventsAttended: 24,
  reputation: "Stellar",
  bio: "Exploring Bangalore one cold brew at a time. Always up for a weekend trek or an indie gig."
};

const CATEGORIES = ["All", "Concerts", "Treks", "Cafés", "Tech", "Nightlife", "Art"];

const INITIAL_EVENTS = [
  {
    id: 1,
    title: "Koramangala Indie Nights",
    category: "Concerts",
    emoji: "🎸",
    time: "Tonight, 8 PM",
    location: "Fandom, Bangalore",
    soloCount: 42,
    totalCount: 156,
    description: "Local indie bands playing original sets. Great vibe, affordable drinks.",
    safety: ["Verified Venue", "Well Lit Area", "Crowded"],
    groups: [
      { id: 'g1', name: "The Front Rowers", members: 6, capacity: 8, expires: "1h 20m", womenOnly: false },
      { id: 'g2', name: "Girls Night Out", members: 3, capacity: 5, expires: "45m", womenOnly: true },
    ],
    attendees: ["https://i.pravatar.cc/150?u=1", "https://i.pravatar.cc/150?u=2", "https://i.pravatar.cc/150?u=3", "https://i.pravatar.cc/150?u=4"]
  },
  {
    id: 2,
    title: "Nandi Hills Sunrise Trek",
    category: "Treks",
    emoji: "⛰️",
    time: "Tomorrow, 4 AM",
    location: "Nandi Hills",
    soloCount: 18,
    totalCount: 45,
    description: "Early morning hike to catch the sunrise. Carpooling available from Indiranagar.",
    safety: ["Guided Trek", "Group Departure", "Emergency Kit"],
    groups: [
      { id: 'g3', name: "Indiranagar Carpool", members: 3, capacity: 4, expires: "5h", womenOnly: false },
    ],
    attendees: ["https://i.pravatar.cc/150?u=5", "https://i.pravatar.cc/150?u=6", "https://i.pravatar.cc/150?u=7"]
  },
  {
    id: 3,
    title: "Third Wave Coffee Tasting",
    category: "Cafés",
    emoji: "☕",
    time: "Saturday, 11 AM",
    location: "HSR Layout",
    soloCount: 12,
    totalCount: 20,
    description: "Learn to taste specialty coffee like a pro. Includes 4 pours and pastries.",
    safety: ["Public Place", "Daytime Event"],
    groups: [
      { id: 'g4', name: "Espresso Enthusiasts", members: 2, capacity: 4, expires: "2h", womenOnly: false }
    ],
    attendees: ["https://i.pravatar.cc/150?u=8", "https://i.pravatar.cc/150?u=9"]
  }
];

const ICEBREAKERS = [
  "What's your favorite local band?",
  "First time at Fandom or a regular?",
  "What drink are you getting?"
];

const CHAT_HISTORY = [
  { role: "ai", content: "Hey Aisha! Notice you're heading to the Indie Night. Want me to introduce you to anyone in particular?" },
  { role: "user", content: "Yeah, anyone else going solo from HSR?" },
  { role: "ai", content: "Found 3 people from HSR going solo. Sarah (@sarahj) is also looking for a carpool. Should I ping her?" }
];

// --- COMPONENTS ---

export default function OutThereApp() {
  const [activeTab, setActiveTab] = useState('home'); // home, map, profile
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<typeof INITIAL_EVENTS[0] | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await apiFetchEvents();
        const formattedEvents = data.map((event: any) => {
          const attendees = event.event_attendees || [];
          const soloCount = attendees.filter((a: any) => a.is_solo).length;
          const totalCount = attendees.length;
          const attendeeAvatars = attendees.map((a: any) => a.profiles?.avatar_url).filter(Boolean);

          return {
            id: event.id,
            title: event.title,
            category: event.category,
            emoji: event.emoji,
            time: event.event_time,
            location: event.location,
            soloCount,
            totalCount,
            description: event.description,
            safety: ["Verified Venue", "Well Lit Area", "Crowded"],
            groups: event.groups || [],
            attendees: attendeeAvatars
          };
        });

        if (formattedEvents.length > 0) {
          setEvents(formattedEvents);
          // Update selected event if open
          setSelectedEvent(prev => prev ? formattedEvents.find((e: any) => e.id === prev.id) || prev : null);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();

    const supabase = getSupabaseBrowserClient();
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchEvents())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_attendees' }, () => fetchEvents())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateEvent = async (newEventData: any) => {
    // Optimistic update
    const optimisticEvent = {
      id: Date.now(),
      ...newEventData,
      soloCount: 1,
      totalCount: 1,
      safety: ["Community Created", "Unverified"],
      groups: [],
      attendees: [MOCK_USER.avatar]
    };
    setEvents([optimisticEvent, ...events]);
    setIsCreateModalOpen(false);

    try {
      await apiCreateEvent(newEventData);
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };
  return (
    <div className="flex h-screen overflow-hidden text-[#F5EDD8] font-sans">
      {/* SIDEBAR NAVIGATION */}
      <nav className="w-20 md:w-64 glass-panel border-r border-t-0 border-b-0 border-l-0 flex flex-col items-center md:items-start py-8 z-40 transition-all">
        <div className="mb-12 md:px-8 flex items-center justify-center w-full md:justify-start">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C4622D] to-[#E07340] flex items-center justify-center font-serif text-2xl font-bold shadow-[0_0_20px_rgba(196,98,45,0.4)]">
            O
          </div>
          <span className="hidden md:block ml-3 font-serif text-2xl font-bold tracking-wide">OutThere</span>
        </div>

        <div className="flex flex-col gap-6 w-full px-4 md:px-6">
          <NavItem icon={<Compass />} label="Discovery" active={activeTab === 'home' && !selectedEvent} onClick={() => { setActiveTab('home'); setSelectedEvent(null); }} />
          <NavItem icon={<Map />} label="Explore Map" active={activeTab === 'map'} onClick={() => { setActiveTab('map'); setSelectedEvent(null); }} />
          <NavItem icon={<User />} label="Profile" active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); setSelectedEvent(null); }} />
        </div>

        <div className="mt-auto flex flex-col gap-6 w-full px-4 md:px-6">
          <NavItem icon={<Bell />} label="Notifications" badge={3} />
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden">
        {/* STICKY TOP BAR */}
        <header className="sticky top-0 z-30 glass-panel border-b border-t-0 border-l-0 border-r-0 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm">
            <MapPin size={14} className="text-[#E07340]" />
            <span className="font-medium">Bangalore</span>
            <ChevronRight size={14} className="text-[#9C8B72]" />
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="hidden md:flex items-center gap-2 bg-gradient-to-r from-[#C4622D] to-[#E07340] text-white px-4 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(196,98,45,0.3)] hover:scale-105 transition-transform"
            >
              <Plus size={16} /> Create Event
            </button>
            <button className="p-2 rounded-full hover:bg-white/5 transition">
              <Search size={20} />
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#E07340] cursor-pointer" onClick={() => { setActiveTab('profile'); setSelectedEvent(null); }}>
              <img src={MOCK_USER.avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {selectedEvent ? (
              <EventDetailView key="event-detail" event={selectedEvent} onBack={() => setSelectedEvent(null)} />
            ) : activeTab === 'home' ? (
              <HomeFeedView key="home" events={events} onSelectEvent={setSelectedEvent} />
            ) : activeTab === 'map' ? (
              <MapView key="map" events={events} />
            ) : (
              <ProfileView key="profile" />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isCreateModalOpen && (
              <CreateEventModal 
                onClose={() => setIsCreateModalOpen(false)} 
                onCreate={handleCreateEvent} 
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- SUBVIEWS ---

function HomeFeedView({ events, onSelectEvent }: { events: any[], onSelectEvent: (e: any) => void }) {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Find your tribe <br/><span className="text-gradient">tonight.</span></h1>
        <p className="text-[#9C8B72] text-lg max-w-md">1,240 people are exploring Bangalore right now. Join them.</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 mb-8 hide-scrollbar">
        {CATEGORIES.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={cn(
              "px-5 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-300",
              activeFilter === cat 
                ? "bg-gradient-to-r from-[#C4622D] to-[#E07340] text-white shadow-[0_0_15px_rgba(196,98,45,0.3)]" 
                : "glass-card text-[#9C8B72] hover:text-[#F5EDD8]"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {events.filter(e => activeFilter === "All" || e.category === activeFilter).map(event => (
            <EventCard key={event.id} event={event} onClick={() => onSelectEvent(event)} />
          ))}
        </div>

        <div className="hidden lg:block space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif font-bold text-xl">Nearby & Solo</h3>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
            
            <div className="space-y-4">
              {[10, 11, 12].map(id => (
                <div key={id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={`https://i.pravatar.cc/150?u=${id}`} className="w-10 h-10 rounded-full" alt="User" />
                      <div className="absolute -bottom-1 -right-1 bg-[#1a1510] rounded-full p-0.5">
                        <ShieldCheck size={12} className="text-blue-400" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Alex {id}</p>
                      <p className="text-xs text-[#9C8B72]">0.2 km away • Tech</p>
                    </div>
                  </div>
                  <button className="p-2 rounded-full bg-white/5 hover:bg-[#E07340]/20 hover:text-[#E07340] transition">
                    <MessageSquare size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EventCard({ event, onClick }: { event: any, onClick: () => void }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="glass-card rounded-2xl p-1 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        <div className="w-full sm:w-32 h-32 rounded-xl bg-white/5 flex flex-col items-center justify-center flex-shrink-0 relative overflow-hidden group-hover:border-[#E07340]/30 transition-colors border border-transparent">
          <div className="absolute inset-0 bg-gradient-to-br from-[#C4622D]/10 to-transparent"></div>
          <span className="text-5xl relative z-10 filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{event.emoji}</span>
        </div>
        
        <div className="flex-1 py-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-bold text-[#E07340] tracking-wider uppercase">{event.category}</span>
              <div className="flex items-center gap-1 bg-[#C4622D]/20 text-[#E07340] px-2 py-1 rounded-md text-xs font-semibold">
                <User size={12} />
                <span>{event.soloCount} going solo</span>
              </div>
            </div>
            <h3 className="text-xl font-serif font-bold mb-2 group-hover:text-[#E07340] transition-colors">{event.title}</h3>
            <p className="text-sm text-[#9C8B72] line-clamp-1 mb-3">{event.description}</p>
          </div>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-3 text-xs text-[#9C8B72]">
              <div className="flex items-center gap-1"><Calendar size={14} /> {event.time}</div>
              <div className="flex items-center gap-1"><MapPin size={14} /> {event.location}</div>
            </div>
            
            <div className="flex items-center">
              <div className="flex -space-x-2 mr-3">
                {event.attendees.map((a: string, i: number) => (
                  <img key={i} src={a} className="w-6 h-6 rounded-full border border-[#1a1510]" alt="Attendee" />
                ))}
              </div>
              <ChevronRight size={18} className="text-[#E07340] opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EventDetailView({ event, onBack }: { event: any, onBack: () => void }) {
  const handleJoinEvent = async () => {
    // Prevent joining if it's already a mock event that wasn't saved in DB yet (optimistic event check)
    if (typeof event.id === 'number') return;
    
    try {
      await apiJoinEvent(event.id);
    } catch (error) {
      console.error("Error joining event:", error);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pb-20">
      <button onClick={onBack} className="flex items-center gap-2 text-[#9C8B72] hover:text-[#F5EDD8] transition mb-8 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Discovery
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-3xl p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C4622D]/10 rounded-full filter blur-[60px] pointer-events-none"></div>
            
            <div className="text-6xl mb-6">{event.emoji}</div>
            <div className="flex items-center gap-3 mb-4 text-sm font-medium">
              <span className="bg-[#E07340]/20 text-[#E07340] px-3 py-1 rounded-full uppercase tracking-wider text-xs">{event.category}</span>
              <span className="text-[#9C8B72] flex items-center gap-1"><User size={14} /> {event.totalCount} Attending</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{event.title}</h1>
            <p className="text-lg text-[#9C8B72] mb-8 leading-relaxed max-w-2xl">{event.description}</p>
            
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2"><Calendar className="text-[#E07340]" size={18} /> <div><p className="text-[#9C8B72] text-xs">When</p><p>{event.time}</p></div></div>
              <div className="flex items-center gap-2"><MapPin className="text-[#E07340]" size={18} /> <div><p className="text-[#9C8B72] text-xs">Where</p><p>{event.location}</p></div></div>
            </div>
          </div>

          <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2">Active Groups <span className="text-xs font-sans bg-white/10 px-2 py-0.5 rounded-full text-[#9C8B72]">{event.groups.length}</span></h2>
          <div className="space-y-4">
            {event.groups.map((group: any) => (
              <div key={group.id} className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{group.name}</h3>
                    {group.womenOnly && <span className="bg-pink-500/20 text-pink-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm">Women Only</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#9C8B72]">
                    <div className="flex items-center gap-1"><Users size={14} /> {group.members}/{group.capacity} filled</div>
                    <div className="flex items-center gap-1"><Clock size={14} /> Expires in {group.expires}</div>
                  </div>
                </div>
                <button 
                  onClick={handleJoinEvent}
                  className="w-full sm:w-auto bg-white/10 hover:bg-[#C4622D] text-white px-6 py-2.5 rounded-xl font-medium transition-all hover:shadow-[0_0_15px_rgba(196,98,45,0.4)]">
                  Request to Join
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-serif font-bold text-xl mb-4 flex items-center gap-2"><ShieldCheck className="text-green-400" /> Safety Check</h3>
            <ul className="space-y-3">
              {event.safety.map((s: string, i: number) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel rounded-2xl p-6 bg-gradient-to-b from-white/5 to-transparent">
            <h3 className="font-serif font-bold text-xl mb-4 flex items-center gap-2"><Sparkles className="text-[#E07340]" /> AI Icebreakers</h3>
            <p className="text-xs text-[#9C8B72] mb-4">Don't know what to say? Try these conversation starters based on the event.</p>
            <div className="space-y-2">
              {ICEBREAKERS.map((ib, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 text-sm hover:border-[#E07340]/30 transition cursor-pointer flex justify-between items-center group">
                  <span>{ib}</span>
                  <Send size={14} className="opacity-0 group-hover:opacity-100 text-[#E07340] transition" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MapView({ events }: { events: any[] }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="h-[calc(100vh-140px)] w-full rounded-3xl overflow-hidden relative glass-panel p-1">
      {/* Abstract SVG Map Background */}
      <div className="w-full h-full bg-[#110d0a] rounded-3xl relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path d="M100 0 V1000 M200 0 V1000 M300 0 V1000 M400 0 V1000 M500 0 V1000 M600 0 V1000 M700 0 V1000 M800 0 V1000 M900 0 V1000" stroke="#9C8B72" strokeWidth="1" />
          <path d="M0 100 H1000 M0 200 H1000 M0 300 H1000 M0 400 H1000 M0 500 H1000 M0 600 H1000 M0 700 H1000 M0 800 H1000 M0 900 H1000" stroke="#9C8B72" strokeWidth="1" />
          
          <path d="M 200 800 C 400 600, 600 700, 800 300" fill="none" stroke="#C4622D" strokeWidth="8" strokeOpacity="0.4" filter="blur(4px)" />
          <path d="M 200 800 C 400 600, 600 700, 800 300" fill="none" stroke="#C4622D" strokeWidth="2" strokeOpacity="0.8" />
          
          <path d="M 100 200 Q 500 400, 900 800" fill="none" stroke="#4a5568" strokeWidth="12" strokeOpacity="0.3" />
        </svg>

        {/* User Location */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full absolute -top-5 -left-5 animate-ping"></div>
          <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-[#110d0a] relative z-10 shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
        </div>

        {/* Pins */}
        <MapPinComponent top="30%" left="60%" emoji="🎸" label="Indie Nights" />
        <MapPinComponent top="70%" left="30%" emoji="☕" label="Coffee Tasting" />
        <MapPinComponent top="20%" left="20%" emoji="⛰️" label="Nandi Trek" />
        <MapPinComponent top="60%" left="80%" emoji="🍸" label="Mixology" />

        {/* Map UI Overlay */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
          <div className="glass-panel px-4 py-3 rounded-2xl pointer-events-auto flex gap-4">
            <button className="text-[#E07340] font-bold text-sm border-b-2 border-[#E07340] pb-1">Events</button>
            <button className="text-[#9C8B72] hover:text-[#F5EDD8] font-bold text-sm pb-1 transition">People</button>
          </div>
          <div className="flex flex-col gap-2 pointer-events-auto">
            <button className="w-10 h-10 glass-panel rounded-full flex items-center justify-center hover:bg-white/10 transition"><Navigation size={18} /></button>
            <button className="w-10 h-10 glass-panel rounded-full flex items-center justify-center hover:bg-white/10 transition text-xl font-mono">+</button>
            <button className="w-10 h-10 glass-panel rounded-full flex items-center justify-center hover:bg-white/10 transition text-xl font-mono">-</button>
          </div>
        </div>

        {/* Bottom Sheet */}
        <div className="absolute bottom-6 left-6 right-6 pointer-events-auto">
          <div className="glass-panel rounded-3xl p-6 max-w-2xl mx-auto backdrop-blur-xl bg-[#0E0B08]/80">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>
            <h3 className="font-serif font-bold text-xl mb-4">Nearby <span className="text-[#E07340]">Right Now</span></h3>
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {events.map(event => (
                <div key={event.id} className="min-w-[280px] p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#E07340]/40 transition cursor-pointer">
                  <div className="flex gap-3 mb-2">
                    <span className="text-3xl">{event.emoji}</span>
                    <div>
                      <h4 className="font-bold font-serif text-lg leading-tight truncate">{event.title}</h4>
                      <p className="text-xs text-[#9C8B72]">{event.time} • 0.8 km</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex -space-x-2">
                      {event.attendees.slice(0,3).map((a: string, i: number) => (
                        <img key={i} src={a} className="w-6 h-6 rounded-full border border-[#1a1510]" alt="Attendee" />
                      ))}
                    </div>
                    <button className="text-xs font-bold text-[#E07340] bg-[#E07340]/10 px-3 py-1.5 rounded-lg">Join</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MapPinComponent({ top, left, emoji, label }: { top: string, left: string, emoji: string, label: string }) {
  return (
    <div className="absolute group cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-20" style={{ top, left }}>
      <div className="absolute -inset-4 bg-[#C4622D]/20 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="w-10 h-10 bg-gradient-to-br from-[#1a1510] to-[#0E0B08] border border-[#E07340] rounded-full flex items-center justify-center text-xl shadow-[0_0_15px_rgba(224,115,64,0.4)] relative z-10 group-hover:scale-110 transition-transform">
        {emoji}
      </div>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-[#1a1510] border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-30">
        {label}
      </div>
    </div>
  );
}

function ProfileView() {
  const [chatHistory, setChatHistory] = useState(CHAT_HISTORY);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendChat = async () => {
    if (!chatInput.trim() || isLoading) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);
    
    try {
      const response = await sendChatMessage(userMsg);
      setChatHistory(prev => [...prev, response]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="pb-20 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-[#C4622D]/20 to-transparent"></div>
            
            {/* Hexagonal Avatar */}
            <div className="relative w-32 h-32 mb-4 mt-4">
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-[#E07340] drop-shadow-[0_0_10px_rgba(224,115,64,0.5)]">
                <polygon fill="none" stroke="currentColor" strokeWidth="2" points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" />
              </svg>
              <div className="absolute inset-[4px] overflow-hidden" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                <img src={MOCK_USER.avatar} alt={MOCK_USER.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-[#C4622D] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                Founding Member
              </div>
            </div>

            <h2 className="text-2xl font-serif font-bold mt-4">{MOCK_USER.name}</h2>
            <p className="text-[#9C8B72] text-sm mb-4">{MOCK_USER.handle}</p>
            <p className="text-sm leading-relaxed mb-6">{MOCK_USER.bio}</p>

            <div className="w-full">
              <div className="flex justify-between text-xs mb-2">
                <span className="font-bold text-[#E07340]">Trust Score</span>
                <span>{MOCK_USER.trustScore}/100</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#C4622D] to-[#E07340] w-[92%] rounded-full relative">
                  <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 blur-[2px] animate-pulse"></div>
                </div>
              </div>
              <p className="text-[10px] text-[#9C8B72] mt-2 text-left flex items-center gap-1"><ShieldCheck size={12} className="text-green-400" /> Identity Verified via Aadhaar</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-5 text-center">
              <div className="text-3xl font-serif text-[#F5EDD8] mb-1">{MOCK_USER.eventsAttended}</div>
              <div className="text-xs text-[#9C8B72] uppercase tracking-wider">Events</div>
            </div>
            <div className="glass-card rounded-2xl p-5 text-center">
              <div className="text-3xl font-serif text-[#F5EDD8] mb-1">{MOCK_USER.connections}</div>
              <div className="text-xs text-[#9C8B72] uppercase tracking-wider">Connections</div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel rounded-3xl p-6 flex flex-col h-[400px]">
            <h3 className="font-serif font-bold text-xl mb-6 flex items-center gap-2"><Sparkles className="text-[#E07340]" /> OutThere AI Concierge</h3>
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
              {chatHistory.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl p-4 text-sm",
                    msg.role === 'user' 
                      ? "bg-[#E07340] text-white rounded-br-sm" 
                      : "bg-white/5 border border-white/10 text-[#F5EDD8] rounded-bl-sm"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 text-[#F5EDD8] rounded-2xl rounded-bl-sm p-4 text-sm animate-pulse">
                    Typing...
                  </div>
                </div>
              )}
            </div>

            <div className="relative mt-auto">
              <input 
                type="text" 
                placeholder="Ask your concierge to find plans or people..." 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                className="w-full bg-[#1a1510] border border-white/10 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:border-[#E07340]/50 transition text-sm"
              />
              <button onClick={handleSendChat} className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-[#C4622D] to-[#E07340] rounded-full flex items-center justify-center text-white hover:shadow-[0_0_15px_rgba(224,115,64,0.4)] transition">
                <ArrowLeft size={18} className="transform rotate-135" />
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <h3 className="font-serif font-bold text-xl mb-6">Recent Activity</h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#E07340] before:to-transparent">
              
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-[#0E0B08] bg-[#E07340] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <Star size={12} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-card p-4 rounded-2xl">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-sm">Rated "Stellar"</h4>
                    <span className="text-[10px] text-[#9C8B72]">2d ago</span>
                  </div>
                  <p className="text-xs text-[#9C8B72]">Received a stellar reputation tag from @rahul_v after the Nandi Hills Trek.</p>
                </div>
              </div>

              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-[#0E0B08] bg-white/20 text-[#F5EDD8] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <MapPin size={12} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-card p-4 rounded-2xl">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-sm">Attended Event</h4>
                    <span className="text-[10px] text-[#9C8B72]">5d ago</span>
                  </div>
                  <p className="text-xs text-[#9C8B72]">Koramangala Indie Nights at Fandom. Group: The Front Rowers.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NavItem({ icon, label, active, onClick, badge }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, badge?: number }) {
  return (
    <div 
      className={cn(
        "flex items-center gap-4 w-full p-3 rounded-xl cursor-pointer transition-all group relative",
        active ? "bg-white/10 text-[#F5EDD8]" : "text-[#9C8B72] hover:bg-white/5 hover:text-[#F5EDD8]"
      )}
      onClick={onClick}
    >
      {active && <motion.div layoutId="nav-indicator" className="absolute left-0 w-1 h-8 bg-[#E07340] rounded-r-full" />}
      <div className={cn("transition-colors", active ? "text-[#E07340]" : "group-hover:text-[#F5EDD8]")}>
        {icon}
      </div>
      <span className="font-medium hidden md:block">{label}</span>
      {badge && (
        <span className="ml-auto hidden md:flex w-5 h-5 bg-[#C4622D] rounded-full text-[10px] items-center justify-center text-white font-bold">
          {badge}
        </span>
      )}
    </div>
  );
}

function CreateEventModal({ onClose, onCreate }: { onClose: () => void, onCreate: (event: any) => void }) {
  const [formData, setFormData] = useState({
    title: "",
    category: "Concerts",
    emoji: "🎉",
    time: "Tomorrow, 7 PM",
    location: "Bangalore",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-panel w-full max-w-lg rounded-3xl p-8 relative z-10 bg-[#0E0B08]/90"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-[#9C8B72] hover:text-[#F5EDD8] transition">
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-serif font-bold mb-6">Create New Event</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="w-20">
              <label className="block text-xs text-[#9C8B72] mb-1">Emoji</label>
              <input 
                type="text" 
                value={formData.emoji}
                onChange={e => setFormData({...formData, emoji: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-2xl text-center focus:border-[#E07340]/50 focus:outline-none transition"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-[#9C8B72] mb-1">Event Title</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Indiranagar Pub Crawl"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#E07340]/50 focus:outline-none transition text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#9C8B72] mb-1">Category</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-[#1a1510] border border-white/10 rounded-xl px-4 py-3 focus:border-[#E07340]/50 focus:outline-none transition text-sm appearance-none"
              >
                {CATEGORIES.filter(c => c !== "All").map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#9C8B72] mb-1">Location</label>
              <input 
                type="text" 
                required
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#E07340]/50 focus:outline-none transition text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-[#9C8B72] mb-1">Date & Time</label>
            <input 
              type="text" 
              required
              value={formData.time}
              onChange={e => setFormData({...formData, time: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#E07340]/50 focus:outline-none transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-[#9C8B72] mb-1">Description</label>
            <textarea 
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#E07340]/50 focus:outline-none transition text-sm resize-none"
              placeholder="What's the plan?"
            />
          </div>
          
          <div className="pt-4">
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-[#C4622D] to-[#E07340] text-white py-3.5 rounded-xl font-bold shadow-[0_0_20px_rgba(196,98,45,0.3)] hover:scale-[1.02] transition-transform"
            >
              Publish Event
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
