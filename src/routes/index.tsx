import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getShows, type Show } from "@/lib/shows.functions";
import {
  Calendar,
  MapPin,
  Music,
  Search,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  X,
  RotateCcw,
  Ticket,
  ArrowUp,
} from "lucide-react";

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
  "Indie rock in Toronto",
];

const WHEN_OPTIONS = ["Tonight", "This weekend", "Next 5 days", "This month"] as const;
type WhenOption = (typeof WHEN_OPTIONS)[number];

function parseNaturalQuery(text: string) {
  let clean = text.trim();
  let city = "";
  let when: WhenOption | "" = "";

  // 1. Timeframe extraction
  if (/\btonight\b|\btoday\b/i.test(clean)) {
    when = "Tonight";
    clean = clean.replace(/\b(tonight|today)\b/gi, "").trim();
  } else if (/\bthis weekend\b|\bweekend\b/i.test(clean)) {
    when = "This weekend";
    clean = clean.replace(/\b(this weekend|weekend)\b/gi, "").trim();
  } else if (/\bnext 5 days\b|\bthis week\b/i.test(clean)) {
    when = "Next 5 days";
    clean = clean.replace(/\b(next 5 days|this week)\b/gi, "").trim();
  } else if (/\bthis month\b/i.test(clean)) {
    when = "This month";
    clean = clean.replace(/\bthis month\b/gi, "").trim();
  }

  // 2. City extraction: "in <City>" or "near <City>"
  const cityMatch = clean.match(
    /\b(?:in|near|around)\s+([A-Za-zÀ-ÿ\s'-]+?)(?=\s+(?:for|on|with|this|next|tonight)|$)/i,
  );
  if (cityMatch && cityMatch[1]) {
    city = cityMatch[1].trim();
    clean = clean.replace(cityMatch[0], "").trim();
  }

  // 3. Clean noise and suffixes
  clean = clean
    .replace(/\b(clubs|warehouse parties|parties|shows|concerts|gigs|live music|music|vibes|night)\b/gi, "")
    .replace(/-ish\b/gi, "")
    .trim();

  const keyword = clean.replace(/\s+/g, " ").trim();
  return { keyword, city, when };
}

function fmtDay(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function fmtTime(t: string | null) {
  if (!t) return "TBA";
  const [h, m] = t.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

type Geo = { city?: string | undefined; lat?: number | undefined; lng?: number | undefined };

function Index() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [when, setWhen] = useState<WhenOption>("This weekend");
  const [showFilters, setShowFilters] = useState(false);

  // Explicit filter state
  const [filterGenre, setFilterGenre] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Location state
  const [geo, setGeo] = useState<Geo | null>(null);
  const [locationStatus, setLocationStatus] = useState<"locating" | "ready" | "failed">("locating");

  // Search results state
  const [shows, setShows] = useState<Show[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSearchLabel, setActiveSearchLabel] = useState<string>("");

  const fetchShows = useServerFn(getShows);

  // Core search executor
  const runSearch = useCallback(
    async (params: {
      keyword?: string | undefined;
      city?: string | undefined;
      when?: WhenOption | undefined;
      startDate?: string | undefined;
      endDate?: string | undefined;
      lat?: number | undefined;
      lng?: number | undefined;
    }) => {
      setLoading(true);
      setError(null);

      const targetCity = params.city || filterCity || geo?.city;
      const targetKeyword = params.keyword !== undefined ? params.keyword : filterGenre;
      const targetWhen = params.when || when;

      // Build active search summary label
      const parts: string[] = [];
      if (targetKeyword) parts.push(`"${targetKeyword}"`);
      if (targetCity) parts.push(`in ${targetCity}`);
      if (params.startDate || startDate) {
        parts.push(`from ${params.startDate || startDate} to ${params.endDate || endDate || "onward"}`);
      } else {
        parts.push(targetWhen);
      }
      setActiveSearchLabel(parts.join(" · ") || `Shows ${targetWhen}`);

      try {
        const results = await fetchShows({
          data: {
            when: targetWhen,
            keyword: targetKeyword || undefined,
            city: targetCity || undefined,
            startDate: params.startDate || startDate || undefined,
            endDate: params.endDate || endDate || undefined,
            lat: !targetCity ? geo?.lat : undefined,
            lng: !targetCity ? geo?.lng : undefined,
          },
        });
        setShows(results);
      } catch (err: any) {
        console.error("Search failed:", err);
        setError("Couldn't retrieve shows right now. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [fetchShows, filterCity, filterGenre, geo, startDate, endDate, when],
  );

  // Geolocation detection on load
  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((d) => {
        if (d?.city) {
          const detectedGeo = { city: d.city, lat: d.latitude, lng: d.longitude };
          setGeo((g) => g ?? detectedGeo);
          setLocationStatus("ready");
          if (!filterCity) {
            setFilterCity(d.city);
          }
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
        if (city && !filterCity) setFilterCity(city);
        setLocationStatus("ready");
      },
      () => setLocationStatus((s) => (s === "locating" ? "failed" : s)),
      { timeout: 8000 },
    );
  }, []);

  // Initial fetch once location or fallback is ready
  useEffect(() => {
    if (shows === null && !loading && !error) {
      runSearch({ when });
    }
  }, [geo, shows, loading, error, runSearch, when]);

  // Handle Natural Language Submit
  const handleNaturalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      runSearch({ keyword: filterGenre, city: filterCity, when });
      return;
    }

    const parsed = parseNaturalQuery(query);

    // Apply parsed values to explicit filters so user sees interpretation
    if (parsed.keyword) setFilterGenre(parsed.keyword);
    if (parsed.city) setFilterCity(parsed.city);
    if (parsed.when) setWhen(parsed.when);

    runSearch({
      keyword: parsed.keyword || undefined,
      city: parsed.city || filterCity || geo?.city,
      when: parsed.when || when,
    });
  };

  // Click an example chip
  const handleExampleClick = (example: string) => {
    setQuery(example);
    const parsed = parseNaturalQuery(example);
    if (parsed.keyword) setFilterGenre(parsed.keyword);
    if (parsed.city) setFilterCity(parsed.city);
    if (parsed.when) setWhen(parsed.when);

    runSearch({
      keyword: parsed.keyword || undefined,
      city: parsed.city || undefined,
      when: parsed.when || when,
    });
  };

  // Change "When" chip
  const handleWhenChange = (selectedWhen: WhenOption) => {
    setWhen(selectedWhen);
    runSearch({ when: selectedWhen });
  };

  // Clear all filters, reset fields, and focus search input
  const handleClear = () => {
    setQuery("");
    setFilterGenre("");
    setFilterCity(geo?.city ?? "");
    setStartDate("");
    setEndDate("");
    setWhen("This weekend");
    runSearch({ keyword: "", city: geo?.city, when: "This weekend" });
    setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const handleResetFilters = () => {
    handleClear();
  };

  const activeFilterCount = [
    filterGenre ? 1 : 0,
    filterCity && filterCity !== geo?.city ? 1 : 0,
    startDate ? 1 : 0,
    endDate ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6">
      {/* Header */}
      <header className="text-center">
        <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3.5 py-1 text-brand font-medium">
          <Sparkles className="size-3.5 animate-pulse" />
          FEELING CHEEKY? · AI SENTENCE SEARCH
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Find your next live show
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground text-sm sm:text-base">
          Describe the vibe, genre, city and date in one sentence. We scour real listings so you never miss a beat.
        </p>
      </header>

      {/* Primary Search Panel */}
      <section className="card-panel p-5 sm:p-6">
        {/* Natural Language Sentence Search */}
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-brand" />
            <span className="font-medium text-foreground">What type of show are you looking for?</span>
          </div>
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="size-3" /> Clear
            </button>
          )}
        </div>

        <form className="mt-3 flex flex-col gap-3 sm:flex-row" onSubmit={handleNaturalSubmit}>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              className="field pl-10 pr-4 text-sm sm:text-base"
              placeholder="e.g. Punk-ish rock in Montréal this weekend"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Describe the concert you are looking for"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 px-6 py-3">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Find shows
          </button>
        </form>

        {/* Examples / Cheeky Prompts */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="chip cursor-pointer text-xs"
              onClick={() => handleExampleClick(ex)}
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Quick Timeframe Filters */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">When:</span>
            {WHEN_OPTIONS.map((w) => (
              <button
                key={w}
                type="button"
                className={w === when && !startDate ? "chip-active cursor-pointer" : "chip cursor-pointer"}
                onClick={() => handleWhenChange(w)}
              >
                {w}
              </button>
            ))}
          </div>

          {/* Toggle for Collapsed Filters */}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-primary hover:underline"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="size-3.5" />
            {showFilters ? "Hide filters" : "Filter by Genre, City and Date Range"}
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                {activeFilterCount}
              </span>
            )}
            {showFilters ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        </div>

        {/* Collapsible Filter Section — Header: Filter by Genre, City and Date Range */}
        {showFilters && (
          <div className="mt-5 border-t border-border pt-5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-foreground/80">
                Filter by Genre, City and Date Range
              </h2>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <RotateCcw className="size-3" /> Reset filters
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Genre or artist" icon={<Music className="size-4" />}>
                <input
                  className="field pl-10 text-sm"
                  placeholder="e.g. punk, jazz, rock, metal..."
                  value={filterGenre}
                  onChange={(e) => setFilterGenre(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runSearch({ keyword: e.currentTarget.value })}
                />
              </Field>

              <Field label="City" icon={<MapPin className="size-4" />}>
                <input
                  className="field pl-10 text-sm"
                  placeholder="e.g. Montréal, New York, Toronto..."
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runSearch({ city: e.currentTarget.value })}
                />
              </Field>

              <Field label="From Date" icon={<Calendar className="size-4" />}>
                <input
                  type="date"
                  className="field pl-10 text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Field>

              <Field label="To Date" icon={<Calendar className="size-4" />}>
                <input
                  type="date"
                  className="field pl-10 text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => runSearch({ keyword: filterGenre, city: filterCity, startDate, endDate })}
                disabled={loading}
                className="btn-primary px-5 py-2 text-sm flex items-center gap-2"
              >
                {loading && <Loader2 className="size-3.5 animate-spin" />}
                Apply filters
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Results Section (Brought right up below collapsed filters) */}
      <section className="space-y-4">
        {/* Results Header Bar */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow text-brand">Live Concert Listings</p>
            <h2 className="text-xl font-bold font-display sm:text-2xl text-foreground">
              {activeSearchLabel || "Upcoming Concerts"}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="size-3.5 text-primary" />
            <span>
              {filterCity
                ? filterCity
                : locationStatus === "locating"
                  ? "Locating…"
                  : geo?.city ?? "All regions"}
            </span>
            {shows && <span className="rounded bg-secondary px-2 py-0.5 text-foreground">{shows.length} shows</span>}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-center text-sm text-foreground">
            <p>{error}</p>
            <button
              onClick={() => runSearch({ keyword: filterGenre, city: filterCity, when })}
              className="mt-2 text-xs font-semibold text-primary underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading state skeleton */}
        {loading && (
          <ul className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="card-panel flex gap-4 p-4 animate-pulse">
                <div className="size-24 rounded-lg bg-secondary shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-1/3 bg-secondary rounded" />
                  <div className="h-5 w-3/4 bg-secondary rounded" />
                  <div className="h-3 w-1/2 bg-secondary rounded" />
                  <div className="h-8 w-24 bg-secondary rounded mt-3" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Empty state */}
        {!loading && !error && shows && shows.length === 0 && (
          <div className="space-y-6">
            <div className="card-panel p-8 text-center">
              <Music className="mx-auto size-10 text-muted-foreground opacity-50" />
              <h3 className="mt-3 font-display text-lg font-bold text-foreground">No upcoming shows found</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                We couldn't find any concerts matching {activeSearchLabel || "your query"}. Try expanding your date range,
                clearing specific genre filters, or searching a nearby major city.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn-primary px-4 py-2 text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="size-3.5" /> Clear and search again
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="chip px-4 py-2 text-xs inline-flex items-center gap-1.5 cursor-pointer hover:border-primary"
                >
                  <RotateCcw className="size-3.5" /> Reset to all upcoming shows
                </button>
              </div>
            </div>

            {/* Recommendations row below the RESET TO ALL UPCOMING SHOWS CTA */}
            <GeoRecommendationsCarousel
              city={filterCity || geo?.city}
              lat={geo?.lat}
              lng={geo?.lng}
            />
          </div>
        )}

        {/* Results grid */}
        {!loading && shows && shows.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2">
            {shows.map((s) => (
              <li
                key={s.id}
                className="card-panel flex flex-col justify-between overflow-hidden p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-glow"
              >
                <div className="flex gap-4">
                  {s.image ? (
                    <img
                      src={s.image}
                      alt={s.artist}
                      loading="lazy"
                      className="size-24 shrink-0 rounded-lg object-cover bg-secondary"
                    />
                  ) : (
                    <div className="flex size-24 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/50">
                      <Music className="size-8 text-muted-foreground" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-brand">
                      {fmtDay(s.date)} {s.time && `· ${fmtTime(s.time)}`}
                    </p>
                    <h3 className="truncate font-display font-bold text-foreground text-base sm:text-lg" title={s.artist}>
                      {s.artist}
                    </h3>
                    <p className="truncate text-xs text-muted-foreground mt-0.5">
                      {s.genre} · {s.venue}
                      {s.venueCity && ` (${s.venueCity})`}
                    </p>
                    {s.price && (
                      <p className="mt-2 text-xs font-semibold text-primary">
                        Tickets from {s.price}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Ticket className="size-3 text-muted-foreground" /> Ticketmaster
                  </span>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium"
                  >
                    <span>Get Tickets</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}

        <footer className="pt-6 text-center text-xs text-muted-foreground">
          Real live listings & ticketing links provided via Ticketmaster Discovery API.
        </footer>
      </section>

      {/* Floating Back to Top button when scrolled out of viewport */}
      <BackToTop />
    </main>
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
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="relative mt-1 block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        {children}
      </span>
    </label>
  );
}

function GeoRecommendationsCarousel({
  city,
  lat,
  lng,
}: {
  city?: string | undefined;
  lat?: number | undefined;
  lng?: number | undefined;
}) {
  const [items, setItems] = useState<Show[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchShows = useServerFn(getShows);

  // Load initial page (page 0)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchShows({
      data: {
        when: "All upcoming",
        city: city || undefined,
        lat: !city ? lat : undefined,
        lng: !city ? lng : undefined,
        page: 0,
        size: 16,
      },
    })
      .then((res) => {
        if (!cancelled) {
          setItems(res || []);
          setPage(0);
          setHasMore((res || []).length >= 8);
        }
      })
      .catch(() => {
        if (!cancelled) setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [city, lat, lng, fetchShows]);

  // Load next page function
  const loadNextPage = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await fetchShows({
        data: {
          when: "All upcoming",
          city: city || undefined,
          lat: !city ? lat : undefined,
          lng: !city ? lng : undefined,
          page: nextPage,
          size: 16,
        },
      });
      if (!res || res.length === 0) {
        setHasMore(false);
      } else {
        setItems((prev) => {
          const seen = new Set(prev.map((s) => s.id));
          const newUnique = res.filter((s) => !seen.has(s.id));
          return [...prev, ...newUnique];
        });
        setPage(nextPage);
        if (res.length < 8) setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, page, city, lat, lng, fetchShows]);

  // Infinite scroll trigger via scroll listener & IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadNextPage();
        }
      },
      { root: scrollRef.current, rootMargin: "0px 300px 0px 0px", threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadNextPage, hasMore]);

  // Scroll buttons
  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  };
  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  };

  return (
    <div className="mt-8 border-t border-border/80 pt-8">
      {/* Carousel Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <span className="eyebrow text-brand">Recommended for you</span>
          <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Check out these recommendations in your area
          </h3>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Upcoming concerts {city ? `near ${city}` : "nearby"} · Chronologically ordered by date and time
          </p>
        </div>

        {/* Carousel Navigation Chevrons */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={scrollLeft}
            className="flex size-8 items-center justify-center rounded-full border border-border bg-secondary/80 text-foreground transition hover:border-primary hover:bg-secondary cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={scrollRight}
            className="flex size-8 items-center justify-center rounded-full border border-border bg-secondary/80 text-foreground transition hover:border-primary hover:bg-secondary cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex gap-4 overflow-hidden py-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-64 sm:w-72 shrink-0 card-panel p-3.5 space-y-3 animate-pulse">
              <div className="h-36 w-full rounded-lg bg-secondary" />
              <div className="h-3 w-1/3 rounded bg-secondary" />
              <div className="h-5 w-3/4 rounded bg-secondary" />
              <div className="h-3 w-1/2 rounded bg-secondary" />
              <div className="h-8 w-full rounded bg-secondary mt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Infinite Horizontal Carousel Track */}
      {!loading && items.length > 0 && (
        <div
          ref={scrollRef}
          onScroll={() => {
            if (!scrollRef.current) return;
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            if (scrollLeft + clientWidth >= scrollWidth - 300 && !loadingMore && hasMore) {
              loadNextPage();
            }
          }}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: "thin" }}
        >
          {items.map((show) => (
            <div
              key={show.id}
              className="w-64 sm:w-72 shrink-0 snap-start card-panel flex flex-col justify-between overflow-hidden p-3.5 transition-all duration-200 hover:border-primary/40 hover:shadow-glow"
            >
              <div>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-secondary">
                  {show.image ? (
                    <img
                      src={show.image}
                      alt={show.artist}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Music className="size-8 text-muted-foreground" />
                    </div>
                  )}
                  {show.price && (
                    <span className="absolute bottom-2 right-2 rounded-md bg-background/90 px-2 py-0.5 text-[11px] font-bold text-primary shadow">
                      From {show.price}
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-brand">
                    {fmtDay(show.date)} {show.time && `· ${fmtTime(show.time)}`}
                  </p>
                  <h4
                    className="truncate font-display font-bold text-foreground text-sm sm:text-base"
                    title={show.artist}
                  >
                    {show.artist}
                  </h4>
                  <p className="truncate text-xs text-muted-foreground">
                    {show.genre} · {show.venue}
                    {show.venueCity && ` (${show.venueCity})`}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                  <Ticket className="size-3" /> Ticketmaster
                </span>
                <a
                  href={show.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium"
                >
                  <span>Tickets</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          ))}

          {/* Sentinel & Loading indicator for infinite scrolling */}
          {hasMore && (
            <div
              ref={sentinelRef}
              className="w-28 shrink-0 flex flex-col items-center justify-center p-4 text-center snap-start"
            >
              {loadingMore ? (
                <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-5 animate-spin text-primary" />
                  <span>Loading more…</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={loadNextPage}
                  className="chip text-xs hover:border-primary cursor-pointer py-2 px-3"
                >
                  More shows →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      id="backToTop"
      type="button"
      aria-label="Back to top"
      title="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-[1000] flex h-12 w-12 items-center justify-center rounded-full bg-[#00F5D4] text-[#02060B] shadow-[0_0_20px_rgba(0,245,212,0.45)] transition-all hover:scale-110 hover:bg-[#2effdf] hover:shadow-[0_0_30px_rgba(0,245,212,0.7)] cursor-pointer"
    >
      <ArrowUp className="h-6 w-6 stroke-[2.5]" aria-hidden />
    </button>
  );
}

