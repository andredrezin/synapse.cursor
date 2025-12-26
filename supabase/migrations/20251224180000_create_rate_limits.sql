-- Create rate_limits table for tracking API rate limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- user_id or IP address
  function_name TEXT NOT NULL, -- name of the edge function
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(identifier, function_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_function 
ON public.rate_limits(identifier, function_name);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at 
ON public.rate_limits(reset_at);

-- Enable RLS (but allow service role to access)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access (Edge Functions use service role)
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits FOR ALL
USING (auth.role() = 'service_role');

-- Function to clean up old rate limit records (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE reset_at < now() - INTERVAL '24 hours';
END;
$$;

-- Create a scheduled job to clean up old records (if pg_cron is available)
-- This is optional and requires pg_cron extension
-- SELECT cron.schedule('cleanup-rate-limits', '0 2 * * *', 'SELECT public.cleanup_old_rate_limits()');


