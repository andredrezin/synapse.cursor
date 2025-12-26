-- Migration: Add Response Delay Settings to AI Settings
-- Created at: 2025-12-25 12:10:00

ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS response_delay_min INTEGER DEFAULT 5, -- seconds
ADD COLUMN IF NOT EXISTS response_delay_max INTEGER DEFAULT 15, -- seconds
ADD COLUMN IF NOT EXISTS humanized_typing BOOLEAN DEFAULT true;

-- Update existing settings to these defaults
UPDATE public.ai_settings 
SET 
  response_delay_min = 5,
  response_delay_max = 15,
  humanized_typing = true
WHERE response_delay_min IS NULL;
