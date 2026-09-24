import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Loader2,
  MapPin,
  Music,
  CalendarDays,
  Ticket,
  SearchX,
  AlertTriangle,
  Sparkles,
  ArrowUp,
  Tag,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { recommendShows, type Recommendation } from "@/lib/recommend.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Find Your Next Show — Live Concert Finder" },
      {
        name: "description",
        content:
          "Search live concerts by music genre, city and dates, and get AI picks that match your taste. Real Ticketmaster listings.",
      },
      { property: "og:title", content: "Find Your Next Show — Live Concert Finder" },
      {
        property: "og:description",
        content: "Search live concerts by genre, city and dates, with AI picks that match your taste.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type ConcertEvent = {
  id?: string;
  name?: string;
  artist?: string[] | string | null;
  date?: string | null;
  time?: string | null;
  dateTime?: string | null;
  timezone?: string | null;
  venue?: string | null;
  city?: string | null;
  state?: string | null;
  imageUrl?: string | null;
  price?: { min?: number | null; max?: number | null; currency?: string | null } | null;
  url?: string | null;
  category?: string | null;
  status?: string | null;
};

const PAGE_SIZE = 10;

function ts(ev: ConcertEvent) {
  const t = new Date(ev.dateTime ?? (ev.date ? `${ev.date}T${ev.time ?? "00:00:00"}` : "")).getTime();
  return Number.isNaN(t) ? Infinity : t;
}

