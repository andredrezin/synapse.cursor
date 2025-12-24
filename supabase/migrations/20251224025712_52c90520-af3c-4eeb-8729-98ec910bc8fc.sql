-- Create table to store cancellation feedback
CREATE TABLE public.cancellation_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id),
  reason TEXT NOT NULL,
  additional_feedback TEXT,
  plan TEXT,
  accepted_offer BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cancellation_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
ON public.cancellation_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.cancellation_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Add index for analytics queries
CREATE INDEX idx_cancellation_feedback_reason ON public.cancellation_feedback(reason);
CREATE INDEX idx_cancellation_feedback_created_at ON public.cancellation_feedback(created_at);