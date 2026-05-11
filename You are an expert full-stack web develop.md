You are an expert full-stack web developer and UI/UX designer.

Build a complete, single-file web app prototype for a startup called OutThere — a real-world social discovery platform that helps people find verified others nearby attending the same events, concerts, treks, cafés, and activities.

TECH: Next.js + Supabase + Mapbox + Vercel

SCREENS TO BUILD (tab/sidebar navigation):
1. Home / Discovery feed — event cards showing solo-goer counts, filter pills by category, nearby people panel
2. Event Detail — full event page with active groups to join, safety info, icebreaker suggestions
3. Explore Map — SVG-based stylised city map with animated clickable pins per event type, bottom sheet of nearby events
4. User Profile — avatar, reputation stats, activity history, trust score progress bar

DESIGN SYSTEM:
- Background: #0E0B08 (near black, warm)
- Primary accent: #C4622D (terracotta)
- Secondary accent: #E07340 (burnt orange)
- Text: #F5EDD8 (warm cream), #9C8B72 (muted)
- Borders: rgba(232,213,176,0.09)
- Fonts: Playfair Display (headings, serif, bold) + Instrument Sans (body)
- Aesthetic: earthy, cinematic, warm dark mode — NOT purple/neon/tech-bro
- Cards use glassmorphism with rgba backgrounds and subtle borders
- Grain texture overlay on body using SVG filter
- All hover states have smooth transitions
- Floating atmospheric orb blobs in hero areas

FEATURES TO INCLUDE:
- Sidebar navigation (icons + tooltips)
- Sticky top bar with logo, city selector, profile avatar
- Event cards with emoji hero image, going-solo count, avatar stack, join button
- Filter pills (All, Concerts, Treks, Cafés, Biking, Tech, Nightlife)
- Nearby people panel with verified badges and wave button
- Group cards inside event detail (with member avatars, capacity, expiry time)
- Women-only group option visible in event detail
- Safety panel with green checkmarks
- SVG map with animated pulsing pins for each category
- Map popup on pin click showing event name and join button
- Horizontal scroll bottom sheet on map screen
- Profile with hexagonal founding badge, stat grid, reputation bar, activity history
- AI chat panel on profile screen (multi-turn, with message history)
- Icebreaker generator on event detail screen

CITIES: Delhi NCR and Bangalore (launch cities)
LAUNCH DATE: 1 September 2026
TONE: Premium consumer startup. Feels like the future of real-world human connection.

Write clean, well-commented code. All screens must be fully functional with real interactivity.