function formatDate(ev: ConcertEvent, long = false) {
  if (!ev.date) return null;
  const iso = ev.dateTime ?? `${ev.date}T${ev.time ?? "00:00:00"}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return ev.date;
  const opts: Intl.DateTimeFormatOptions = {
    weekday: long ? "long" : "short",
    month: long ? "long" : "short",
    day: "numeric",
    year: "numeric",
    ...(ev.time ? { hour: "numeric", minute: "2-digit" } : {}),
    ...(ev.timezone ? { timeZone: ev.timezone } : {}),
    ...(long && ev.time ? { timeZoneName: "short" } : {}),
  };
  try {
    return new Intl.DateTimeFormat("en-US", opts).format(d);
  } catch {
    return ev.date;
  }
}

function artistList(ev: ConcertEvent) {
  const a = ev.artist;
  return Array.isArray(a) ? a.filter(Boolean) : a ? [a] : [];
}

function artistLine(ev: ConcertEvent) {
  const list = artistList(ev);
  if (!list.length) return null;
  const joined = list.join(" · ");
  return joined === ev.name ? null : joined;
}

function priceLine(ev: ConcertEvent) {
  const p = ev.price;
  if (!p || (p.min == null && p.max == null)) return null;
  const cur = p.currency ?? "";
  if (p.min != null && p.max != null && p.min !== p.max) return `${cur} ${p.min}–${p.max}`;
  return `${cur} ${p.min ?? p.max}`;
}

function todayStr() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function addDaysStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function getWeekendDates() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  const end = new Date(now);
  if (day === 5) {
    start.setDate(now.getDate() + 1);
    end.setDate(now.getDate() + 2);
  } else if (day === 6) {
    end.setDate(now.getDate() + 1);
  } else if (day === 0) {
    // Sunday: start & end are today
  } else {
    const diffToSat = 6 - day;
    start.setDate(now.getDate() + diffToSat);
    end.setDate(now.getDate() + diffToSat + 1);
  }
  return {
    start: new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 10),
    end: new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 10),
  };
}

function EventCard({ ev, onOpen, reason }: { ev: ConcertEvent; onOpen: () => void; reason?: string }) {
  const when = formatDate(ev);
  const artists = artistLine(ev);
  const place = [ev.venue, [ev.city, ev.state].filter(Boolean).join(", ")].filter(Boolean);
  const price = priceLine(ev);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0A0C13] shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-[#FF2E93]/60 hover:shadow-[0_16px_36px_rgba(0,0,0,0.8),0_0_24px_rgba(255,46,147,0.22)]">
      <button type="button" onClick={onOpen} className="block text-left" aria-label={`Details for ${ev.name ?? "event"}`}>
        {ev.imageUrl ? (
          <img src={ev.imageUrl} alt={ev.name ?? "Event artwork"} loading="lazy" className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
        ) : (
          <div className="flex aspect-[16/9] w-full items-center justify-center bg-[#121520]">
            <Music className="h-10 w-10 text-muted-foreground" aria-hidden />
          </div>
        )}
      </button>
      <div className="flex flex-1 flex-col space-y-3 p-5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold leading-snug text-white transition-colors">{ev.name ?? "Untitled event"}</h3>
            {ev.category ? (
              <span className="shrink-0 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#FF2E93]/15 text-[#FF65A8] border border-[#FF2E93]/30">
                {ev.category}
              </span>
            ) : null}
          </div>
          {artists ? <p className="mt-1 text-sm text-slate-400">{artists}</p> : null}
        </div>
        {reason ? (
          <p className="flex gap-2 rounded-lg bg-[#FF2E93]/10 border border-[#FF2E93]/25 p-2 text-sm text-slate-200">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#FF2E93]" aria-hidden />
            <span>{reason}</span>
          </p>
        ) : null}
        <ul className="space-y-1.5 text-sm text-slate-300">
          {when ? (
            <li className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-[#00F5D4]" aria-hidden />
              <span>{when}</span>
            </li>
          ) : null}
          {place.length ? (
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-[#00F5D4]" aria-hidden />
              <span>{place.join(" — ")}</span>
            </li>
          ) : null}
          {price ? (
            <li className="flex items-center gap-2">
              <Ticket className="h-4 w-4 shrink-0 text-[#00F5D4]" aria-hidden />
              <span>{price}</span>
            </li>
          ) : null}
        </ul>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onOpen}
            className="border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-200 cursor-pointer"
          >
            Details
          </Button>
          {ev.url ? (
            <a
              href={ev.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-[#00F5D4] px-3.5 py-1.5 text-sm font-bold text-[#02060B] shadow-[0_0_15px_rgba(0,245,212,0.35)] hover:bg-[#2effdf] hover:shadow-[0_0_24px_rgba(0,245,212,0.6)] transition-all"
            >
              View event
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function DetailsDialog({ ev, onClose }: { ev: ConcertEvent | null; onClose: () => void }) {
  const artists = ev ? artistList(ev) : [];
  const location = ev ? [ev.city, ev.state].filter(Boolean).join(", ") : "";
  const price = ev ? priceLine(ev) : null;
  const when = ev ? formatDate(ev, true) : null;
  return (
    <Dialog open={!!ev} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg border border-white/10 bg-[#0A0C13] shadow-2xl text-slate-100">
        {ev ? (
          <>
            {ev.imageUrl ? (
              <img src={ev.imageUrl} alt={ev.name ?? "Event artwork"} className="aspect-[16/9] w-full rounded-lg object-cover" />
            ) : null}
            <DialogHeader>
              <div className="flex items-start justify-between gap-2">
                <DialogTitle className="text-xl text-white">{ev.name ?? "Untitled event"}</DialogTitle>
                {ev.category ? (
                  <span className="shrink-0 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#FF2E93]/15 text-[#FF65A8] border border-[#FF2E93]/30">
                    {ev.category}
                  </span>
                ) : null}
              </div>
              <DialogDescription className="text-slate-400">{artists.length ? artists.join(" · ") : "Event details"}</DialogDescription>
            </DialogHeader>
            <dl className="grid gap-3 text-sm">
              <Detail icon={<CalendarDays className="h-4 w-4 text-[#00F5D4]" />} label="Date & time" value={when} />
              <Detail icon={<Music className="h-4 w-4 text-[#00F5D4]" />} label="Venue" value={ev.venue} />
              <Detail icon={<MapPin className="h-4 w-4 text-[#00F5D4]" />} label="Location" value={location || null} />
              <Detail icon={<Ticket className="h-4 w-4 text-[#00F5D4]" />} label="Price" value={price} />
              <Detail icon={<Tag className="h-4 w-4 text-[#00F5D4]" />} label="Category" value={ev.category} />
            </dl>
            {ev.url ? (
              <a
                href={ev.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-lg bg-[#00F5D4] px-4 py-3 text-sm font-bold text-[#02060B] shadow-[0_0_20px_rgba(0,245,212,0.4)] hover:bg-[#2effdf] hover:shadow-[0_0_28px_rgba(0,245,212,0.65)] transition-all"
              >
                Get tickets
              </a>
            ) : (
              <p className="text-sm text-slate-400">No ticket link was provided for this event.</p>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="mt-0.5">{icon}</span>
      <div>
        <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
        <dd className="font-medium text-slate-100">{value}</dd>
      </div>
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

function parseSentence(s: string) {
  let text = s.trim().replace(/[.!?]+$/, "");
  let startDate = "";
  let endDate = "";

  if (/\b(this weekend|the weekend|weekend)\b/i.test(text)) {
    const wk = getWeekendDates();
    startDate = wk.start;
    endDate = wk.end;
    text = text.replace(/\b(this weekend|the weekend|weekend)\b/gi, "").trim();
  } else if (/\b(tonight|today)\b/i.test(text)) {
    startDate = todayStr();
    endDate = todayStr();
    text = text.replace(/\b(tonight|today)\b/gi, "").trim();
  } else if (/\b(tomorrow)\b/i.test(text)) {
    startDate = addDaysStr(1);
    endDate = addDaysStr(1);
    text = text.replace(/\b(tomorrow)\b/gi, "").trim();
  } else if (/\b(next 5 days|next five days|5 days)\b/i.test(text)) {
    startDate = todayStr();
    endDate = addDaysStr(5);
    text = text.replace(/\b(next 5 days|next five days|5 days)\b/gi, "").trim();
  } else if (/\b(this week)\b/i.test(text)) {
    startDate = todayStr();
    endDate = addDaysStr(7);
    text = text.replace(/\b(this week)\b/gi, "").trim();
  }

  text = text.replace(/^(search\s+for|search|find|show\s+me|look\s+for|get|i\s+want)\s+/i, "");

  const inMatch = text.match(/\s+(?:in|near)\s+([^,]+(?:,\s*[a-zA-Z]{2})?)$/i);
  let city = "";
  let keyword = text;
  if (inMatch && inMatch[1]) {
    city = inMatch[1].trim();
    keyword = text.slice(0, inMatch.index).trim();
  } else {
    const knownCities = [
      "Montréal",
      "Montreal",
      "New York",
      "Toronto",
      "Vancouver",
      "Chicago",
      "Boston",
      "Los Angeles",
      "Austin",
      "Seattle",
      "San Francisco",
      "London",
    ];
    for (const c of knownCities) {
      const reg = new RegExp(`\\b${c}\\b`, "i");
      if (reg.test(text)) {
        city = c;
        keyword = text.replace(reg, "").trim();
        break;
      }
    }
  }

  if (/^montreal$/i.test(city)) {
    city = "Montreal";
  }

  keyword = keyword.replace(/\b(shows?|concerts?|gigs?|live\s+music|live|events?)\b/gi, "").trim();
  keyword = keyword.replace(/-ish\b/gi, "");
  keyword = keyword.replace(/\s+/g, " ").trim();

  return { keyword: keyword || text, city, startDate, endDate };
}

function Index() {
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [events, setEvents] = useState<ConcertEvent[] | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ConcertEvent | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [prefs, setPrefs] = useState("");
  const [picks, setPicks] = useState<Recommendation[] | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const recommend = useServerFn(recommendShows);

  const dateError = startDate && endDate && endDate < startDate ? "End date must be on or after the start date." : null;

  async function fetchPage(p: number, kw = keyword, c = city, sDate = startDate, eDate = endDate) {
    const body: Record<string, unknown> = { keyword: kw, city: c, size: PAGE_SIZE, page: p };
    if (sDate) body["startDateTime"] = `${sDate}T00:00:00Z`;
    if (eDate) body["endDateTime"] = `${eDate}T23:59:59Z`;
    const { data, error: fnError } = await supabase.functions.invoke("search-concerts", { body });
    if (fnError) throw fnError;
    return {
      list: (Array.isArray(data?.events) ? data.events : []) as ConcertEvent[],
      totalPages: Number(data?.pagination?.totalPages ?? 0),
    };
  }

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    if (dateError) return;
    setLoading(true);
    setError(null);
    setPicks(null);
    setRecError(null);
    try {
      const res = await fetchPage(0);
      setEvents([...res.list].sort((a, b) => ts(a) - ts(b)));
      setPage(0);
      setTotalPages(res.totalPages);
    } catch {
      setEvents(null);
      setError("We couldn't load shows right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onLoadMore() {
    setLoadingMore(true);
    setError(null);
    try {
      const next = page + 1;
      const res = await fetchPage(next);
      setEvents((prev) => {
        const seen = new Set((prev ?? []).map((e) => e.id));
        const merged = [...(prev ?? []), ...res.list.filter((e) => !e.id || !seen.has(e.id))];
        return merged.sort((a, b) => ts(a) - ts(b));
      });
      setPage(next);
      setTotalPages(res.totalPages);
    } catch {
      setError("We couldn't load shows right now. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function executeAiSearch(queryText: string) {
    const query = queryText.trim();
    if (!query) return;
    setRecLoading(true);
    setRecError(null);
    setError(null);

    const parsed = parseSentence(query);
    const searchKeyword = parsed.keyword || keyword || query;
    const searchCity = parsed.city || city || "Montréal";
    const searchStartDate = parsed.startDate || startDate;
    const searchEndDate = parsed.endDate || endDate;

    // Populate editable filter form directly below for user inspection and editing
    setKeyword(searchKeyword);
    setCity(searchCity);
    if (searchStartDate) setStartDate(searchStartDate);
    if (searchEndDate) setEndDate(searchEndDate);

    try {
      const res = await fetchPage(0, searchKeyword, searchCity, searchStartDate, searchEndDate);
      const sortedEvents = [...res.list].sort((a, b) => ts(a) - ts(b));
      setEvents(sortedEvents);
      setPage(0);
      setTotalPages(res.totalPages);

      if (sortedEvents.length > 0) {
        try {
          const payload = sortedEvents
            .filter((ev) => ev.id)
            .slice(0, 100)
            .map((ev) => ({
              id: ev.id!,
              name: ev.name ?? null,
              artist: artistList(ev),
              date: ev.date ?? null,
              venue: ev.venue ?? null,
              city: ev.city ?? null,
              category: ev.category ?? null,
            }));
          const recRes = await recommend({ data: { preferences: query, events: payload } });
          setPicks(recRes.picks);
          if (recRes.error) {
            setRecError("We are experiencing technical issues with our advanced search. Please use filtered search above.");
          }
        } catch {
          setRecError("We are experiencing technical issues with our advanced search. Please use filtered search above.");
        }
      } else {
        setPicks([]);
      }
    } catch {
      setEvents(null);
      setError("We couldn't load shows right now. Please try again.");
    } finally {
      setRecLoading(false);
    }
  }

  function onAiSentenceSearch(e: FormEvent) {
    e.preventDefault();
    executeAiSearch(prefs);
  }

  const byId = useMemo(() => new Map((events ?? []).map((e) => [e.id, e])), [events]);
  const hasMore = events !== null && page + 1 < totalPages;

  const activeFilters = useMemo(
    () =>
      [
        keyword ? `Genre: ${keyword}` : null,
        city ? `City: ${city}` : null,
        startDate || endDate ? `Dates: ${startDate || "Any"} → ${endDate || "Any"}` : null,
      ].filter(Boolean) as string[],
    [keyword, city, startDate, endDate],
  );
  const activeFilterSummary = activeFilters.join(" · ");

  return (
    <main className="min-h-screen bg-[#040407] text-[#F8FAFC]" style={{ background: "var(--gradient-stage)" }}>
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF2E93]/35 bg-[#FF2E93]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#FF4FA3] shadow-[0_0_15px_rgba(255,46,147,0.18)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF2E93] animate-pulse" />
            Live music, near you
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">Find your next show</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300 sm:mt-4 sm:text-base">
            Search live concerts by music genre, city and dates, with AI picks that match your taste. Real Ticketmaster listings.
          </p>
        </header>

        {/* 1. FEELING CHEEKY & AI SENTENCE SEARCH (MOVED TO TOP ABOVE KEYWORD BLOCK) */}
        <div className="mt-8 text-center sm:mt-10">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-[#FF4FA3]">Feeling cheeky?</span> Search by a sentence.{" "}
            <span className="text-slate-400">
              eg{" "}
              <button
                type="button"
                onClick={() => {
                  const q = "Punk-ish rock in Montréal this weekend";
                  setPrefs(q);
                  executeAiSearch(q);
                }}
                className="text-[#00F5D4] underline-offset-4 hover:underline cursor-pointer transition-colors hover:text-[#2effdf]"
              >
                Punk-ish rock in Montréal this weekend
              </button>
              {" · "}
              <button
                type="button"
                onClick={() => {
                  const q = "Search punk shows in New York.";
                  setPrefs(q);
                  executeAiSearch(q);
                }}
                className="text-[#00F5D4] underline-offset-4 hover:underline cursor-pointer transition-colors hover:text-[#2effdf]"
              >
                Search punk shows in New York.
              </button>
            </span>
          </p>
        </div>

        <section className="mt-4 rounded-3xl border border-[#FF2E93]/35 bg-[#090C14]/85 p-5 backdrop-blur-xl sm:p-6 shadow-[0_0_35px_rgba(255,46,147,0.12)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Sparkles className="h-5 w-5 text-[#FF2E93]" aria-hidden /> AI Sentence Search
            </h2>
            <span className="rounded-full border border-[#FF2E93]/30 bg-[#FF2E93]/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase text-[#FF65A8]">
              Natural Language
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Type any sentence or describe your musical vibe. AI will extract filters and search Ticketmaster Discovery for real events.
          </p>
          <form onSubmit={onAiSentenceSearch} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Label htmlFor="prefs" className="sr-only">Your music search sentence</Label>
            <Input
              id="prefs"
              value={prefs}
              onChange={(e) => setPrefs(e.target.value)}
              maxLength={500}
              placeholder="“Punk-ish rock in Montréal this weekend”"
              className="h-12 flex-1 border-white/10 bg-[#060810] text-white placeholder:text-slate-500 focus-visible:border-[#00F5D4] focus-visible:ring-[#00F5D4] text-sm"
            />
            <Button
              type="submit"
              disabled={recLoading || !prefs.trim()}
              className="h-12 w-full sm:w-auto px-7 bg-[#00F5D4] text-[#02060B] hover:bg-[#2effdf] font-bold shadow-[0_0_18px_rgba(0,245,212,0.35)] hover:shadow-[0_0_26px_rgba(0,245,212,0.6)] cursor-pointer active:scale-[0.98] transition-all"
            >
              {recLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#02060B]" />
                  Searching…
                </>
              ) : (
                "Search with AI"
              )}
            </Button>
          </form>
          {recError ? (
            <p className="mt-3 text-sm text-[#FF65A8] border border-[#FF2E93]/30 bg-[#FF2E93]/10 rounded-lg p-2.5">
              {recError}
            </p>
          ) : null}
        </section>

        {/* 2. COLLAPSIBLE EDITABLE FILTERS - COLLAPSED BY DEFAULT */}
        <section
          className="mt-6 rounded-3xl border border-white/10 bg-[#090C14]/85 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-300"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          <button
            type="button"
            onClick={() => setFiltersOpen((prev) => !prev)}
            aria-expanded={filtersOpen}
            aria-controls="filter-panel"
            className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-white/[0.04] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#00F5D4] group-hover:border-[#00F5D4]/40 transition-colors">
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-[#00F5D4] transition-colors">
                  Filter by Genre, City and Date Range
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {filtersOpen
                    ? "Adjust search parameters or select specific dates"
                    : activeFilterSummary || "Click to expand manual filters"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeFilters.length > 0 && !filtersOpen ? (
                <span className="rounded-full bg-[#00F5D4]/15 border border-[#00F5D4]/30 px-2.5 py-0.5 text-xs font-semibold text-[#00F5D4]">
                  {activeFilters.length} active
                </span>
              ) : null}
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 group-hover:text-white group-hover:border-white/20 transition-all">
                {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            </div>
          </button>

          {filtersOpen ? (
            <form id="filter-panel" onSubmit={onSearch} className="border-t border-white/10 p-4 sm:p-6 grid gap-4">
              <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 gap-2">
                <p className="text-xs text-slate-400">
                  Editable filters — tweak or refine your search anytime.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate(todayStr());
                      setEndDate(addDaysStr(5));
                    }}
                    className="text-xs font-semibold text-[#00F5D4] hover:text-[#2effdf] hover:underline cursor-pointer transition-colors"
                  >
                    + Next 5 days
                  </button>
                  {(startDate || endDate) ? (
                    <button
                      type="button"
                      onClick={() => { setStartDate(""); setEndDate(""); }}
                      className="text-xs text-slate-400 hover:text-white hover:underline cursor-pointer"
                    >
                      Clear dates
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="keyword" className="text-sm font-medium text-slate-200">Music keyword</Label>
                  <Input
                    id="keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g. punk, jazz, rock…"
                    className="h-12 border-white/10 bg-[#060810] text-white placeholder:text-slate-500 focus-visible:border-[#00F5D4] focus-visible:ring-[#00F5D4]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium text-slate-200">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Montréal, New York…"
                    className="h-12 border-white/10 bg-[#060810] text-white placeholder:text-slate-500 focus-visible:border-[#00F5D4] focus-visible:ring-[#00F5D4]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm font-medium text-slate-200">From (optional)</Label>
                  <Input
                    id="startDate"
                    type="date"
                    min={todayStr()}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-12 border-white/10 bg-[#060810] text-white placeholder:text-slate-500 focus-visible:border-[#00F5D4] focus-visible:ring-[#00F5D4]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm font-medium text-slate-200">To (optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    min={startDate || todayStr()}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-12 border-white/10 bg-[#060810] text-white placeholder:text-slate-500 focus-visible:border-[#00F5D4] focus-visible:ring-[#00F5D4]"
                  />
                </div>
              </div>
              {dateError ? <p className="text-sm text-destructive">{dateError}</p> : null}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || !!dateError}
                  className="h-12 w-full text-base font-bold sm:w-auto sm:px-10 bg-[#00F5D4] text-[#02060B] hover:bg-[#2effdf] shadow-[0_0_24px_rgba(0,245,212,0.45)] hover:shadow-[0_0_36px_rgba(0,245,212,0.7)] transition-all duration-200 border-none active:scale-[0.98] cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#02060B]" /> Searching…
                    </>
                  ) : (
                    "Find shows"
                  )}
                </Button>
              </div>
            </form>
          ) : null}
        </section>

        {/* 3. AI HANDPICKED MATCHES (WHEN AVAILABLE) */}
        {picks && picks.length > 0 ? (
          <section className="mt-8 rounded-3xl border border-[#FF2E93]/35 bg-[#090C14]/85 p-5 backdrop-blur-xl sm:p-6 shadow-[0_0_35px_rgba(255,46,147,0.12)]">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#FF65A8]">AI Handpicked Matches</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {picks.map((p) => {
                const ev = byId.get(p.id);
                return ev ? <EventCard key={p.id} ev={ev} reason={p.reason} onOpen={() => setSelected(ev)} /> : null;
              })}
            </div>
          </section>
        ) : null}

        {/* 4. MAIN RESULTS SECTION */}
        <section className="mt-10" aria-live="polite">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl border border-white/10 bg-[#0A0C13]/60" />
              ))}
            </div>
          ) : error && !events ? (
            <div className="mx-auto max-w-md rounded-2xl border border-destructive/40 bg-[#0A0C13] p-8 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-destructive" aria-hidden />
              <h2 className="mt-3 text-lg font-semibold text-white">We couldn't load shows</h2>
              <p className="mt-2 text-sm text-slate-400">We couldn't load shows right now. Please try again.</p>
            </div>
          ) : events && events.length === 0 ? (
            <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#0A0C13] p-8 text-center">
              <SearchX className="mx-auto h-8 w-8 text-slate-400" aria-hidden />
              <h2 className="mt-3 text-lg font-semibold text-white">No shows found</h2>
              <p className="mt-2 text-sm text-slate-400">No Ticketmaster shows matched these filters. Try a wider date range or another genre.</p>
            </div>
          ) : events ? (
            <>
              <p className="mb-5 text-sm text-slate-400">
                Showing {events.length} show{events.length === 1 ? "" : "s"}, soonest first
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((ev, i) => (
                  <EventCard key={ev.id ?? i} ev={ev} onOpen={() => setSelected(ev)} />
                ))}
              </div>
              {error ? <p className="mt-6 text-center text-sm text-destructive">{error}</p> : null}
              {hasMore ? (
                <div className="mt-8 flex justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={onLoadMore}
                    disabled={loadingMore}
                    className="w-full sm:w-auto sm:px-10 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-200 cursor-pointer"
                  >
                    {loadingMore ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin text-[#00F5D4]" /> Loading…</>) : "Load more shows"}
                  </Button>
                </div>
              ) : (
                <p className="mt-8 text-center text-sm text-slate-400">That's every show for this search.</p>
              )}
            </>
          ) : null}
        </section>

        <footer className="mt-14 text-center text-xs text-slate-500 space-y-1">
          <p className="text-slate-400 font-medium">Event listings from Ticketmaster</p>
          <p>Event data provided by Ticketmaster Discovery API. Listings may not include every local show. AI picks are suggestions only.</p>
        </footer>
      </div>
      <DetailsDialog ev={selected} onClose={() => setSelected(null)} />
      <BackToTop />
    </main>
  );
}
