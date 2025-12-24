-- Create table for API health check results
CREATE TABLE public.api_health_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown',
  response_time_ms INTEGER,
  error_message TEXT,
  last_check_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_health_checks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Workspace members can view health checks"
ON public.api_health_checks FOR SELECT
USING (is_workspace_member(workspace_id));

CREATE POLICY "System can insert health checks"
ON public.api_health_checks FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update health checks"
ON public.api_health_checks FOR UPDATE
USING (true);

-- Create index for faster queries
CREATE INDEX idx_health_checks_workspace ON public.api_health_checks(workspace_id);
CREATE INDEX idx_health_checks_connection ON public.api_health_checks(connection_id);

-- Enable realtime for health checks
ALTER PUBLICATION supabase_realtime ADD TABLE public.api_health_checks;