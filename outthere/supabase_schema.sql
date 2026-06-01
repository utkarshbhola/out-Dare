-- ============================================================
-- OutThere — Supabase Schema & Seed Data
-- Run this entire script in your Supabase SQL Editor once.
-- ============================================================

-- 1. PROFILES table (linked to Auth for closed beta)
CREATE TABLE IF NOT EXISTS public.profiles (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name              text NOT NULL,
  handle            text UNIQUE NOT NULL,
  avatar_url        text,
  bio               text,
  city              text,
  profile_completed boolean DEFAULT false,
  trust_score       int DEFAULT 80,
  created_at        timestamptz DEFAULT now()
);

-- 2. EVENTS table
CREATE TABLE IF NOT EXISTS public.events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text,
  category      text NOT NULL,
  emoji         text DEFAULT '📍',
  location      text,
  event_time    text,            -- human-readable string for prototype (e.g. "Tonight, 8 PM")
  max_attendees int,
  image_url     text,
  created_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now()
);

-- 3. EVENT_ATTENDEES join table
CREATE TABLE IF NOT EXISTS public.event_attendees (
  event_id    uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_solo     boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (event_id, profile_id)
);

-- 4. GROUPS table
CREATE TABLE IF NOT EXISTS public.groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name        text NOT NULL,
  capacity    int DEFAULT 6,
  women_only  boolean DEFAULT false,
  expires_at  timestamptz DEFAULT (now() + interval '2 hours'),
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY — permissive for prototype (anon can read all)
-- ============================================================
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups          ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY "Public read profiles"        ON public.profiles        FOR SELECT USING (true);
CREATE POLICY "Public read events"          ON public.events          FOR SELECT USING (true);
CREATE POLICY "Public read attendees"       ON public.event_attendees FOR SELECT USING (true);
CREATE POLICY "Public read groups"          ON public.groups          FOR SELECT USING (true);

-- Allow anyone to insert (prototype — no auth gate yet)
CREATE POLICY "Public insert events"        ON public.events          FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert attendees"     ON public.event_attendees FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert profiles"      ON public.profiles        FOR INSERT WITH CHECK (true);

-- Allow event deletion only by the event creator (authenticated user must match created_by)
CREATE POLICY "Allow delete events by owner" ON public.events FOR DELETE USING (auth.uid() = created_by);

-- ============================================================
-- SEED DATA — mirrors the existing INITIAL_EVENTS mock data
-- ============================================================

-- Seed a dummy profile for the prototype user
INSERT INTO public.profiles (id, name, handle, avatar_url, bio, trust_score)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Aisha Sharma',
  '@aishasharma',
  'https://i.pravatar.cc/150?u=aisha',
  'Exploring Bangalore one cold brew at a time. Always up for a weekend trek or an indie gig.',
  92
) ON CONFLICT (id) DO NOTHING;

-- Seed 3 events
INSERT INTO public.events (id, title, description, category, emoji, location, event_time, created_by)
VALUES
  (
    '00000000-0000-0000-0000-000000000010',
    'Koramangala Indie Nights',
    'Local indie bands playing original sets. Great vibe, affordable drinks.',
    'Concerts', '🎸', 'Fandom, Bangalore', 'Tonight, 8 PM',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '00000000-0000-0000-0000-000000000011',
    'Nandi Hills Sunrise Trek',
    'Early morning hike to catch the sunrise. Carpooling available from Indiranagar.',
    'Treks', '⛰️', 'Nandi Hills', 'Tomorrow, 4 AM',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '00000000-0000-0000-0000-000000000012',
    'Third Wave Coffee Tasting',
    'Learn to taste specialty coffee like a pro. Includes 4 pours and pastries.',
    'Cafés', '☕', 'HSR Layout', 'Saturday, 11 AM',
    '00000000-0000-0000-0000-000000000001'
  )
ON CONFLICT (id) DO NOTHING;

-- Seed groups for event 1
INSERT INTO public.groups (event_id, name, capacity, women_only, expires_at)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'The Front Rowers',  8, false, now() + interval '80 minutes'),
  ('00000000-0000-0000-0000-000000000010', 'Girls Night Out',   5, true,  now() + interval '45 minutes'),
  ('00000000-0000-0000-0000-000000000011', 'Indiranagar Carpool', 4, false, now() + interval '5 hours'),
  ('00000000-0000-0000-0000-000000000012', 'Espresso Enthusiasts', 4, false, now() + interval '2 hours')
ON CONFLICT DO NOTHING;

-- Seed some attendees (solo goers) for each event using fake UUIDs
INSERT INTO public.profiles (id, name, handle, avatar_url, trust_score)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'User 2', '@user2', 'https://i.pravatar.cc/150?u=1', 75),
  ('00000000-0000-0000-0000-000000000003', 'User 3', '@user3', 'https://i.pravatar.cc/150?u=2', 80),
  ('00000000-0000-0000-0000-000000000004', 'User 4', '@user4', 'https://i.pravatar.cc/150?u=3', 70),
  ('00000000-0000-0000-0000-000000000005', 'User 5', '@user5', 'https://i.pravatar.cc/150?u=4', 85)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.event_attendees (event_id, profile_id, is_solo)
VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', true),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', true),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000003', false),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000004', true),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000005', true),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', true)
ON CONFLICT DO NOTHING;
