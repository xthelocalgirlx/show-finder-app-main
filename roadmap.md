# Roadmap
- [x] AI recommendations from preferences
- [x] Date range filters
- [x] Load more
- [x] Event details view
- [x] Back to top button

Concert Finder — two-day prototype PRD and build guide

Working title: Gig Finder
Version: 1.0 · 23 September 2026
Owner: Product prototype
Status: Ready to build

1. Product summary

A single-screen web app helps a music fan discover upcoming concerts by city, date and music taste. They can type “punk-ish rock in Montréal this weekend.” The app extracts editable search filters, searches Ticketmaster Discovery API for actual events, and displays event name/artist, venue, city, local date and link to the event page.

Problem: Fans know the sound they want and when they are free, but must translate that into rigid genre filters and search multiple listings.
Target user: A casual concertgoer looking for a local show within the next few days.
Value proposition: Describe what you want; see real, relevant shows in one screen.
Primary success measure: A tester can search and open a relevant event listing within 60 seconds.
Supporting measures: At least 80% of five scripted searches yield understandable results or a useful empty state; zero invented event cards; search responses within 5 seconds under normal API conditions.

2. Prototype scope

In scope (must have)

One responsive search screen with a natural-language input and examples.

Editable city, country (default Canada), genre and start/end date filters. Default dates: today through five calendar days ahead in the selected city's time zone, where available; for the first build use explicit date picker values and label them clearly.

A button that searches Ticketmaster for actual events using a Supabase Edge Function.

Results ordered by event date, showing event name or artist, venue, city, local date/time where supplied, artwork where supplied, and “View event” link.

Loading, no results, missing fields and API error states.

AI interpretation for flexible language (“punk-ish rock,” “this weekend”), displayed as editable filters before or alongside results. A controlled genre mapping is an acceptable fallback if an AI service is unavailable.

Server-side storage of API keys. No account or personal data required.

Out of scope for the two-day demo

Ticket purchase or payment inside the app, account login, saved searches, email alerts, maps, RAG/vector database, ticket availability guarantees, venue-size claims, exhaustive listing across all promoters, or full conversational chat.

Source coverage: Results mean “events returned by Ticketmaster Discovery,” not all concerts in a city. Ticketmaster classifications may omit or mislabel niche acts. Display the provider attribution and link to its event page; check its current branding/terms before sharing publicly.

3. User flow

User opens the page and sees “Find your next show” plus example “Punk-ish rock in Montréal this weekend.”

User types a request and clicks Find shows.

Interpreter extracts city, country, date interval and one or two Ticketmaster genre names. UI shows editable chips/fields: Montréal · Rock / Punk · Sep 26–27.

Supabase Edge Function queries Ticketmaster. If two genres are selected, it runs at most two searches and deduplicates by Ticketmaster event ID.

User scans date-sorted cards and opens an event page in a new tab.

User adjusts a filter and searches again, or sees “No Ticketmaster listings matched; widen dates or try Rock.”

4. Functional requirements and acceptance criteria

ID

Requirement

Acceptance criterion

FR1

Search by text

“rock in Montreal” populates Rock and Montreal filters; unrecognized city requests clarification in UI.

FR2

Interpret time

“this weekend” resolves to the upcoming local Saturday and Sunday; show the interpreted dates for correction.

FR3

Genre expansion

“punk-ish rock” maps to at most two documented Ticketmaster classification values; label the applied filters.

FR4

Editable filters

User can change city, dates or genre without rewriting the sentence.

FR5

Live search

Edge Function calls Discovery API with city, countryCode, date range, classification and API key from secrets.

FR6

Results

Each real event has name, venue, city, local date and event link; missing optional data gets a graceful placeholder.

FR7

Deduplication

Same event ID returned for two genres appears once.

FR8

States

Loading, zero matches, invalid input, upstream error and rate limit all have distinct, useful messages.

FR9

Privacy

No login, location permission or user profile; searches are not stored in a database for MVP.

FR10

Security

Ticketmaster and optional AI credentials never appear in frontend source or response; restrict allowed input and throttle public calls before wider release.

Interpretation rule: AI can suggest filters, never fabricate event records or claim an event matches a genre more precisely than the returned classification supports. Date language resolves in the chosen city's time zone. For the prototype, restricting city choices to a short Canadian list with explicit time zones avoids ambiguous city names and DST errors.

5. Data and architecture

Browser search screen
   → optional AI filter extraction (server-side) / deterministic fallback
   → Supabase Edge Function `search-concerts`
   → Ticketmaster Discovery API v2 `/events.json`
   → normalized JSON event cards in browser

Supabase is used for Edge Functions and secrets. No Supabase table, Auth or RAG is required.

Function input: { city, countryCode: "CA", genres: ["Rock"], startDateTime, endDateTime } where dates are ISO-8601 UTC instants. Limit genres to two, city to reasonable length, and interval to at most 31 days. Convert the chosen local calendar date boundaries to UTC instants; end is exclusive where implemented. Do not assume UTC midnight equals Montréal midnight. Start with the exact genre names verified in Ticketmaster's API Explorer.

