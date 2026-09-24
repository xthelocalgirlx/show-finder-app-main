import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.["VITE_SUPABASE_URL"]) ||
  (typeof process !== "undefined" && process.env?.["SUPABASE_URL"]) ||
  "https://pptyeinnxxfnfxpuppwc.supabase.co";

const supabaseKey =
  (typeof import.meta !== "undefined" && import.meta.env?.["VITE_SUPABASE_PUBLISHABLE_KEY"]) ||
  (typeof process !== "undefined" && process.env?.["SUPABASE_PUBLISHABLE_KEY"]) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHllaW5ueHhmbmZ4cHVwcHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxODYyMzYsImV4cCI6MjEwNTc2MjIzNn0.CZJHbKhMIGV0aCmQEaDGgHhmHQIPuVBCqDUsHxyuDCw";

export const supabase = createClient(supabaseUrl, supabaseKey);

export type ErrorLogLevel = "INFO" | "WARN" | "ERROR" | "FATAL";

export async function logErrorToSupabase(
  level: ErrorLogLevel | string,
  message: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    const { error } = await supabase
      .from("error_logs")
      .insert([{ level, message, metadata }]);

    if (error) {
      console.error("Failed to send log to Supabase:", error);
    }
  } catch (err) {
    console.error("Unexpected error logging to Supabase:", err);
  }
}
