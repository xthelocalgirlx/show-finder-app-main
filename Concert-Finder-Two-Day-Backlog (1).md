# Concert Finder — prioritized two-day build backlog

**Working title:** Gig Finder  
**Planning window:** Two build days, about 16 working hours for one builder  
**Goal:** A guest enters a plain-language request, corrects visible filters if needed, and opens a relevant, real Ticketmaster listing.  
**Source:** PRD v2.3, roadmap and POC architecture (24 September 2026).  
**Status:** Planned; features previously marked complete still require verification in the current build.

**Golden path:** On day 2, a guest types “punk-ish rock in Montréal this weekend,” reviews or edits the interpreted filters, sees real Ticketmaster events, and opens a relevant listing.

**Priority labels:** Five P1 must-have outcomes organize cards 1–9: real search and links (cards 1–2), interpretation and validation (cards 3–4), editable filters and standard-search fallback (cards 4–5), real cards and feedback (cards 2, 6–7), and the full test/deployment (cards 7–9). Cards 10–12 are P2 later work.

## Trello setup

Create lists **Day 1 — Working search**, **Day 2 — Prove and ship**, **Blocked**, **Done**, and **Later / stretch**. Create cards in the order below. Put the bold card title in the Trello title, and its checklist in the description or checklist. The hour estimates are planning allowances, not deadlines. Move failed verification into the same card rather than marking an existing feature complete by assumption.

## Day 1 — Working search (7 hours planned)

### 1. [P1 must-have 1/5] Verify the live search contract and baseline — 1 hour

**Depends on:** Existing Supabase client/function access and Ticketmaster credentials.  
**Checklist:**
- [ ] Call the deployed `search-concerts` function using its current `{ keyword, city, size: 10, page: 0 }` request; inspect one actual response and map its event fields.
- [ ] Test `jazz` + `New York`, then `rock` + `Montreal` if the first returns cards; verify the displayed title, venue, city, local date, image and outbound URL against the response.
- [ ] Record what already works and what fails for date filters, recommendations, Load more, details and Back to top (AC-R1–R5).

**Done when:** At least one live provider listing opens from the app and the request/response contract is documented; no placeholder or invented live cards. **If blocked:** fix credentials/endpoint and narrow the demo city before adding AI.

### 2. [P1 support] Stabilize the existing search and event cards — 1.5 hours

**Depends on:** Card 1.  
**Checklist:**
- [ ] Keep the legacy request working while adding optional filters; preserve real provider IDs and URLs.
- [ ] Normalize actual response fields; deduplicate by event ID and sort by date, using only fields supplied by the provider.
- [ ] Repair only failures found in the five existing features (AC-R1–R5), focusing on date filter bounds and Load more state.

**Done when:** Search results are source-backed, date filters do not send reversed ranges, pagination does not duplicate IDs, and existing details/back behavior still works.

### 3. [P1 must-have 2/5] Interpret a request server-side into filters — 2 hours

**Depends on:** Cards 1–2.  
**Checklist:**
- [ ] Add an optional interpretation mode to the existing Edge Function; keep model and Ticketmaster credentials in server secrets.
- [ ] Send a bounded query plus current time, supported city/time-zone and genre values; request structured city, country, local start/end dates and at most two genres.
- [ ] Resolve “this weekend” in the selected city's time zone, then return an interpretation for review before event search.

**Done when:** “punk-ish rock in Montréal this weekend” produces valid *candidate filters*; existing keyword/city calls still work; AI output never becomes an event card.

### 4. [P1 support] Add AI validation and a usable fallback — 1 hour

**Depends on:** Card 3.  
**Checklist:**
- [ ] Validate city, time zone, allowed genres, date order, date-window limit and output size on the server before querying Ticketmaster.
- [ ] For model timeout, refusal or outage, keep the existing filtered search available and display “We are experiencing technical issues with our advanced search. Please use filtered search above.” beneath its city, music and date controls; prompt for correction separately on unsupported or ambiguous input.
- [ ] Check unsupported city, reversed dates, ambiguous genre, prompt injection and simulated timeout.

**Done when:** A simulated AI outage still lets the guest search and open a real event using the standard filters; no case silently searches guessed values or fabricates a card.

### 5. [P1 must-have 3/5] Show editable filters in the existing one-screen UI — 1.5 hours

**Depends on:** Cards 3–4.  
**Checklist:**
- [ ] Show visible labeled city, country, music and date fields populated from AI interpretation.
- [ ] Allow an edit and rerun without rewriting the sentence; display the actual applied values next to results.
- [ ] Keep the Find shows button, mobile layout and a manual city/genre/date flow for comparison.

