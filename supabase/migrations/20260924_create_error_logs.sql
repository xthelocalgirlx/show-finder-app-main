-- Create error_logs table for client and server error reporting
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  level text NOT NULL DEFAULT 'ERROR',
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Allow public and client-side logging (insert only)
CREATE POLICY "Allow public insert to error_logs"
  ON public.error_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow reading logs for authenticated users
CREATE POLICY "Allow read error_logs"
  ON public.error_logs
  FOR SELECT
  TO authenticated
  USING (true);
