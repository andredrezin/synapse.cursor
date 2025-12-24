-- Create enum types
CREATE TYPE lead_temperature AS ENUM ('cold', 'warm', 'hot');
CREATE TYPE lead_status AS ENUM ('new', 'in_progress', 'converted', 'lost');
CREATE TYPE lead_source AS ENUM ('ads', 'organic', 'referral', 'landing', 'direct', 'pixel');
CREATE TYPE sentiment_type AS ENUM ('positive', 'neutral', 'negative');
CREATE TYPE conversation_status AS ENUM ('open', 'closed', 'pending');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');

-- LEADS TABLE
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  source lead_source NOT NULL DEFAULT 'direct',
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  temperature lead_temperature NOT NULL DEFAULT 'cold',
  status lead_status NOT NULL DEFAULT 'new',
  sentiment sentiment_type DEFAULT 'neutral',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  response_time_avg INTEGER DEFAULT 0, -- in seconds
  messages_count INTEGER DEFAULT 0,
  objections TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CONVERSATIONS TABLE
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status conversation_status NOT NULL DEFAULT 'open',
  sentiment sentiment_type DEFAULT 'neutral',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  messages_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MESSAGES TABLE
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('lead', 'agent', 'system')),
  sender_id UUID,
  content TEXT NOT NULL,
  sentiment sentiment_type,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- TRACKING PIXELS TABLE
CREATE TABLE public.tracking_pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  is_active BOOLEAN DEFAULT true,
  events_count INTEGER DEFAULT 0,
  last_event_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- PIXEL EVENTS TABLE
CREATE TABLE public.pixel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pixel_id UUID NOT NULL REFERENCES public.tracking_pixels(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  page_url TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  user_agent TEXT,
  ip_address TEXT,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- TEAM INVITES TABLE
CREATE TABLE public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status invite_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, email)
);

-- WORKSPACE SETTINGS TABLE
CREATE TABLE public.workspace_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email_alerts BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  daily_report BOOLEAN DEFAULT true,
  weekly_report BOOLEAN DEFAULT false,
  whatsapp_connected BOOLEAN DEFAULT false,
  whatsapp_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create helper function to check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
  )
$$;

-- RLS Policies for LEADS
CREATE POLICY "Workspace members can view leads" ON public.leads
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can create leads" ON public.leads
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can update leads" ON public.leads
  FOR UPDATE USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace admins can delete leads" ON public.leads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = leads.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for CONVERSATIONS
CREATE POLICY "Workspace members can view conversations" ON public.conversations
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can update conversations" ON public.conversations
  FOR UPDATE USING (is_workspace_member(workspace_id));

-- RLS Policies for MESSAGES
CREATE POLICY "Workspace members can view messages" ON public.messages
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can create messages" ON public.messages
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

-- RLS Policies for TRACKING PIXELS
CREATE POLICY "Workspace members can view pixels" ON public.tracking_pixels
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can create pixels" ON public.tracking_pixels
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can update pixels" ON public.tracking_pixels
  FOR UPDATE USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace admins can delete pixels" ON public.tracking_pixels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = tracking_pixels.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for PIXEL EVENTS (read-only for workspace members)
CREATE POLICY "Workspace members can view pixel events" ON public.pixel_events
  FOR SELECT USING (is_workspace_member(workspace_id));

-- Allow public inserts for pixel tracking (will be handled by edge function)
CREATE POLICY "Public can insert pixel events" ON public.pixel_events
  FOR INSERT WITH CHECK (true);

-- RLS Policies for TEAM INVITES
CREATE POLICY "Workspace admins can view invites" ON public.team_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = team_invites.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Workspace admins can create invites" ON public.team_invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = team_invites.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Workspace admins can update invites" ON public.team_invites
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = team_invites.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Workspace admins can delete invites" ON public.team_invites
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = team_invites.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for WORKSPACE SETTINGS
CREATE POLICY "Workspace members can view settings" ON public.workspace_settings
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace admins can update settings" ON public.workspace_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspace_settings.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Workspace admins can insert settings" ON public.workspace_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspace_settings.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for NOTIFICATIONS
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR (user_id IS NULL AND is_workspace_member(workspace_id))
  );

CREATE POLICY "Workspace members can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR (user_id IS NULL AND is_workspace_member(workspace_id))
  );

-- Create indexes for better performance
CREATE INDEX idx_leads_workspace ON public.leads(workspace_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_temperature ON public.leads(temperature);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_conversations_workspace ON public.conversations(workspace_id);
CREATE INDEX idx_conversations_lead ON public.conversations(lead_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_pixel_events_pixel ON public.pixel_events(pixel_id);
CREATE INDEX idx_pixel_events_created ON public.pixel_events(created_at);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_workspace ON public.notifications(workspace_id);

-- Triggers for updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tracking_pixels_updated_at
  BEFORE UPDATE ON public.tracking_pixels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_settings_updated_at
  BEFORE UPDATE ON public.workspace_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;