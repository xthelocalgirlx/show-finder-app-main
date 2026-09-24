import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Show = {
  id: string;
  artist: string;
  genre: string;
  venue: string;
  date: string; // YYYY-MM-DD
  time: string | null;
  price: string | null;
  url: string;
  image: string | null;
};

function range(when: string) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (when === "Tonight") {
    end.setHours(23, 59, 59);
  } else if (when === "This weekend") {
    const day = now.getDay(); // 0 Sun
    const toFri = (5 - day + 7) % 7;
    if (day !== 0 && day !== 6) start.setDate(now.getDate() + toFri);
    start.setHours(day === 0 || day === 6 ? now.getHours() : 0, 0, 0);
    end.setTime(start.getTime());
    end.setDate(start.getDate() + (day === 6 ? 1 : day === 0 ? 0 : 2));
    end.setHours(23, 59, 59);
  } else if (when === "Next 5 days") {
    end.setDate(now.getDate() + 5);
  } else {
    end.setDate(now.getDate() + 30);
  }
  const fmt = (d: Date) => d.toISOString().slice(0, 19) + "Z";
  return { start: fmt(start), end: fmt(end) };
}

export const getShows = createServerFn({ method: "GET" })
  .validator((d) =>
    z
      .object({
        when: z.enum(["Tonight", "This weekend", "Next 5 days", "This month"]).optional().default("This weekend"),
        keyword: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        city: z.string().max(80).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
      .parse(d),
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
      sort: "relevance,desc",
      size: "12",
    });
    if (data.keyword?.trim()) {
      p.set("keyword", data.keyword.trim());
    }
    if (data.lat != null && data.lng != null && !data.city) {
      p.set("latlong", `${data.lat},${data.lng}`);
      p.set("radius", "40");
      p.set("unit", "km");
    } else if (data.city) {
      p.set("city", data.city);
    }
    const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${p}`);
    if (!res.ok) throw new Error(`Ticketmaster error [${res.status}]: ${await res.text()}`);
    const json = await res.json();
    const events: any[] = json?._embedded?.events ?? [];
    return events.map((e) => {
      const attraction = e._embedded?.attractions?.[0];
      const imgs: any[] = attraction?.images?.length ? attraction.images : e.images ?? [];
      const img =
        imgs.filter((i) => i.ratio === "1_1" || i.ratio === "4_3").sort((a, b) => a.width - b.width)
          .find((i) => i.width >= 200) ?? imgs[0];
      const pr = e.priceRanges?.[0];
      return {
        id: e.id,
        artist: attraction?.name ?? e.name,
        genre: e.classifications?.[0]?.genre?.name ?? "Live music",
        venue: e._embedded?.venues?.[0]?.name ?? "",
        date: e.dates?.start?.localDate ?? "",
        time: e.dates?.start?.localTime ?? null,
        price: pr ? `${pr.currency === "USD" ? "$" : pr.currency + " "}${Math.round(pr.min)}` : null,
        url: e.url,
        image: img?.url ?? null,
      };
    });
  });
