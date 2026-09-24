# Concert Finder — two-day prototype PRD and build guide

**Working title:** Gig Finder
**Version:** 2.3 · 24 September 2026
**Owner:** Product prototype
**Status:** Ready to build

## Problem statement

Fans know the sound they want and when they are free, but must translate that into rigid genre filters and search multiple listings. This can make it harder to spot a relevant local show within a short window.

### 1. Product summary

A single-screen web app helps a music fan discover upcoming concerts by city, date and music taste. They can type “punk-ish rock in Montréal this weekend.” The app extracts editable search filters, searches Ticketmaster Discovery API for actual events, and displays event name/artist, venue, city, local date and link to the event page.
**Problem:** Fans know the sound they want and when they are free, but must translate that into rigid genre filters and search multiple listings.
**Target user:** A casual concertgoer looking for a local show within the next few days.
**Current workaround:** Fans visit sites such as Ticketmaster, Songkick or Bandsintown, choose a city, predefined genre and date range themselves, then scan and compare listings. If nothing fits “punk-ish rock this weekend,” they try another genre, widen the dates or repeat the search on another site.
**Data access constraint:** Ticketmaster's Discovery API is practical for the prototype but does not list every local show; its [API page](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) lists 5,000 calls/day and 5 requests/second, while its FAQ lists 2 requests/second. Bandsintown's [standard API key](https://help.artists.bandsintown.com/en/articles/7053475-what-is-the-bandsintown-api) is tied to one artist unless broader use is authorized, so citywide integration requires a partnership.
**Value proposition:** Describe what you want; see real, relevant shows in one screen.
**Primary success measure:** A tester can search and open a relevant event listing within 60 seconds.
**Supporting measures:** At least 80% of five scripted searches yield understandable results or a useful empty state; zero invented event cards; search responses within 5 seconds under normal API conditions.
### Original problem statement

- **Target user:** A casual concertgoer looking for a local show within the next few days, such as “rock in Montréal this weekend.”
- **Pain:** Fans know the sound they want and when they are free, but must translate that into rigid genre and date filters. Relevant shows can be hard to spot, especially when an artist crosses genres.
- **Current workaround:** They search multiple event listings, try different filters, and scan individual results for the venue and date. If results look sparse, they broaden the search and try again.
- **Impact:** This takes extra effort and can cause them to overlook a relevant show or give up. The prototype's primary success measure is whether a tester can search and open a relevant event listing within 60 seconds.
- **Why now:** A single-screen prototype can let fans describe what they want and see real, relevant shows in one place. Live Ticketmaster results make it possible to test the idea quickly: at least 80% of five scripted searches should yield understandable results or a useful empty state, with zero invented event cards and responses within five seconds under normal API conditions.

## Target user & context

Casual concertgoers in a city such as Montréal who want a nearby show in the next few days, often with a specific sound and limited time to browse.

## Value hypothesis

A single plain-language request helps a fan open a relevant event faster, with fewer filter changes, than choosing city, genre and dates separately. The 60-second target and comparison test below remain hypotheses until measured.

### How we will measure success in the POC

Give testers five scripted requests that cover clear matches, an ambiguous genre, a relative date and a no-results case. For the primary measure, start the timer when the task prompt is shown and stop at the first Ticketmaster listing the tester says is relevant; a useful empty state counts toward search clarity, **not** toward a relevant-event open. Run the same tasks through a conventional city/genre/date filter flow, vary which flow is used first, and record elapsed time, event relevance, filter corrections, empty/error outcomes and tasks with no open. Five tasks are a POC smoke test, not statistical proof of a speed advantage.

| Measure | POC target and interpretation |
| --- | --- |
| **Primary: relevant show opened** | Aim for at least **4 of 5** scripted AI-flow tasks to end at a tester-confirmed relevant provider listing within **60 seconds**; report no-open tasks and unmatched inventories separately. |
| **Clarity** | At least **4 of 5** scripted searches show understandable real results or a useful empty state; do not count an upstream error as a useful empty state. |
| **Integrity** | **Zero** invented event cards; every card's ID and outbound URL come from the event provider response. |
| **Speed** | The interval from Find shows submission through interpretation and event-results display is **under 5 seconds** in normal API conditions; report upstream timeouts separately rather than hiding them. |
| **Comparative signal** | Compare median time to a tester-confirmed relevant open, completion rate and filter corrections against manual filters; treat any difference from five tasks as directional only. |

For instrumented usage, carry one `search_journey_id` from first search interaction through corrections and repeat submissions; attach a new `search_id` to each submission and a real event ID to the first provider-link click. Calculate journey-start-to-open time only for journeys with a click, leave no-open durations blank, and never equate a click with relevance or a purchase. The tester's relevance confirmation is collected in the usability session; the anonymous click log alone cannot provide it. See the detailed event definitions in **Product events and reporting**.

### Leading indicators for the two-day demo

| KPI | What it tells us | Prototype capture and timing |
| --- | --- | --- |
| **Relevant event open within 60 seconds** | Whether a fan reaches a show they judge relevant, and whether the AI flow improves on manual filters. | **Now:** In a moderated test, time from seeing the task prompt to opening a provider listing and ask the tester if it is relevant; record no-open attempts separately. Target at least 4 of 5 AI-flow tasks, while reporting the comparable manual-filter result. **Later:** Log journey start and first provider click for a larger sample, with a separate relevance signal; clicks alone cannot establish relevance. |
| **Filter correction rate** | Whether interpreting a sentence actually saves filter work. | **Now:** Observer counts city, date and genre corrections before the first relevant open and compares AI with manual filters; aim for fewer corrections in the AI flow. **Later:** Count `filter_changed` events by `search_journey_id` for consented usage. |
| **No-open journey rate and step reached** | Where fans give up: interpretation, results, or the final link. | **Now:** Record the last completed step and reason for each no-open test, distinguishing no matching Ticketmaster inventory from a confusing UI or an error. **Later:** Use consent-appropriate journey events to compare start, submitted search, results shown and first outbound click; no-open time remains blank. |

### AI-specific demo measures

| KPI | Definition and demo target | Data source |
| --- | --- | --- |
| **AI task success rate** | Of five supported test requests, at least **4 of 5** produce city, local dates and at most two supported genres a tester can use without correcting an incorrect field; a correctly reported need for clarification is tracked separately. | **Data source:** Manually compare displayed filters with a five-prompt answer sheet and mark each interpretation usable or unusable. |
| **Escalation or fallback rate** | Of five supported requests, at most **1 of 5** needs manual filters because of invalid output, refusal or timeout; intentionally unsupported requests are reported separately as guardrail tests. | **Data source:** Manually record each fallback and its visible reason on the same test sheet. |
| **Latency p50 and p95** | Time only the AI request through validated filter output, separately from Ticketmaster. Demo target: **p50 at or below 2 seconds** and **p95 at or below 4 seconds** in a small timed run of around 20 supported requests; also retain the existing **under 5 seconds** end-to-end target in normal API conditions. This small run is diagnostic, not a reliable population p95. | **Data source:** Manually copy the AI-step duration shown in temporary development diagnostics for each run into the test sheet and calculate approximate p50 and p95. |

The prototype uses manual spot checks for all three AI KPIs; persistent AI metrics can wait until usage justifies them. Demo targets are decision aids, not a claim of statistical significance or a guaranteed improvement over existing concert apps.

## Constraints

- **Time:** Two-day guest-search prototype. After live search, editable AI filters and the 60-second task test work, Spotify sign-in and up-to-five top-artist shows are **if we have time** only. Email accounts and durable analytics remain a follow-on release.
- **Budget and data:** Ticketmaster coverage and API quota constrain the live results; other event providers may require licensing.
- **Policy and delivery:** Keep provider keys on the server and apply the privacy and accessibility requirements below.

## Solution concept

The smallest slice is one responsive screen: enter a request, inspect and edit interpreted city/genre/dates, see real Ticketmaster events sorted by date, and open the provider listing. Keep account and reporting expansion separate from the two-day proof.

**If we have time — Spotify account and personalized shows:** After the core guest search and task test pass, add a visible **Continue with Spotify** option for sign-up and login with allowlisted testers. A fan may separately allow Gig Finder to read their top artists, choose a city and see up to five upcoming Ticketmaster shows from those artists. If this does not fit the POC schedule, move it to the follow-on release. Guest search always remains available without Spotify.

### 2. Prototype scope


### In scope (must have)

- One responsive search screen with a natural-language input and examples.
- Editable city, country (default Canada), genre and start/end date filters. Default dates: today through five calendar days ahead in the selected city's time zone, where available; for the first build use explicit date picker values and label them clearly.
- A button that searches Ticketmaster for actual events using a Supabase Edge Function.
- Results ordered by event date, showing event name or artist, venue, city, local date/time where supplied, artwork where supplied, and “View event” link.
- Loading, no results, missing fields and API error states.
- AI interpretation for flexible language (“punk-ish rock,” “this weekend”), displayed as editable filters before or alongside results. A controlled genre mapping is an acceptable fallback if an AI service is unavailable.
- Server-side storage of API keys. No account or personal data required.
- Accessible search, filters, feedback and event cards, meeting the acceptance criteria in section 11.

### Optional if time remains

- Spotify sign-in through Supabase Auth for allowlisted testers, followed by a separate `user-top-read` permission for top-artist discovery and up to five real Ticketmaster matches. This begins only after the core guest-search acceptance checks and timing test pass; it does not change the POC decision gate. Apply AUTH2 and SP1–SP6 if shipped. Otherwise retain these requirements for the follow-on release.

### Source coverage

**Source coverage:** Results mean “events returned by Ticketmaster Discovery,” not all concerts in a city. Ticketmaster classifications may omit or mislabel niche acts. Display the provider attribution and link to its event page; check its current branding/terms before sharing publicly.
### 6. Screens and copy

- Header: **Find your next show**
- Search placeholder: **“Punk-ish rock in Montréal this weekend”**
- Filters: **City · Music · Dates**; default **Next 5 days**
- Search button: **Find shows**
- Result card: **Event/artist · date/time · venue · city · View event**
- Empty: **No Ticketmaster shows matched these filters. Try a wider date range or another genre.**
- Error: **We couldn't load shows right now. Please try again.**
- AI search unavailable: **We are experiencing technical issues with our advanced search. Please use filtered search above.** Keep the standard city, music and date filters visible above this message.
- Attribution: **Event listings from Ticketmaster**

## AI use-case & strategic role

**Where AI sits in the journey:** After a fan enters one request, such as “punk-ish rock in Montréal this weekend,” and before the event search, a server-side AI interpreter converts the request into structured city, country, local start/end dates and up to two supported genre classifications. It resolves relative timing using the selected city's time zone, maps informal descriptions to candidate genres, and returns the interpretation for the fan to inspect and edit. The app validates those fields and then queries Ticketmaster for real events; AI does not generate event cards, invent artists or decide ticket availability. If interpretation is ambiguous, the app asks the fan to correct the filters. A simple rules-based mapping can keep basic searches working if AI is unavailable.

**Strategic Role Statement:** Gig Finder's intended advantage is turning the many ways people describe a sound and a time window into usable event filters in one step. As the range of expressions, genres and cities grows, manually maintained phrase rules become brittle; AI makes that flexible, low-effort search experience practical at scale, while validated filters and a live event source keep results grounded.

**User value unlocked:** Less time spent setting and retrying filters, less need to know formal genre labels, and a better chance of noticing relevant shows across adjacent genres. These are hypotheses to validate, not measured gains: compare time to open a relevant event, relevance of that event and number of filter corrections against a conventional city/genre/date search.

### AI safety control: validate, show and fall back

The server sends the model a bounded request and allowed city/genre values and accepts only schema-constrained JSON containing city, country, local start/end dates and at most two supported genres; it then independently validates time zone, date order and range, allowed values and response size before any Ticketmaster search. Show valid interpreted filters for the fan to edit. If the AI request fails, refuses or times out, switch to the existing filtered search, keep its city, music and date controls visible above the notice, and display **“We are experiencing technical issues with our advanced search. Please use filtered search above.”** Pre-fill only values already known and validated; do not silently search with guessed AI values. The fan can submit the standard filter search through the existing `search-concerts` path. For an AI response with an unsupported city, ambiguous intent or invalid field, show a specific correction prompt instead of calling the issue a technical outage. The model can propose filters only: create event cards exclusively from Ticketmaster event IDs and URLs, with **zero** fabricated cards as the release guardrail. Test this control with an unsupported city, reversed dates, ambiguous genre, prompt-injection text and a simulated model timeout.

**Guardrail and failsafe choice:** Validate AI city, genre and dates before searching, and on an AI outage return the fan to the existing filtered search with a clear message, because a guessed filter could hide relevant shows while a working standard search still lets them continue.

For the POC, keep a small server-side list of city/country/time-zone combinations used in the demo, for example `Montréal, CA → America/Toronto` and `New York, US → America/New_York`; normalize a known spelling such as `Montreal` to `Montréal`, but do not accept a city absent from that list or silently substitute another city. If the AI returns `Paris`, show “Choose a supported city” with the city selector instead of sending `Paris` to Ticketmaster. This check proves the city is **supported**, not that the AI understood the fan correctly, so the fan still sees and can edit the city before searching.

**Stretch after the core fallback works:** Add a small deterministic phrase mapping for a few common music/date requests and test whether it helps when the AI service is unavailable; the existing standard filtered search must remain available regardless.

## Early risks

### 14. Early risks

- **Incomplete or uneven event coverage:** Ticketmaster may miss local or independent shows, and its genre tags or event details may be missing or inaccurate. A useful concert could exist even when Gig Finder shows no matches.
- **AI misinterprets intent:** Informal phrases such as “punk-ish,” ambiguous city names and “this weekend” can map to the wrong genre, location or dates. Users must see and correct the interpreted filters before trusting the results.
- **Search or integration failure:** API quota limits, slow responses, unavailable providers or duplicate listings could produce errors, delays or misleading results. Show a clear error or empty state, deduplicate by event ID, and retain manual filters as a fallback.
- **Privacy and account risk:** Searches, location, Spotify identity and click history can reveal personal interests. Avoid raw query and listening-history storage, keep analytics optional where consent is required, protect account data and support deletion across Supabase and Airtable.
- **Unproven value over existing tools:** Songkick and Bandsintown already offer city, genre and date filters. Plain-language search may not save time if AI corrections add friction; compare time to open a relevant event and correction rate against a conventional filter flow.

## User flows

**Golden path for the day 2 demo:** A guest types “punk-ish rock in Montréal this weekend,” reviews or edits the interpreted city, genre and date filters, submits the validated filters, sees real Ticketmaster results, and opens a relevant event listing in a new tab.

### 3. User flow

1. User opens the page and sees “Find your next show” plus example “Punk-ish rock in Montréal this weekend.”
2. User either types a request and clicks **Find shows** or starts directly with the visible manual city, music and date filters. Neither route requires an account.
3. For a plain-language request, the server interprets city, country, local date interval and at most two supported Ticketmaster genres, then validates the proposed values. The UI shows editable fields, for example Montréal · Rock / Punk · Sep 26–27, **before** submitting a Ticketmaster search.
4. User reviews or edits the fields and submits validated filters. The `search-concerts` Edge Function queries Ticketmaster; for two genres it runs at most two searches and deduplicates by Ticketmaster event ID.
5. User scans real, date-sorted cards with Ticketmaster attribution and opens **View event** in a new tab.
6. User can adjust a filter and search again. If there are no matches, the page suggests widening the dates or changing music. A provider error instead displays an error message and allows a retry with the same filters.

### User-flow requirements and demo acceptance

| ID | Requirement | Demo pass condition |
| --- | --- | --- |
| UF1 | Offer both a plain-language request and visible manual city, music and date filters; guest search requires no account. | The presenter can start a search by either route. |
| UF2 | Interpret a plain-language request on the server into a supported city, country, local date range and at most two supported genres. | The example request produces editable filters before any Ticketmaster request. |
| UF3 | Validate allowed city, time zone, date order and range, and genres before searching. Let the guest edit and submit the chosen values. | A changed filter is used by the search; invalid or unsupported values are never sent to Ticketmaster. |
| UF4 | For an unsupported city, invalid field or ambiguous intent, show a specific correction prompt rather than a technical-outage message. | The guest can correct the affected field and continue. |
| UF5 | If AI times out, refuses or is unavailable, show the advanced-search issue notice and keep manual filters usable. Pre-fill only known, validated values. | The guest can complete a manual search without AI or guessed values. |
| UF6 | Build cards only from Ticketmaster event IDs and URLs. Deduplicate by event ID and sort by local event date and time. | Cards show available event name, local date/time, venue, city and provider attribution; duplicate IDs appear once. Missing optional fields do not become invented values. |
| UF7 | Open the selected real provider listing from **View event** in a new tab. | The opened URL corresponds to that card's Ticketmaster event. |
| UF8 | Distinguish no matches from a provider failure. Offer a path to widen or change filters after no matches and a retry with retained filters after failure. | Both outcomes can be demonstrated without restarting the journey. |
| UF9 | Keep filters editable after results appear. | A correction and resubmission produce results for the new filters. |

**Demo priority:** Run the golden path first. Then show a filter correction, a no-results retry, a manual search after a simulated AI failure, a specific correction prompt for unsupported or ambiguous input, and a retry after a simulated provider error. Use controlled failure simulations for branches that are not naturally reproducible; never invent live event cards. Spotify sign-in and personalized shows remain optional and do not gate this guest-search demo.

### 9. Demo script

1. Type **“punk-ish rock in Montréal this weekend.”**
2. Point out extracted **city, dates and related genres**, then edit one chip.
3. Show actual Ticketmaster event cards with artist/event, venue, city, local date.
4. Open one **View event** link.
5. Show a no-results case and broaden the date window.
6. Use manual filters to complete a search after a simulated AI timeout; confirm the advanced-search notice appears.
7. Enter an unsupported city or ambiguous request; correct the prompted field and continue.
8. Simulate a Ticketmaster error; confirm it is labeled as an error, retains the filters and offers a retry.

**Decision gate:** This is a compelling demo if real events appear for at least two test prompts. If coverage is thin, widen date range to 14 days or switch the demonstration city; do not seed fake live events.

## Tech requirements

The following retains the full functional, architecture, setup, accessibility, account, analytics, privacy and reference detail.

### POC tech stack decision

| Layer | Chosen approach | Why |
| --- | --- | --- |
| Frontend and development | Existing Lovable React app; Google Antigravity for coding and local tests; one GitHub repository | Familiar tools and an existing app speed up the two-day proof. GitHub keeps Lovable, local edits and deployment aligned. |
| Backend | Existing Supabase `search-concerts` Edge Function | Extend the verified request contract rather than replacing a working endpoint; keep Ticketmaster and model secrets server-side. |
| Runtime AI | Server-side model API with structured JSON filters and a manual-filter fallback | ChatGPT and Antigravity help build the app; a deployed visitor search needs an API call. AI proposes city, dates and genres but never invents events. |
| Concert and optional music APIs | Ticketmaster Discovery for actual events; Spotify OAuth and top artists **if we have time** | Guest discovery proves the core value. Spotify is a closed optional test constrained by developer access. |
| Database | No new table for the initial search path; Supabase Postgres and Auth for optional Spotify and later product events | Add persistent data only for a defined feature or consented measurement purpose. |
| File storage / vector store | Neither for the POC | No user uploads, document corpus or retrieval task requires either. |
| Hosting and deployment | Netlify for the Vite/React frontend; Supabase for Edge Functions; existing Lovable preview for iteration | Deploy from GitHub after real search works. Use the Netlify-provided URL for the POC; custom domain setup can wait. |

**Constraints beyond tokens:** Ticketmaster quota and incomplete coverage; Spotify development-mode access (Premium app owner and up to five allowlisted users); model latency and per-call charges; ambiguous genre/date interpretation; privacy decisions for stored search activity; key protection; and version drift between Lovable, Antigravity, GitHub and the deployed function. See the linked [architecture decision](Concert-Finder-Architecture.md) for the POC AI contract and production sketch.

### 5. Data and architecture

```
Browser search screen
   → optional AI filter extraction (server-side) / deterministic fallback
   → Supabase Edge Function `search-concerts`
   → Ticketmaster Discovery API v2 `/events.json`
   → normalized JSON event cards in browser
```

For the two-day search demo, Supabase is used for Edge Functions and secrets; no Supabase table, Auth or RAG is required. The follow-on release adds Supabase Auth and product-event tables as described in section 12.
**Function input:** { city, countryCode: "CA", genres: ["Rock"], startDateTime, endDateTime } where dates are ISO-8601 UTC instants. Limit genres to two, city to reasonable length, and interval to at most 31 days. Convert the *chosen local calendar date boundaries* to UTC instants; end is exclusive where implemented. Do not assume UTC midnight equals Montréal midnight. Start with the exact genre names verified in Ticketmaster's API Explorer.
**Function output:** { appliedFilters, events: [{ id, name, artist, venue, city, localDate, localTime, imageUrl, eventUrl }], total, warning? }. Use \_embedded.events ?? []; artist can fall back to event name; venue and artwork are optional. Deduplicate by id and sort by localDate, then localTime. Only return an upstream event URL supplied by Ticketmaster.
**Ticketmaster API:** GET https\://app.ticketmaster.com/discovery/v2/events.json with apikey, city, countryCode, classificationName, startDateTime, endDateTime, sort=date,asc, size=20. First verify the exact values with a live request in API Explorer. Ticketmaster's default quota is 5,000/day; its documentation and FAQ differ on requests/second, so stay well below both published figures and handle HTTP 429. The result set may be paginated; first-page results are enough for the prototype but label them as a limited list rather than “all shows.”
**AI option:** Add a second server-side step to parse a free-text request into a strict JSON schema: { city, countryCode, startLocalDate, endLocalDate, genres[] }. Supply an allowlist of countries/cities/genres, validate the model's output, and show it to the user for correction. The LLM must not receive the Ticketmaster key. If no AI API is available, use selectable fields and a simple phrase-to-genre mapping; this still delivers a functional prototype.

### 7. Exact setup checklist

#### Ticketmaster

1. Sign in at the Ticketmaster Developer Portal → **My Apps** → copy the app's **Consumer Key** (the Discovery API key). Never put it in a frontend prompt, screenshot or Git repository.
2. In the Discovery API Explorer test Canada + a city + Music/Rock + a broad upcoming range. Confirm actual event output and whether accented Montréal or Montreal matches better.
3. Record one successful response's fields (name, id, dates.start.localDate, \_embedded.venues, url) for the UI mapping.

#### Supabase

4. Create/select a Supabase project. In **Edge Functions → Secrets**, add TICKETMASTER_API_KEY with the Consumer Key.
5. Create and deploy an Edge Function called search-concerts. It accepts POST JSON, validates input, creates the Ticketmaster URL with URLSearchParams, calls fetch, handles errors, and returns normalized events. Add an OPTIONS/CORS response for a browser client; restrict origin to your deployed domain once known.
6. Configure function authentication to match the client. For a no-login demo, configure it as publicly callable / disable the platform JWT check and understand that the public endpoint consumes your Ticketmaster quota. Do not put a Supabase secret/service-role key in frontend code. For a broader public release add per-IP or equivalent throttling and server-side input bounds.
7. In Supabase's function **Test** panel send POST JSON with city, countryCode, genres, startDateTime and endDateTime. Use a 14-day range for this first test. Confirm at least one real event, or inspect API Explorer if empty.
8. In the frontend, use the project's URL and **publishable** Supabase key with supabase.functions.invoke('search-concerts', { body: filters }). The publishable key can be client-side; Ticketmaster and LLM keys remain function secrets.

#### Frontend and AI

9. Build the single page with text input, editable filters and result cards. Wire explicit filters first; test a real search.
10. Add AI interpretation as a separate server-side call only after the live search works. Give the model current date, supported cities/time zones and genre allowlist. Validate every returned field; render filters for user correction before calling Ticketmaster.
11. Test empty search, date boundary, no venues, duplicate event, invalid key, API timeout and 429. Do not display the raw key or upstream error payload to users.
12. Run the accessibility checks in section 11 before the demo, including a keyboard-only search and a 200% zoom check.

## Acceptance Criteria

### 4. Functional requirements and acceptance criteria

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| FR1 | Search by text | “rock in Montreal” populates Rock and Montreal filters; unrecognized city requests clarification in UI. |
| FR2 | Interpret time | “this weekend” resolves to the upcoming local Saturday and Sunday; show the interpreted dates for correction. |
| FR3 | Genre expansion | “punk-ish rock” maps to at most two documented Ticketmaster classification values; label the applied filters. |
| FR4 | Editable filters | User can change city, dates or genre without rewriting the sentence. |
| FR5 | Live search | Edge Function calls Discovery API with city, countryCode, date range, classification and API key from secrets. |
| FR6 | Results | Each real event has name, venue, city, local date and event link; missing optional data gets a graceful placeholder. |
| FR7 | Deduplication | Same event ID returned for two genres appears once. |
| FR8 | States | Loading, zero matches, invalid input, upstream error and rate limit all have distinct, useful messages. |
| FR9 | Privacy | The two-day search demo requires no login or location permission. For the follow-on release, store only the profile, approved product events and limited search records defined in section 12. Do not store raw query text or Spotify listening data by default. |
| FR10 | Security | Ticketmaster and optional AI credentials never appear in frontend source or response; restrict allowed input and throttle public calls before wider release. |
| FR11 | AI outage fallback | If the AI times out, refuses or is unavailable, the standard labeled city, music and date search remains usable through `search-concerts`; show “We are experiencing technical issues with our advanced search. Please use filtered search above.” beneath those controls, and do not send unvalidated AI filters to Ticketmaster. |

**Interpretation rule:** AI can suggest filters, never fabricate event records or claim an event matches a genre more precisely than the returned classification supports. Date language resolves in the chosen city's time zone. For the prototype, restricting city choices to a small explicit list with time zones, including the configured demo cities, avoids ambiguous city names and DST errors.

#### Acceptance criteria for features marked complete in the earlier roadmap

The earlier roadmap marks these five features complete. Verify them against the current build; the status is not itself evidence that the criteria below pass.

| ID | Feature | Acceptance criteria |
| --- | --- | --- |
| AC-R1 | AI recommendations from preferences | Given selected music preferences and a city, each recommended card corresponds to a real event returned by the event source. The UI indicates the preference or genre used to recommend it. When no matching events exist, show an empty state and a way to broaden the search; never fabricate events. |
| AC-R2 | Date range filters | A user can set, change and clear start and end dates. An end date before the start date produces a field-specific error and does not search. Results fall within the displayed local date range, including the chosen end calendar day, and the active dates remain visible after searching. |
| AC-R3 | Load more | When another result page exists, activating Load more appends results to the current list, keeps city/genre/date filters and sort order, and does not repeat an event ID. The control shows loading while the request is in progress, prevents duplicate requests, and disappears or becomes disabled when no further results exist. |
| AC-R4 | Event details view | Selecting a result opens details for the selected event ID, showing the available title, date/time, venue, city and outbound provider link. Missing optional fields do not show invented values. Closing or going back restores the result list, scroll position and applied filters; if the view is a modal, Escape closes it and focus returns to the originating card. |
| AC-R5 | Back to top | After the user scrolls down the results, a visibly identifiable Back to top control becomes available. It has an accessible name, works with keyboard and touch, and returns the viewport to the top without discarding the search or filters. It does not cover a result link or other control at mobile width. |

### 11. Accessibility requirements and acceptance criteria

Build these into the one-screen prototype. Aim for WCAG 2.2 AA where applicable; the checks below describe what to verify for this app.

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| A1 | Event artwork and decorative images | Each meaningful event image has concise, specific alt text, such as “Poster for [event name]”; avoid repeating adjacent card text. Decorative imagery uses an empty alt attribute (`alt=""`). Missing artwork does not leave an unlabeled broken image. |
| A2 | Keyboard navigation | The search field, filters, date controls, Find shows button and every event link can be reached in a logical Tab order and operated without a mouse. Enter submits the search; any added menu or modal supports appropriate keys, including Escape to close and focus return. Do not create keyboard traps. |
| A3 | Visible focus and controls | Interactive elements look interactive and show a strong visible focus indicator, including against the black, pink and teal theme. Never remove the default outline unless a visible replacement is provided. |
| A4 | Readable text and zoom | Body copy starts at 16px or larger and uses a readable weight. At 200% browser zoom, users can search, edit filters and read cards without text clipping or loss of functionality. Avoid long all-caps copy. |
| A5 | Contrast and meaning | Normal text has at least 4.5:1 contrast and large text at least 3:1 against its actual background; user interface boundaries and focus indicators are distinguishable. Check pink and teal text, buttons and error states on both dark and light surfaces. Status is conveyed with words or icons plus labels, never color alone. |
| A6 | Labeled search and filters | The natural-language field and city, country, genre and date inputs have visible labels programmatically associated with their controls. Example prompts supplement labels rather than replacing them. Required fields and date constraints have clear instructions. |
| A7 | Useful feedback | Invalid input identifies the field and says how to correct it. Loading, results count, no matches, timeout and rate limit messages appear as visible text and are announced to assistive technology without moving focus unexpectedly. Avoid repeatedly announcing every card. |
| A8 | Mobile input | Layout remains usable at narrow mobile widths and 200% zoom; interactive targets are at least 44 × 44 CSS pixels where practical, with enough spacing to avoid accidental taps. No action depends on hover. |
| A9 | Links and structure | Use one descriptive page heading, semantic header/main/form/results list or sections, native buttons and links. An event link has an accessible name such as “View [event name] on Ticketmaster,” especially if cards repeat “View event.” If a link opens a new tab, indicate this to users. Use ARIA only to add information native HTML does not provide. |
| A10 | Media if introduced | The current scope has no app-hosted video or audio. If demo footage, trailers or audio previews are added, provide reviewed captions for video, a transcript for speech/audio, and accessible playback controls before release. |

**Quick acceptance test:** Starting at the top of the page, use only Tab, Shift+Tab and Enter to search, edit every filter, recover from an invalid query and open an event. Inspect at mobile width and 200% zoom; check text and controls in the actual theme with a contrast checker. Run Chrome Lighthouse accessibility audit, then manually confirm labels, alt text, focus, announcements and link names because an automated score cannot verify their quality.

## Out of scope

### Out of scope for the two-day demo

- Ticket purchase or payment inside the app, saved searches, email alerts, maps, RAG/vector database, ticket availability guarantees, venue-size claims, exhaustive listing across all promoters, or full conversational chat. Email accounts and durable analytics are defined as a follow-on release; Spotify sign-in and top-artist shows are **optional if time remains** after the core POC passes. Basic anonymous event tracking may be added to the demo if time permits.
- **TBD:** Decide whether artist/venue follows, notification alerts and additional licensed event sources belong in a later release after the search and Spotify personalization tests.

## Additional planning notes

### Original open notes

add

- add the data results to airtable?
- reason why we are collecting data 
- add more to search - add recommmended artists in your area

### Two-day prioritized backlog (current)

**Golden path:** On day 2, a guest types “punk-ish rock in Montréal this weekend,” reviews or edits interpreted city, music and dates, sees real Ticketmaster results, and opens a listing the tester confirms is relevant. The goal is an event open within 60 seconds, including time spent correcting filters.

| Priority | Must-have outcome or later idea | Day and Trello cards | Completion check |
| --- | --- | --- | --- |
| **P1 — 1/5** | Verify the existing search returns real Ticketmaster events and working links. | Day 1, cards 1–2. | Inspect a real `search-concerts` response and open a source-backed provider listing; preserve the existing request contract. |
| **P1 — 2/5** | Interpret one request into city, genre and dates, then validate those filters. | Day 1, cards 3–4. | Show bounded, validated candidate filters for “punk-ish rock in Montréal this weekend”; an unsupported city or invalid date cannot silently search. |
| **P1 — 3/5** | Show editable filters and keep the standard filtered search usable if AI fails. | Day 1, cards 4–5. | A guest edits a filter without rewriting the prompt; an AI outage shows the exact advanced-search message beneath usable city/music/date controls. |
| **P1 — 4/5** | Display only real event cards with clear loading, empty, invalid-input, rate-limit and provider-error states. | Day 1–2, cards 2, 6–7. | Every card maps to a provider event; state messages give a recovery path, and search works by keyboard and touch at 200% zoom. |
| **P1 — 5/5** | Test the full journey, time to a tester-confirmed relevant event open, and deploy the same build. | Day 2, cards 8–9. | Record five scripted AI tasks against manual filters, corrections and no-open attempts; smoke-test a real provider link and fallback on the deployed app. |
| **P2 — later** | Add persistent, consent-appropriate search-journey analytics and Airtable reporting. | Later, cards 10 and 12. | Define lawful basis, retention and minimal event schema before storing user-level activity; the P1 test uses a manual sheet. |
| **P2 — optional stretch** | Test Spotify sign-in and up to five real shows from top artists. | After the P1 gate if time remains, card 11. | Allowlisted tester authorizes artist access separately; guest search still works and results are real provider events. |
| **P2 — later ideas** | Email accounts, artist/venue follows, alerts and any additional licensed event source. | Follow-on release; further breakdown after the P1 demo. | Define separate scope and data rights before committing delivery. |

**Capacity:** P1 cards 1–9 total about 12.5 planned hours across two days, leaving about 3.5 hours for API/integration issues and fixes. The five P1 rows are outcomes; supporting implementation cards remain under those outcomes rather than becoming extra product goals. P2 work does not displace a broken live search, missing fallback or the day 2 task test.

### 8. Earlier two-day schedule (retained)

This earlier estimate is preserved for context; use the prioritized backlog above for the current build order.

**Day 1 (working data path):** Obtain/test Ticketmaster key (30–60 min); create project/secrets/function (1–2 h); call the function with one fixed Rock + Montreal search (1 h); build the one-screen filter/results UI (2–3 h). **End-of-day gate:** A real Ticketmaster event opens from a card.
**Day 2 (intelligence and polish):** Add natural-language parser and editable interpreted filters (2–3 h); add genre crossover and deduplication (1 h); polish empty/error/mobile states (1–2 h); run five realistic searches and rehearse a 60-second demo (1 h). If AI integration takes too long, retain the working filter-based app and demonstrate the rule-based interpretation of a few phrases.

**If time remains after Day 2's core gate:** Try Spotify OAuth with allowlisted testers and a separate top-artist permission; show up to five real matches. Move unfinished Spotify work to the follow-on release without blocking the guest-search demo.

## Follow-on release: accounts and product analytics

**Goal:** Let fans create an account with email or Spotify, then measure whether they find relevant concerts and return. The Spotify portion can be started in the POC **if time remains after the guest-search gate**; otherwise the requirements below remain follow-on. Search remains available to guests. Spotify sign-in authenticates the user; the personalized-show feature separately requests permission to read top artists. Do not import full listening history, followed artists or playlists.

#### Authentication requirements

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| AUTH1 | Email sign-up and login | User can create an account, complete any configured email confirmation, sign in, sign out and recover access. Failed attempts show useful errors without exposing whether an email belongs to an account. |
| AUTH2 | Sign up and log in with Spotify | The same **Continue with Spotify** action creates a Gig Finder account for a first-time user or signs in an existing user through Supabase Auth. A returning user maps to the same account without a duplicate profile. Cancelled/failed authorization returns to a usable guest search with a clear message. Spotify client secret stays server-side. |
| AUTH3 | Optional identity | Guests can search and open Ticketmaster links; login is requested only for future saved or followed features. A new user's profile is created once using the Supabase Auth user ID as its key, regardless of login provider. |
| AUTH4 | Data minimization | Profile holds user ID, created timestamp and optional display name; email remains in Auth unless needed for a defined user feature. No Spotify access/refresh tokens, listening history or raw search text is copied to Airtable by default. Optional raw-query storage requires the separate choice and protections in the Search history subsection. |

**Spotify release constraint:** A Spotify developer app in development mode currently requires a Premium account for the app owner and allows up to five allowlisted Spotify users. Treat this as a small closed test; broader Spotify login depends on Spotify approving extended access. Email sign-up remains the general option.

#### Spotify top artists → five upcoming shows

**Golden path:** The user selects **Continue with Spotify**, authorizes the app, returns signed in, explicitly chooses **Find shows from my top artists** and grants the `user-top-read` scope if it has not already been granted. The app asks for or confirms a city, reads the user's top artists using Spotify Web API `GET /me/top/artists`, then finds upcoming shows for a bounded set of artists using Ticketmaster Discovery via a server-side function. Sort real, deduplicated matches by local event date and show the first **up to five** within the next 31 days. “Five shows” means a maximum of five upcoming event cards, not a promise that five matches exist.

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| SP1 | Separate data permission | Signing in does not silently import Spotify music data. The user sees the purpose of `user-top-read` before connecting; declining or revoking it leaves login and guest/manual search functional. Do not request playlist, followed-artist or listening-history scopes for this feature. |
| SP2 | Retrieve top artists | With permission, retrieve a bounded set of top artists from `GET /me/top/artists` (start with up to 10) and show the artist names used for matching. Handle empty data, expired provider token, 403 and 429 with an actionable retry or manual artist/city search. |
| SP3 | Match artists to events | Resolve an artist to a Ticketmaster attraction ID when available and query upcoming events for the selected city and next 31 days. If matching is uncertain, do not present a keyword result as a confirmed show by that artist; let the user adjust or omit that artist. No invented events. |
| SP4 | Show the next five | Display at most five unique, date-ordered upcoming event cards with artist/event, local date, venue, city and provider link. If fewer than five real matches exist, show the actual count and a suggestion to broaden the city or dates; never pad with unrelated events. |
| SP5 | Account and data protection | Spotify provider access/refresh tokens and client secret never go to Airtable or analytics payloads. Handle tokens on a trusted server for provider calls and renew access securely as needed. Do not persist the full artist list by default; if preferences are later saved, define consent, retention and deletion first. |
| SP6 | Mobile and accessibility | Spotify login, permission, city selection, empty/error states and five-show cards work by keyboard and touch, show visible labels/focus, and remain usable at 200% zoom. |

**Integration boundary:** Supabase Auth handles Spotify OAuth and the Gig Finder session. Spotify Web API supplies top artists only after the separate permission. Ticketmaster Discovery supplies concert events. The existing `search-concerts` function currently has a verified `{ keyword, city, size, page }` frontend contract; inspect the deployed function before extending it or adding a dedicated server-side artist-show endpoint. Spotify sign-in alone does not return concerts or top artists.

#### Product events and reporting

Here, **product events** mean actions in Gig Finder; **concert events** mean Ticketmaster listings. Do not send every returned concert listing to Airtable. Use a consistent event name and small properties object for each user action.

| Product event | Trigger | Properties to store |
| --- | --- | --- |
| `sign_up_completed` | Auth confirms a new user; emit once per user, server-side | `user_id`, `provider` (`email` or `spotify`) |
| `login_completed` | Successful sign-in to an existing account | `user_id`, `provider` |
| `spotify_artist_access_granted` | User explicitly authorizes top-artist access | `user_id`, scope name; no token or artist list |
| `personalized_shows_viewed` | Up to five real matched shows or empty state render | `user_id`, city, result count, status; no raw artist list |
| `search_submitted` | User submits a search | `user_id` if signed in, `anonymous_id`, `search_journey_id`, city, genre IDs, date-window length, `input_mode` (`plain_language` or `filters`) |
| `filters_interpreted` | AI returns validated editable filters | `anonymous_id`/`user_id`, interpretation status, time in ms, number of proposed genres |
| `filters_changed` | User edits an interpreted filter before searching again | `anonymous_id`/`user_id`, changed field names only |
| `search_results_viewed` | Results or empty state render | `anonymous_id`/`user_id`, result count, response time in ms, status (`success`, `empty`, `error`) |
| `event_opened` | User activates an outbound event link | `anonymous_id`/`user_id`, `search_journey_id`, Ticketmaster event ID, position in results, source (`Ticketmaster`) |

**Event schema:** `event_id` (UUID for deduplication), `event_name`, `occurred_at` (UTC), `user_id` (nullable), `anonymous_id` (rotating app identifier), `session_id`, `properties` (approved fields above), `schema_version`. Do not use an email address as an analytics ID. Record `sign_up_completed` only after confirmed account creation, not when the sign-up button is clicked; report attempts separately if needed. For OAuth redirects, keep the same anonymous/session ID when practical so pre-sign-up searches can be attributed after sign-up without duplicating event rows.

**Time to open an event (instrumentation):** Create a `search_journey_id` when a user starts a new concert-finding task; keep it across filter corrections and repeat searches until they open an event, start a new task or leave the session. Record `search_journey_started` with a timestamp at the first interaction with the search field or filters. On the first `event_opened` for that journey, calculate elapsed seconds from `search_journey_started` to the click, using the same clock where possible. Also report **search-submit-to-open** from the first `search_submitted`, to separate form-entry time from search and review time. An outbound click means the user opened the provider listing, not that they bought a ticket or found it relevant. Keep journeys with no click in the denominator and report their no-open rate separately; do not give them a fabricated duration.

**Usability comparison:** Give testers the same prompt in Gig Finder and a conventional city/genre/date flow. Start a task timer when the prompt is presented and stop when they open an event they judge relevant; record task success, elapsed seconds, filter corrections and any no-result or abandoned task. Counterbalance which interface they use first. Compare median task time and success rate, rather than declaring a win from clicks alone. For ordinary product analytics, report median and 75th-percentile journey time and the share of journeys that open an event within 60 seconds, segmented by `input_mode`; exclude non-consenting users from optional identifiable analytics as required by section 13.

**Data flow:** Browser actions → small tracking endpoint or controlled insert → `product_events` table in Supabase → scheduled daily/weekly aggregation and approved search-record sync → Airtable reporting tables. Auth completion → authenticated server-side profile creation and `sign_up_completed` event. The app must continue working if analytics or Airtable sync fails. Protect tables with Row Level Security; clients must not be able to forge another user's events or read everyone else's activity. Keep Airtable credentials and service-role keys out of the browser. Apply retention and deletion rules for event data and explain tracking in the privacy notice; respect applicable consent requirements before optional analytics.

**Airtable reporting view:** Create `Users` (Supabase user ID, signup date, provider, latest activity date), `Searches` (limited records defined below) and `Daily metrics` (date, searches, result views, empty searches, event opens, new sign-ups, returning users; optionally split by city/input mode). Sync approved search records and batched aggregates rather than every UI click; upsert by stable IDs and retry failed jobs. Supabase is the authoritative event log; Airtable is a restricted reporting view.

#### Search history in Airtable — requirements

**Purpose:** See which city, genre and date searches people attempt, where they get no results and whether they open an event. This informs coverage, AI interpretation and the time-to-open metric. Search history is an optional product-analytics feature; saving a personal search for the user's later use is a separate feature and remains out of scope.

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| AIR1 | One search record per submitted query | After an eligible search, create or upsert one `Searches` row keyed by `search_id` (UUID). Repeat submissions receive new IDs; an Airtable retry with the same ID does not create a duplicate. A filter correction and resubmission share the `search_journey_id`. |
| AIR2 | Minimal fields | Store `search_id`, `search_journey_id`, UTC journey start time, UTC submitted time, city, country, applied genre IDs/names, local start/end dates, input mode (`plain_language` or `filters`), result count, outcome (`results`, `empty`, `error`), and first opened Ticketmaster event ID/time when available. Store `user_id` only for an eligible signed-in user; do not send email, IP, precise location, Spotify token or artist history. |
| AIR3 | Raw request choice | The default `Raw query` field is empty. If raw natural-language text is genuinely needed for improving interpretation, provide a separate, clear optional choice, apply a length limit and redact obvious email/phone strings before transfer. A user who declines still gets the same search. Document lawful basis and retention before enabling this field. |
| AIR4 | Updates and reliability | Search submission creates the row; result render and first event open update that same `search_id`. The app captures the journey start on first interaction with search/filters, retains its `search_journey_id` across corrections and repeat submissions, and timestamps the first outbound event-link click. Failed Airtable writes queue for retry without blocking the search or link click; expose sync status to an admin, not to ordinary users. |
| AIR5 | Privacy and access | Gate optional analytics in accordance with the consent/lawful-basis decision in section 13. Restrict the Airtable base to authorized staff, define a retention period (proposed 30 days for row-level search records, subject to privacy review), and delete linked rows when an applicable user deletion request is fulfilled. Keep only non-identifiable aggregates longer. |
| AIR6 | Reportability | Provide Airtable views for daily search volume, top cities/genres, empty-result rate, result-open rate and median time from journey start to first event open. Exclude errors from the empty-result numerator and report no-open journeys separately. |

**Airtable setup for the owner:**

1. Create a dedicated base named **Gig Finder Analytics**. Add `Users` (primary key `User ID`) and `Searches` (primary key `Search ID`); optionally link `Searches` to `Users` by the stable Supabase user ID. Add the AIR2 columns with date/time, number and single-select types as appropriate. Add `Raw query` as an optional long-text field, initially unused. Create `Daily metrics` for aggregates.
   - In `Searches`, make **Journey started at**, **Submitted at** and **First event opened at** date/time fields. Store UTC ISO timestamps from the app; include seconds in the API values.
   - Make **Time to open (seconds)** a Formula field: `IF(AND({Journey started at}, {First event opened at}), DATETIME_DIFF({First event opened at}, {Journey started at}, 'seconds'))`. Leave it blank for journeys with no click; do not calculate `NOW() - start` for them.
   - Optionally make **Submit to open (seconds)** a second Formula field: `IF(AND({Submitted at}, {First event opened at}), DATETIME_DIFF({First event opened at}, {Submitted at}, 'seconds'))`. This separates typing/filtering time from results review.
2. In Airtable's developer settings, create a **Personal Access Token** with only `data.records:read` and `data.records:write` for this base (write is needed for creates/updates; read may be needed to reconcile/upsert). Give the integration user access to this base. Copy the base ID and table IDs; never paste the token into Lovable frontend code or the PRD.
3. Store `AIRTABLE_PAT`, `AIRTABLE_BASE_ID` and relevant table IDs as **Supabase Edge Function secrets**. Add a server-side `sync-search-to-airtable` job/function or extend a trusted server process; the browser sends only a validated search event to your backend. Verify the authenticated user server-side rather than accepting an arbitrary `user_id` from the request.
4. On first search interaction, capture `search_journey_started` and a stable `search_journey_id`. On submission, write the approved `search_id` record and its journey start/submission timestamps to Supabase first, then sync to Airtable asynchronously. Upsert by `Search ID` on retries and update the relevant submission row after results and its first outbound click. If the user searches again in the same journey, copy the original journey-start timestamp into the new submission row. Rate-limit/batch writes; track 429s and retry with backoff. Do not make a Ticketmaster search wait for Airtable.
5. In Airtable, create filtered/grouped views for **Today**, **No results**, **Opened event**, and **Sync issues**. Confirm five test searches, including guest, signed-in, no results, corrected filters and a simulated Airtable failure. Check exactly one row per `search_id` and correct linkage to the user when allowed. For a journey with an event click, verify `Time to open (seconds)` against a stopwatch; for a no-click journey verify the field stays blank. Aggregate by unique `search_journey_id` to avoid counting repeat searches as separate successful journeys.

**Capacity decision:** Airtable's Free plan currently permits 1,000 records per base and 1,000 API calls per workspace per month, with a 5-requests/second per-base rate limit. A row for every search can fill it quickly. Before public traffic, cap or sample row-level sync, shorten retention or move reporting to a higher-capacity plan; keep Supabase as the complete source of truth and Airtable as a small working view.

**Dashboard questions:** How many guests search? What share of searches return results? What share of result views lead to an event open? What share of visitors sign up, by provider? Do users edit AI-interpreted filters? How long from first search to event open? Define denominators and count unique users/sessions as well as raw events; no ticket purchase conversion claim is possible from outbound clicks alone.

**Acceptance checks:** Sign up with email and Spotify test accounts; verify one profile and one sign-up event per new user, login events only on later sessions, guest searches remain functional, a search produces one submitted event and one result-view event, an outbound click carries the real event ID, duplicates are ignored by `event_id`, and a failed Airtable sync can be retried without duplicate rows. Compare a sample Supabase daily count against Airtable totals.

## Guardrails

These are launch requirements for the relevant features, not a claim that the prototype is legally compliant. Confirm the applicable lawful basis, cookie rules, controller/processor roles and international transfers with a qualified privacy reviewer before collecting analytics from real users in the EU/EEA.

| Area | Guardrail | Release check |
| --- | --- | --- |
| GDPR purpose and minimization | Document separate purposes and lawful bases for account operation, optional Spotify top-artist access, product analytics and any future alerts. Collect only fields needed for each purpose. Do not infer sensitive interests from music searches, store raw free-text queries by default, import Spotify listening history beyond the explicitly requested top-artist response or use account details for marketing by default. If optional raw-query storage is enabled, apply AIR3 and AIR5. | Data inventory lists every field, purpose, recipient, legal basis and retention period; top-artist access and raw-query collection can each be declined independently. |
| Consent and guest experience | Where consent is required for analytics cookies or identifiers, do not set them or log identifiable optional analytics until the user opts in. Provide equally clear accept, reject and change-preferences controls; record consent state and respect withdrawal. Essential authentication/session processing remains separate. | In an EU/EEA test session, reject prevents optional tracking and search still works; withdrawal stops future optional events. |
| Transparency and user rights | Before sign-up and optional tracking, explain Supabase, Spotify and Airtable roles, what is shared, retention, and how to access, correct, export or request deletion of personal data. Deletion workflows must address Auth, profiles, identifiable analytics and any Airtable user rows; document lawful exceptions. | Complete a test access/export and deletion request across systems; set a response owner and deadline. |
| Retention and transfers | Set explicit retention for user profiles, raw product events, consent records and aggregates; purge or anonymize expired records. Review hosting regions, subprocessors and cross-border transfer mechanism before EU launch. Keep daily aggregate metrics non-identifiable where possible. | Scheduled retention job and transfer/vendor register reviewed before launch. |
| Security | Use Supabase Auth and Row Level Security for user records; restrict analytics inserts and dashboard reads; encrypt transport, rotate secrets and limit access to Airtable. Never place Spotify client secret, Ticketmaster key or Airtable token in frontend code or event payloads. | Guest cannot read another user's data; only authorized staff can see user-level reporting; secrets absent from client bundle. |
| AI interpretation | AI produces only candidate search filters from allowed values. Validate city, date bounds and genres on the server; display editable interpretation and clearly label uncertainty. Do not send account email, Spotify tokens or full user history to the model. | Ambiguous input can be corrected; unsupported requests do not create fabricated event cards. |
| Event integrity | Only show source-backed event IDs, dates, venues and outbound links; do not promise ticket availability or all local shows. Handle empty, stale or unavailable API responses explicitly. | Every displayed card maps to a real returned event; source attribution and limited coverage are visible. |
| Measurement | Deduplicate product events; separate guest, signed-in and consenting cohorts; distinguish an outbound ticket click from a completed purchase. Monitor interpretation corrections, empty results and error rates alongside speed. | Daily counts reconcile between Supabase and Airtable; reporting labels clicks accurately. |
| Accessibility | Meet section 11's keyboard, labeling, contrast, zoom, focus and status-announcement checks in auth, consent and search flows. | Complete a keyboard-only sign-up, consent decision, search and event-link task at 200% zoom. |

**Operational thresholds for the prototype:** Investigate any fabricated event card (target zero), any exposed secret or cross-user data access (target zero), and repeated duplicate sign-up events. Flag elevated empty-result, interpretation-correction, OAuth-failure and upstream-error rates for review; set numerical alert thresholds from observed baseline rather than inventing them. Do not publish claims of faster discovery until a comparison test supports them.

## Documentation

- Ticketmaster Discovery API: [https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) 
- Ticketmaster API Explorer: [https://developer.ticketmaster.com/api-explorer/v2/](https://developer.ticketmaster.com/api-explorer/v2/) 
- Supabase Edge Functions: [https://supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions) 
- Supabase secrets: [https://supabase.com/docs/guides/functions/secrets](https://supabase.com/docs/guides/functions/secrets) 
- Supabase function authentication: [https://supabase.com/docs/guides/functions/auth](https://supabase.com/docs/guides/functions/auth) 
- Supabase sign in with Spotify: [https://supabase.com/docs/guides/auth/social-login/auth-spotify](https://supabase.com/docs/guides/auth/social-login/auth-spotify)
- Spotify top artists endpoint: [https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks](https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks)
- Spotify development mode and user limits: [https://developer.spotify.com/documentation/web-api/concepts/quota-modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes)
- Airtable personal access tokens: [https://support.airtable.com/docs/creating-personal-access-tokens](https://support.airtable.com/docs/creating-personal-access-tokens)
- Airtable API limits: [https://support.airtable.com/docs/managing-api-call-limits-in-airtable](https://support.airtable.com/docs/managing-api-call-limits-in-airtable)
- Airtable date difference formula: [https://support.airtable.com/articles/8381355254-calculating-the-difference-between-dates-in-airtable](https://support.airtable.com/articles/8381355254-calculating-the-difference-between-dates-in-airtable)

---

###

## Original trailing markers

---

###

## 11. Market scan & alternatives

**Updated:** 24 September 2026  
**Product question:** Can one plain-language request, such as “punk-ish rock in Montréal this weekend,” get a fan to a relevant show faster than selecting city, genre and dates separately?

### Differentiator to test

The differentiator is **plain-language search with editable interpreted filters**. Gig Finder does not claim broader event coverage or better recommendations than established concert apps. The 60-second task test compares whether this simpler flow helps a fan open a relevant event faster, including time spent correcting the filters.

### Market and alternatives

| Existing option | What it does well | Gap or constraint for Gig Finder |
| --- | --- | --- |
| **Ticketmaster** | Fans can [search by location and filter by genre or date](https://help.ticketmaster.com/hc/en-us/articles/9670525378961-How-do-I-search-for-an-event), then open the event listing. | Fans choose filters themselves. The [Discovery API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) is suitable for the prototype but does not list every local show. Its API page states 5,000 calls/day and 5/second, while its [FAQ](https://developer.ticketmaster.com/support/faq/) says 2/second; check the account's actual limit and build conservatively. |
| **Songkick** | Strong artist tracking, alerts, and searches by artist, venue, date and location. Its [Montréal Rock listings](https://www.songkick.com/metro-areas/27377-canada-montreal/genre/rock) also offer date filters. | Fans still select a predefined genre. Its [API](https://www.songkick.com/developer) requires a paid partnership and currently does not approve student, educational or hobby projects. |
| **Bandsintown** | Fans can [browse Montréal shows by date and genre](https://www.bandsintown.com/c/montreal-qc), follow artists and see recommendations. | Fans still choose genre labels. Its [standard API key](https://help.artists.bandsintown.com/en/articles/7053475-what-is-the-bandsintown-api) is tied to one artist unless broader use is approved; citywide integration requires a partnership. |
| **Spotify Live Events** | Recommends local concerts from listening habits and links to [event details and ticket sellers](https://newsroom.spotify.com/2025-03-20/our-new-concerts-near-you-playlist-makes-it-fun-and-easy-to-discover-touring-artists/). | **Inference:** It serves discovery from a listening profile. Gig Finder's core task can work from an explicit request without a profile; Spotify personalization is a separate optional feature. |
| **DICE** | Supports [city discovery](https://dice.fm/), tailored recommendations, saved events and ticket purchase. | **Inference:** Its available event inventory is not every local concert. Its purchase flow is a stronger alternative when a fan already knows the show they want. |
| **Manual search across sites** | Comparing several sources can uncover shows absent from a single provider. | Fans repeat the city/date search, scan listings and translate their taste into each site's genre labels. |

### Songkick versus Bandsintown: genre-by-location UX

| Question | Songkick | Bandsintown |
| --- | --- | --- |
| **Can I filter genre and location?** | Yes. The [Montréal Rock page](https://www.songkick.com/metro-areas/27377-canada-montreal/genre/rock) offers a genre filter plus Tonight, This weekend and custom dates. | Yes. The [Montréal page](https://www.bandsintown.com/c/montreal-qc) puts date and genre choices together, including Rock, Punk and Jazz. |
| **What works well?** | Straightforward city, genre and date browsing with a dated concert list. | Discovery is prominent on the city page, with recommended and followed-artist views. |
| **What remains difficult for this task?** | The fan decides which genre represents “punk-ish rock” and sets dates separately. | The same predefined-genre decision remains, although the filters are clear. |

### Conclusion and test

Both Songkick and Bandsintown already support genre-by-city discovery. Test whether Gig Finder reduces the steps and time required to open a **relevant** event. Record task completion, time from the start of the task to the event click, filter corrections and no-open attempts; compare against a conventional filter flow. Do not treat an outbound click as a ticket purchase.

### Earlier market scan notes (retained)

| Alternative | What it does well | Gap or constraint for Gig Finder |
| --- | --- | --- |
| [Songkick](https://www.songkick.com/metro-areas/27377-canada-montreal/genre/rock) | City, genre and date filters; artist tracking. | A fan still selects predefined genres and dates; its [API](https://www.songkick.com/developer) requires a paid partnership and does not currently approve educational or hobby projects. |
| [Bandsintown](https://www.bandsintown.com/c/montreal-qc) | Clear city, genre and date browsing plus followed-artist discovery. | The [standard artist API](https://help.artists.bandsintown.com/en/articles/7053475-what-is-the-bandsintown-api) is tied to one artist unless broader use is approved. Plain-language sound descriptions still require interpretation. |
| [Ticketmaster](https://help.ticketmaster.com/hc/en-us/articles/9670525378961-How-do-I-search-for-an-event) | Direct event and ticket links with location, genre and date filters. | Users set filters themselves; its [Discovery API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) has limits and does not represent every local show. |
| [Spotify Live Events](https://open.spotify.com/concerts) | Local shows personalized to listening habits and ticket links. | A different use case from a one-off, explicit request for a sound and date; recommendations depend on its available partner listings. |

**Opportunity to test:** These products already support genre-by-city discovery. Gig Finder must prove that one natural-language request makes the task faster or easier; broader event coverage is not its prototype claim.

#### Human eyes only - not for AI

##### Market and alternatives

The differentiator to test is **plain-language search with editable interpreted filters**, not a claim of broader coverage or better recommendations than established apps. Use the 60-second task test to check whether the simpler flow helps.

| Existing option | What it does well | Gap or constraint for this idea |
| --- | --- | --- |
| **Ticketmaster** | Lets fans search by location, filter by genre or date, and open an [event listing](https://help.ticketmaster.com/hc/en-us/articles/9670525378961-How-do-I-search-for-an-event). | Fans still choose filters themselves. The [Discovery API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) documents 5,000 calls/day and 5 requests/second, while its [FAQ](https://developer.ticketmaster.com/support/faq/) says 2 requests/second; build conservatively and check the account's actual limits. It does not cover every local show. |
| **Songkick** | Offers artist tracking, concert alerts and searches by artist, venue, date or location. | Its [API](https://www.songkick.com/developer) requires a paid partnership license and currently does not approve student, educational or hobbyist projects. |
| **Bandsintown** | Helps fans follow artists and discover shows near a city; its [Montréal page](https://www.bandsintown.com/c/montreal-qc) includes nearby areas. | A standard [API key](https://help.artists.bandsintown.com/en/articles/7053475-what-is-the-bandsintown-api) is linked to one artist unless broader use is authorized; citywide integration requires a partnership. |
| **Spotify Live Events** | Recommends nearby concerts based on listening habits, with [event details and ticket links](https://newsroom.spotify.com/2025-03-20/our-new-concerts-near-you-playlist-makes-it-fun-and-easy-to-discover-touring-artists/). | **Inference:** It serves a listening-profile-led journey; Gig Finder can test a one-off request without requiring a profile. Optional Spotify personalization is a separate follow-on feature. |
| **DICE** | Supports city discovery, tailored recommendations, saved events and [ticket purchase](https://dice.fm/). | **Inference:** Its event inventory is limited to shows available through its own service and partners, so it should not be treated as exhaustive local coverage. |
| **Manual search across event sites** | Checking multiple sources may find shows omitted by one provider. | Fans repeat city/date searches, compare listings and translate their taste into each site's genre labels. |

##### Songkick versus Bandsintown: genre and location experience

| UX question | Songkick | Bandsintown |
| --- | --- | --- |
| **Genre + location** | Its [Montréal Rock page](https://www.songkick.com/metro-areas/27377-canada-montreal/genre/rock) has a clear genre filter plus Tonight, This weekend and custom date options. | Its [Montréal page](https://www.bandsintown.com/c/montreal-qc) puts date and genre choices together under Find shows, including Rock, Punk and Jazz. |
| **What feels useful** | Choose a city, genre and date, then scan a dated concert list. | The city page makes discovery prominent and offers recommended and followed-artist views. |
| **Remaining friction for this use case** | A fan decides which predefined genre fits “punk-ish rock” and sets the date separately. | Same predefined-genre decision, though its city filters are clear. |

**UX conclusion:** Both already support genre-by-location browsing. The gap to validate is whether a single request reduces time and cognitive effort, including any corrections to AI-proposed filters.
