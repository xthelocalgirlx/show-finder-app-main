import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getShows, type Show } from "@/lib/shows.functions";
import { Calendar, MapPin, Music, Search, Sparkles, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Encore — Find your next live show" },
      {
        name: "description",
        content:
          "Search real concert listings by vibe, city or date. Describe what you want in a sentence and get live shows near you.",
      },
      { property: "og:title", content: "Encore — Find your next live show" },
      {
        property: "og:description",
        content:
          "Search real concert listings by vibe, city or date. Describe what you want in a sentence and get live shows near you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const EXAMPLES = [
  "Punk-ish rock in Montréal this weekend",
  "Jazz clubs in New York tonight",
  "Techno warehouse parties in Berlin",
];

const WHEN = ["Tonight", "This weekend", "Next 5 days", "This month"];

function Index() {
  const [query, setQuery] = useState("");
  const [when, setWhen] = useState("This weekend");
  const [showFilters, setShowFilters] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-10 px-5 py-16">
      <header className="text-center">
        <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-brand/40 px-3 py-1 text-brand">
          <span className="size-1.5 rounded-full bg-brand" />
          Live music, near you
        </span>
        <h1 className="mt-6 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
          Find your next show
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Describe the night you want. We search real listings and hand back shows you can
          actually get into.
        </p>
      </header>

      <section className="card-panel p-5 sm:p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-brand" />
          <span>Ask in plain language — filters are optional</span>
        </div>

        <form
          className="mt-3 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="field pl-10"
              placeholder="Punk-ish rock in Montréal this weekend"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Describe the show you want"
            />
          </div>
          <button type="submit" className="btn-primary px-6 py-3">
            Find shows
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Try</span>
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="chip" onClick={() => setQuery(ex)}>
              {ex}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-5">
          {WHEN.map((w) => (
            <button
              key={w}
              type="button"
              className={w === when ? "chip-active" : "chip"}
              onClick={() => setWhen(w)}
            >
              {w}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="ml-auto inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <SlidersHorizontal className="size-4" />
            {showFilters ? "Hide filters" : "More filters"}
          </button>
        </div>

        {showFilters && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Genre or artist" icon={<Music className="size-4" />}>
              <input className="field pl-10" placeholder="punk, jazz, rock…" />
            </Field>
            <Field label="City" icon={<MapPin className="size-4" />}>
              <input className="field pl-10" placeholder="Montréal, New York…" />
            </Field>
            <Field label="From" icon={<Calendar className="size-4" />}>
              <input type="date" className="field pl-10" />
            </Field>
            <Field label="To" icon={<Calendar className="size-4" />}>
              <input type="date" className="field pl-10" />
            </Field>
          </div>
        )}
      </section>

      <Recommendations when={when} />
    </main>
  );
}

type Geo = { city?: string | undefined; lat?: number | undefined; lng?: number | undefined };

function fmtDay(date: string) {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
}
function fmtTime(t: string | null) {
  if (!t) return "TBA";
  const [h, m] = t.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function Recommendations({ when }: { when: string }) {
  const [geo, setGeo] = useState<Geo | null>(null);
  const [status, setStatus] = useState<"locating" | "ready" | "failed">("locating");
  const [shows, setShows] = useState<Show[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchShows = useServerFn(getShows);

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((d) => {
        if (d?.city) {
          setGeo((g) => g ?? { city: d.city, lat: d.latitude, lng: d.longitude });
          setStatus("ready");
        }
      })
      .catch(() => {});
    navigator.geolocation?.getCurrentPosition(
      async ({ coords }) => {
        let city: string | undefined;
        try {
          const r = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`,
          );
          const d = await r.json();
          city = d.city || d.locality;
        } catch {}
        setGeo({ city, lat: coords.latitude, lng: coords.longitude });
        setStatus("ready");
      },
      () => setStatus((s) => (s === "locating" ? "failed" : s)),
      { timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    if (!geo) return;
    setShows(null);
    setError(null);
    fetchShows({
      data: {
        when: when as "Tonight" | "This weekend" | "Next 5 days" | "This month",
        lat: geo.lat,
        lng: geo.lng,
        city: geo.city,
      },
    })
      .then(setShows)
      .catch(() => setError("Couldn't load shows right now."));
  }, [geo, when, fetchShows]);

  const city = geo?.city;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-brand">Recommended for you</p>
          <h2 className="mt-1 font-display text-2xl font-bold">
            {when} {city ? <>in {city}</> : "near you"}
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5" />
          {status === "locating" && !city ? "Finding your location…" : city ?? "Location unavailable"}
        </span>
      </div>

      {error && <p className="text-sm text-muted-foreground">{error}</p>}
      {status === "failed" && !geo && (
        <p className="text-sm text-muted-foreground">Allow location access to see shows near you.</p>
      )}
      {geo && !shows && !error && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="card-panel h-28 animate-pulse" />
          ))}
        </ul>
      )}
      {shows && shows.length === 0 && (
        <p className="text-sm text-muted-foreground">No shows found for {when.toLowerCase()}. Try another date.</p>
      )}

      {shows && shows.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {shows.map((s) => (
            <li key={s.id} className="card-panel flex gap-4 p-3">
              {s.image ? (
                <img
                  src={s.image}
                  alt={s.artist}
                  loading="lazy"
                  className="size-24 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex size-24 shrink-0 items-center justify-center rounded-lg border border-border">
                  <Music className="size-6 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  {fmtDay(s.date)} · {fmtTime(s.time)}
                </p>
                <p className="truncate font-display font-bold">{s.artist}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {s.genre} · {s.venue}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm">{s.price ? `From ${s.price}` : ""}</span>
                  <a href={s.url} target="_blank" rel="noreferrer" className="btn-primary px-3 py-1.5 text-sm">
                    Tickets
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-center text-xs text-muted-foreground">Listings and images from Ticketmaster</p>
    </section>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="relative mt-1.5 block">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        {children}
      </span>
    </label>
  );
}