Function output: { appliedFilters, events: [{ id, name, artist, venue, city, localDate, localTime, imageUrl, eventUrl }], total, warning? }. Use _embedded.events ?? []; artist can fall back to event name; venue and artwork are optional. Deduplicate by id and sort by localDate, then localTime. Only return an upstream event URL supplied by Ticketmaster.

Ticketmaster API: GET https://app.ticketmaster.com/discovery/v2/events.json with apikey, city, countryCode, classificationName, startDateTime, endDateTime, sort=date,asc, size=20. First verify the exact values with a live request in API Explorer. Ticketmaster's default quota is 5,000/day; its documentation and FAQ differ on requests/second, so stay well below both published figures and handle HTTP 429. The result set may be paginated; first-page results are enough for the prototype but label them as a limited list rather than “all shows.”

AI option: Add a second server-side step to parse a free-text request into a strict JSON schema: { city, countryCode, startLocalDate, endLocalDate, genres[] }. Supply an allowlist of countries/cities/genres, validate the model's output, and show it to the user for correction. The LLM must not receive the Ticketmaster key. If no AI API is available, use selectable fields and a simple phrase-to-genre mapping; this still delivers a functional prototype.

6. Screens and copy

Header: Find your next show

Search placeholder: “Punk-ish rock in Montréal this weekend”

Filters: City · Music · Dates; default Next 5 days

Search button: Find shows

Result card: Event/artist · date/time · venue · city · View event

Empty: No Ticketmaster shows matched these filters. Try a wider date range or another genre.

Error: We couldn't load shows right now. Please try again.

Attribution: Event listings from Ticketmaster

7. Exact setup checklist

Ticketmaster

Sign in at the Ticketmaster Developer Portal → My Apps → copy the app's Consumer Key (the Discovery API key). Never put it in a frontend prompt, screenshot or Git repository.

In the Discovery API Explorer test Canada + a city + Music/Rock + a broad upcoming range. Confirm actual event output and whether accented Montréal or Montreal matches better.

Record one successful response's fields (name, id, dates.start.localDate, _embedded.venues, url) for the UI mapping.

Supabase

Create/select a Supabase project. In Edge Functions → Secrets, add TICKETMASTER_API_KEY with the Consumer Key.

Create and deploy an Edge Function called search-concerts. It accepts POST JSON, validates input, creates the Ticketmaster URL with URLSearchParams, calls fetch, handles errors, and returns normalized events. Add an OPTIONS/CORS response for a browser client; restrict origin to your deployed domain once known.

Configure function authentication to match the client. For a no-login demo, configure it as publicly callable / disable the platform JWT check and understand that the public endpoint consumes your Ticketmaster quota. Do not put a Supabase secret/service-role key in frontend code. For a broader public release add per-IP or equivalent throttling and server-side input bounds.

In Supabase's function Test panel send POST JSON with city, countryCode, genres, startDateTime and endDateTime. Use a 14-day range for this first test. Confirm at least one real event, or inspect API Explorer if empty.

In the frontend, use the project's URL and publishable Supabase key with supabase.functions.invoke('search-concerts', { body: filters }). The publishable key can be client-side; Ticketmaster and LLM keys remain function secrets.

Frontend and AI

Build the single page with text input, editable filters and result cards. Wire explicit filters first; test a real search.

Add AI interpretation as a separate server-side call only after the live search works. Give the model current date, supported cities/time zones and genre allowlist. Validate every returned field; render filters for user correction before calling Ticketmaster.

Test empty search, date boundary, no venues, duplicate event, invalid key, API timeout and 429. Do not display the raw key or upstream error payload to users.

8. Two-day schedule

Day 1 (working data path): Obtain/test Ticketmaster key (30–60 min); create project/secrets/function (1–2 h); call the function with one fixed Rock + Montreal search (1 h); build the one-screen filter/results UI (2–3 h). End-of-day gate: A real Ticketmaster event opens from a card.

Day 2 (intelligence and polish): Add natural-language parser and editable interpreted filters (2–3 h); add genre crossover and deduplication (1 h); polish empty/error/mobile states (1–2 h); run five realistic searches and rehearse a 60-second demo (1 h). If AI integration takes too long, retain the working filter-based app and demonstrate the rule-based interpretation of a few phrases.

9. Demo script

Type “punk-ish rock in Montréal this weekend.”

Point out extracted city, dates and related genres, then edit one chip.

Show actual Ticketmaster event cards with artist/event, venue, city, local date.

Open one View event link.

Show a no-results case and broaden the date window.

Decision gate: This is a compelling demo if real events appear for at least two test prompts. If coverage is thin, widen date range to 14 days or switch the demonstration city; do not seed fake live events.

10. Documentation

Ticketmaster Discovery API: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/ 

Ticketmaster API Explorer: https://developer.ticketmaster.com/api-explorer/v2/ 

Supabase Edge Functions: https://supabase.com/docs/guides/functions 

Supabase secrets: https://supabase.com/docs/guides/functions/secrets 

Supabase function authentication: https://supabase.com/docs/guides/functions/auth 

