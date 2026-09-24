# Your Next Show

A responsive concert finder for finding real upcoming shows by music taste, city and date. [Open the live app](https://show-finder-app.lovable.app) or [edit it in Lovable](https://lovable.dev/projects/c694cc76-f7ca-4ca6-9028-3088b8403892).

## Current search integration

The frontend uses the project's configured Supabase client to call the existing `search-concerts` Edge Function. The original verified request shape is:

```js
const { data, error } = await supabase.functions.invoke('search-concerts', {
  body: { keyword, city, size: 10, page: 0 },
});
```

Inspect a real function response before mapping cards to `data.events`; do not assume field names or use fabricated live results. Show the available event or artist name, local date, venue, city and an outbound **View event** link. Handle missing optional fields, loading, errors and no matches. Never put the Ticketmaster API key in frontend code.

The PRD describes a richer request with interpreted genres and date boundaries. **That contract must be verified against the deployed Edge Function before the frontend sends new fields.** Do not replace the existing function or add a database table solely to make this original search request work.

## Product direction

The working Concert Finder PRD defines the target experience: a fan can ask for something like “punk-ish rock in Montréal this weekend,” inspect or edit the interpreted city, genres and dates, then open a real provider event. AI proposes filters; Ticketmaster supplies events. The product hypothesis is that this is faster than selecting city, genre and dates separately.

The earlier project roadmap marks these interface features complete, with acceptance checks in the PRD that still need verification against the current build:

- AI recommendations based on selected preferences
- Date range filters
- Load more results
- Event details view
- Back to top control

Email sign-up, product-event tracking and Airtable reporting are **follow-on requirements**, not confirmed current features. **Spotify sign-in and top-artist discovery are if-we-have-time POC work**, attempted only after real guest search and the timing test pass; otherwise they move to the follow-on release. Guest search remains available. The PRD also defines accessibility, privacy/GDPR and data-quality guardrails.

## Verify before publishing an update

1. Run a real search for `jazz` in `New York`, then `rock` in `Montreal`. Confirm cards link to genuine returned events and optional fields degrade gracefully.
2. Check the deployed function's accepted request and response fields before connecting natural-language dates, genre arrays or pagination. Keep applied filters visible and editable.
3. Verify that Load more preserves filters and deduplicates events, details show the selected event, and Back to top works on mobile and by keyboard.
4. Test loading, invalid input, no results, upstream error and rate limit states. Check focus, labels, contrast and 200% zoom.
5. For measurement, capture search-journey start and first event-link open with the same journey ID. Report journeys with no click separately; an outbound click is not a ticket purchase.
6. Publish the Lovable preview after real search and the affected feature checks pass. If time remains, test Spotify login with allowlisted accounts and a separate top-artist permission; do not delay the core demo for it.

## What changes for production

| Area | Change and reason |
| --- | --- |
| Scale | Cache event searches and plan for higher provider capacity because repeated requests from 10,000 users could exhaust Ticketmaster's POC quota. |
| Reliability | Add upstream timeouts, bounded retries with backoff, error monitoring and alerts so an API failure is visible and does not leave a search hanging. |
| AI layer | Keep structured, validated filter output and add a deterministic/manual-filter fallback; measure correction rates before considering a different model or fine-tuning. |
| Cost control | Limit requests per user/IP and cache repeated city, genre and date combinations to control model and provider calls. |
| Privacy and compliance | Define purposes, consent where required, retention and deletion; store only needed search data and keep Spotify tokens out of analytics and Airtable. |

## Guardrail tests

Run the **POC** checks before sharing the search demo. The conditional checks apply when their feature is built; a listed test is a requirement, not a claim that the current site already passes it. Record the prompt/request, observed result, date and pass/fail for each run.

**Success test:** Give testers five scripted requests in the AI flow and a conventional filter flow, vary which flow comes first, and time from the task prompt to a tester-confirmed relevant event listing. Aim for at least four of five AI tasks within 60 seconds, at least four of five searches with understandable results or a useful empty state, zero fabricated event cards, and a response under five seconds under normal API conditions. Report no-open journeys separately; a click alone does not prove relevance or a purchase, and five tasks give only a directional comparison.

| Scope | Test | Pass condition |
| --- | --- | --- |
| POC | Search `jazz` + `New York`, inspect the actual function response, then open a result; repeat with `rock` + `Montreal`. | Every displayed card maps to a returned event ID and provider URL; missing optional artwork or venue fields do not create invented details or broken cards. **Target: zero fabricated cards.** |
| POC | Enter an ambiguous city, unsupported genre, reversed dates and prompt-injection text such as “ignore the allowed genres”; edit the interpreted filters. | Only schema-constrained allowed values pass server validation; the user can correct uncertain fields, and no instruction in the query bypasses validation or creates a fabricated event. |
| POC | Simulate an AI timeout/refusal and Ticketmaster timeout, 429 or 5xx response. | Manual filters remain usable; loading ends; the app shows a distinct actionable message and does not retry indefinitely. |
| POC | Inspect the built frontend, network responses and visible error messages. | Ticketmaster/model secrets, Supabase service-role credentials and raw upstream error payloads are absent. **Target: zero exposed secrets.** |
| POC | Complete search, filter editing, no-results recovery and event-link opening using only the keyboard; repeat at mobile width and 200% zoom. | Labels and focus are visible, controls remain operable, text is not clipped, status messages are announced and no interaction requires hover. |
| When tracking is implemented | Start one search journey, change a filter, resubmit and click one event; also complete a journey with no click. | The first click is linked to the original journey start and real event ID; repeat submissions do not inflate successful journeys, no-click time stays blank and an outbound click is not reported as a purchase. |
| When optional analytics is implemented | Reject or withdraw optional analytics consent, then search as a guest. | Search still works and no optional identifiable analytics event is stored after rejection/withdrawal; verify the consent decision is respected in the relevant region. |
| **If Spotify is built** | Use an allowlisted test account; cancel sign-in, decline `user-top-read`, then grant it separately and search top artists. | Guest search survives each refusal, no top-artist data is read before permission, and the personalized view shows at most five real Ticketmaster matches or a useful empty state. |
| Before public account launch | Test two accounts against profile and product-event access; complete a test export/deletion request. | Neither user can read the other's data, and the deletion workflow covers applicable Supabase and Airtable records. |

See the PRD's **Guardrails** and **Accessibility requirements and acceptance criteria** for the full release checks.

## Development

This project was built with [Lovable](https://lovable.dev). Changes made in Lovable are committed to the connected repository; changes pushed to its connected `main` branch sync back to Lovable. Confirm the repository connection and branch before relying on that workflow.

**POC stack:** Use Lovable for the existing frontend, Antigravity for code changes and local checks, one connected GitHub repository for version control, Netlify for frontend hosting, and the existing Supabase Edge Function for Ticketmaster and the server-side AI interpreter. Use the Netlify-provided URL for the POC; custom domain setup can wait. Supabase Postgres/Auth is needed only if optional Spotify or later persistent tracking is implemented. No file storage or vector store is needed for the guest-search proof. See [the architecture decision](Concert-Finder-Architecture.md) and [roadmap](Concert-Finder-Roadmap.md).

For local development, install Node.js and npm (for example with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)), then run:

```sh
git clone <this-repository-url>
cd <repository-name>
npm install
npm run dev
```

Replace the placeholders with the actual repository URL and directory name.
