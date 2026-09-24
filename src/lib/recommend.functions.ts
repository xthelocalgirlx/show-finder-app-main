import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  preferences: z.string().min(1).max(1000),
  events: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().nullable(),
        artist: z.array(z.string()).nullable(),
        date: z.string().nullable(),
        venue: z.string().nullable(),
        city: z.string().nullable(),
        category: z.string().nullable(),
      }),
    )
    .max(100),
});

export type Recommendation = { id: string; reason: string };

export const recommendShows = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<{ picks: Recommendation[]; error?: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!data.events.length) return { picks: [] };

    // When LOVABLE_API_KEY is not configured or in local development, use smart heuristic matching
    if (!key) {
      const prefWords = data.preferences
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !["the", "and", "for", "shows", "concerts", "gigs", "show", "find", "search", "with"].includes(w));

      const scored = data.events.map((ev) => {
        let score = 0;
        const name = (ev.name || "").toLowerCase();
        const artist = (ev.artist || []).join(" ").toLowerCase();
        const cat = (ev.category || "").toLowerCase();
        const venue = (ev.venue || "").toLowerCase();
        const city = (ev.city || "").toLowerCase();

        for (const word of prefWords) {
          if (name.includes(word)) score += 4;
          if (artist.includes(word)) score += 5;
          if (cat.includes(word)) score += 3;
          if (venue.includes(word)) score += 1;
          if (city.includes(word)) score += 1;
        }

        return { ev, score };
      });

      scored.sort((a, b) => b.score - a.score);
      const topPicks = scored.slice(0, 5).filter((s) => s.score > 0 || scored.length <= 3);

      const picks: Recommendation[] = topPicks.map(({ ev }) => {
        const artist = ev.artist && ev.artist.length ? ev.artist[0] : ev.name;
        return {
          id: ev.id,
          reason: `Matches your search for "${data.preferences.slice(0, 35).trim()}" with ${artist}${ev.venue ? ` at ${ev.venue}` : ""}.`,
        };
      });

      return { picks };
    }

    const { streamText, Output, NoObjectGeneratedError } = await import("ai");
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { createLovableAiGatewayRunIdFetch } = await import("./ai-gateway.server");

    const runIdFetch = createLovableAiGatewayRunIdFetch();
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    const ids = new Set(data.events.map((e) => e.id));
    try {
      const result = streamText({
        model: lovable.responses("openai/gpt-6-astra"),
        output: Output.object({
          schema: z.object({
            picks: z.array(z.object({ id: z.string(), reason: z.string() })),
          }),
        }),
        system:
          "You recommend concerts. Only choose from the provided events, using their exact id. Never invent events. Pick up to 5 that best match the fan's preferences, best first. Give a one-sentence reason (under 25 words) per pick. Skip non-music events such as sports. If nothing fits, return an empty list.",
        prompt: `Fan preferences: ${data.preferences}\n\nEvents:\n${JSON.stringify(data.events)}`,
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      const out = await result.output;
      const picks = (out?.picks ?? []).filter((p) => ids.has(p.id)).slice(0, 5);
      return { picks };
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        return { picks: [], error: "The AI reply couldn't be read. Please try again." };
      }
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 429) return { picks: [], error: "Too many requests right now. Please wait a moment and try again." };
      if (status === 402) return { picks: [], error: "AI credits have run out. Add credits in workspace settings." };
      if (status === 403) return { picks: [], error: "AI recommendations are currently unavailable for this workspace." };
      console.error("recommendShows failed", err);
      return { picks: [], error: "Recommendations failed. Please try again." };
    }
  });
