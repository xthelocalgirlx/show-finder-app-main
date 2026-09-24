import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Show = {
  id: string;
  artist: string;
  genre: string;
  venue: string;
  venueCity?: string;
  date: string; // YYYY-MM-DD
  time: string | null;
  price: string | null;
  url: string;
  image: string | null;
};

function range(when?: string) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (when === "Tonight") {
    end.setHours(23, 59, 59);
  } else if (when === "This weekend") {
    const day = now.getDay(); // 0 Sun
    const toFri = (5 - day + 7) % 7;
    if (day !== 0 && day !== 6 && day !== 5) {
      start.setDate(now.getDate() + toFri);
      start.setHours(0, 0, 0);
    }
    end.setTime(start.getTime());
    end.setDate(start.getDate() + (day === 6 ? 1 : day === 0 ? 0 : 2));
    end.setHours(23, 59, 59);
  } else if (when === "Next 5 days") {
    end.setDate(now.getDate() + 5);
  } else if (when === "All upcoming") {
    end.setDate(now.getDate() + 180);
  } else {
    end.setDate(now.getDate() + 30);
  }
  const fmt = (d: Date) => d.toISOString().slice(0, 19) + "Z";
  return { start: fmt(start), end: fmt(end) };
}

export const getShows = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        when: z
          .enum(["Tonight", "This weekend", "Next 5 days", "This month", "All upcoming"])
          .optional()
          .default("This weekend"),
        keyword: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        city: z.string().max(80).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        page: z.number().optional().default(0),
        size: z.number().optional().default(20),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }): Promise<Show[]> => {
    const apiKey = process.env["TICKETMASTER_API_KEY"] || "Oap0ZNAQFZAfNywoyOaZLNY89DrwCnKn";
    if (!apiKey) throw new Error("Missing TICKETMASTER_API_KEY");
    const { start, end } = range(data.when);
    const p = new URLSearchParams({
      apikey: apiKey,
      classificationName: "music",
      startDateTime: data.startDate ? `${data.startDate}T00:00:00Z` : start,
      endDateTime: data.endDate ? `${data.endDate}T23:59:59Z` : end,
      sort: "date,asc",
      page: String(data.page ?? 0),
      size: String(data.size ?? 20),
    });
    if (data.keyword?.trim()) {
      p.set("keyword", data.keyword.trim());
    }
    if (data.city?.trim()) {
      const normCity = data.city.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      p.set("city", normCity);
    } else if (data.lat != null && data.lng != null) {
      p.set("latlong", `${data.lat},${data.lng}`);
      p.set("radius", "50");
      p.set("unit", "km");
    }
    const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${p}`);
    if (!res.ok) throw new Error(`Ticketmaster error [${res.status}]: ${await res.text()}`);
    const json = await res.json();
    const events: any[] = json?._embedded?.events ?? [];
    
    // Deduplicate by event id
    const seen = new Set<string>();
    const uniqueEvents = events.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    return uniqueEvents.map((e) => {
      const attraction = e._embedded?.attractions?.[0];
      const imgs: any[] = attraction?.images?.length ? attraction.images : e.images ?? [];
      const img =
        imgs.find((i) => (i.ratio === "16_9" || i.ratio === "4_3" || i.ratio === "1_1") && i.width >= 300) ??
        imgs[0];
      const pr = e.priceRanges?.[0];
      const venueObj = e._embedded?.venues?.[0];
      const venueName = venueObj?.name ?? "";
      const venueCity = venueObj?.city?.name ?? "";
      return {
        id: e.id,
        artist: attraction?.name ?? e.name,
        genre: e.classifications?.[0]?.genre?.name ?? "Live music",
        venue: venueName,
        venueCity: venueCity,
        date: e.dates?.start?.localDate ?? "",
        time: e.dates?.start?.localTime ?? null,
        price: pr ? `${pr.currency === "USD" ? "$" : pr.currency + " "}${Math.round(pr.min)}` : null,
        url: e.url,
        image: img?.url ?? null,
      };
    });
  });