**Done when:** A guest can edit at least one interpreted filter and fetch fresh real results; invalid dates show a field-specific correction message.

## Day 2 — Prove and ship (5.5 hours planned; 3.5 hours contingency)

### 6. [P1 must-have 4/5] Make every result and failure state understandable — 1 hour

**Depends on:** Cards 2 and 5.  
**Checklist:**
- [ ] Display real event name, venue, city, local date/time and descriptive “View [event] on Ticketmaster” link when present; handle optional missing artwork/details.
- [ ] Distinguish loading, no matches, invalid input, model timeout, Ticketmaster error and rate limit; suggest a useful next step for no matches.
- [ ] Label listings as Ticketmaster coverage and keep result order, filters and focus sensible when returning from details.

**Done when:** Each state is visibly different; an empty state is not used for an upstream error; no card or availability claim is invented.

### 7. [P1 support] Check accessibility on the golden path — 1.5 hours

**Depends on:** Card 6.  
**Checklist:**
- [ ] Keyboard-only search, edit, submit, recover from an error and open an event; verify modal Escape/focus return if details use a modal.
- [ ] Check labels, meaningful image alt text, visible focus, contrast, status announcements and descriptive links.
- [ ] Test narrow mobile width and 200% zoom; fix clipped text and small or hover-only targets; run Lighthouse and manual checks.

**Done when:** The whole task works by keyboard and touch at 200% zoom with no missing control labels or blocked focus.

### 8. [P1 must-have 5/5] Run the five-task comparison and record search-to-open time — 2 hours

**Depends on:** Cards 5–7.  
**Checklist:**
- [ ] Prepare five prompts covering direct match, informal genre, relative date, ambiguous input and no results; use a comparable manual filter flow and vary flow order.
- [ ] For each task start a timer when the prompt is shown; record first click to a *tester-confirmed relevant* provider listing, corrections, errors and no-open tasks. Keep relevance and a simple anonymous test sheet separate from click analytics.
- [ ] Record submit-to-results latency for the combined AI + Ticketmaster flow, the 4/5 clarity target, zero invented cards and task outcome for both flows.

**Done when:** Report how many AI tasks opened a relevant listing within 60 seconds (target 4/5), how many produced clear results/empty states (target 4/5), observed response time (target under 5 seconds under normal upstream conditions), corrections and no-open attempts. With five tasks, speed comparison is directional only. An empty state never counts as an event open.

### 9. [P1 support] Deploy and smoke-test the same build — 1 hour

**Depends on:** Cards 6–8.  
**Checklist:**
- [ ] Sync Lovable/Antigravity changes through the chosen GitHub branch/repository; confirm deployed function and frontend contracts match.
- [ ] Deploy Vite/React frontend to Netlify at its provided URL with public Supabase configuration only; verify provider/model secrets stay in Supabase.
- [ ] Repeat one real search, a filter edit, an empty/error case and an outbound event open on the deployed mobile view.

**Done when:** The deployed URL completes the actual guest task with real provider data; only publish the Lovable preview after its real search is verified.

## Decision gate and contingency

The first nine cards use **12.5 hours**, leaving **3.5 hours** for integration failures, API access and fixes. At the end of Day 1, stop feature work if the real provider call or legacy request is broken and use Day 2 to restore a demonstrable live guest search. At the end of Day 2, report task evidence and open blockers; do not claim faster discovery from five tasks alone.

## Later / stretch (do not displace P0 cards)

### 10. [P2] Add consent-appropriate search-journey instrumentation — estimate after POC

Use `search_journey_id` from first interaction, `search_id` per submission, correction count and first real event-ID click; distinguish no-open journeys. Decide lawful basis/consent and retention before storing identifiable events. The five-task POC can use the anonymous test sheet in card 8; persistent Supabase logging and Airtable sync are follow-on work.

### 11. [P2] Spotify sign-in and up to five top-artist shows — only if core gates pass and time remains

Configure allowlisted Spotify OAuth testers through Supabase Auth, request `user-top-read` separately, match artists to real Ticketmaster events, show up to five or a useful no-match state, and retain guest access. This is a multi-step integration and should move to the next sprint if the Day 2 contingency is needed.

### 12. [P2] Airtable reporting, email accounts and broader production controls — next sprint

Create approved Supabase product-event storage, scoped Airtable sync/retries and dashboards after privacy decisions; then add email auth, retention/deletion workflows, alerts, caching and monitoring. These are not required to prove the two-day plain-language search hypothesis.
