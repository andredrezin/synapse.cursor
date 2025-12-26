-- Migration: Gamification and Seller Ranking
-- Created at: 2025-12-25 11:00:00

-- Table for monthly seller performance snapshots
CREATE TABLE IF NOT EXISTS public.seller_performances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- Format: YYYY-MM
    total_leads INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0, -- in seconds
    points INTEGER DEFAULT 0,
    rank_position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(workspace_id, profile_id, month_year)
);

-- Table for seller achievements/badges
CREATE TABLE IF NOT EXISTS public.seller_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.seller_performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_badges ENABLE ROW LEVEL SECURITY;

-- Policies for seller_performances
CREATE POLICY "Users can view ranking for their workspace"
    ON public.seller_performances FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = seller_performances.workspace_id
            AND profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
    );

-- Policies for seller_badges
CREATE POLICY "Users can view badges for their workspace"
    ON public.seller_badges FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = seller_badges.workspace_id
            AND profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
    );

-- Function to calculate points dynamically (can be used in views or edge functions)
CREATE OR REPLACE FUNCTION public.calculate_seller_points(
    p_conversions INTEGER,
    p_avg_response_time INTEGER,
    p_total_leads INTEGER
) RETURNS INTEGER AS $$
DECLARE
    points INTEGER := 0;
BEGIN
    -- 100 points per conversion
    points := points + (p_conversions * 100);
    
    -- Bonus for low response time (under 5 mins = 300s)
    IF p_avg_response_time > 0 AND p_avg_response_time < 300 THEN
        points := points + 50;
    END IF;
    
    -- Consistency points (leads handled)
    points := points + (p_total_leads * 5);
    
    RETURN points;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update updated_at
CREATE TRIGGER update_seller_performances_updated_at
    BEFORE UPDATE ON public.seller_performances
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- View for dynamic ranking (Current Month)
CREATE OR REPLACE VIEW public.v_seller_ranking AS
WITH seller_metrics AS (
    SELECT 
        l.workspace_id,
        l.assigned_to as profile_id,
        p.full_name,
        p.avatar_url,
        COUNT(l.id) as total_leads,
        COUNT(CASE WHEN l.status = 'converted' THEN 1 END) as conversions,
        COALESCE(AVG(l.response_time_avg), 0) as avg_response_time,
        to_char(l.created_at, 'YYYY-MM') as month_year
    FROM public.leads l
    JOIN public.profiles p ON l.assigned_to = p.id
    WHERE l.assigned_to IS NOT NULL
    GROUP BY l.workspace_id, l.assigned_to, p.full_name, p.avatar_url, to_char(l.created_at, 'YYYY-MM')
)
SELECT 
    *,
    calculate_seller_points(conversions::integer, avg_response_time::integer, total_leads::integer) as points,
    RANK() OVER (PARTITION BY workspace_id, month_year ORDER BY calculate_seller_points(conversions::integer, avg_response_time::integer, total_leads::integer) DESC) as rank_position
FROM seller_metrics;

-- Grants
GRANT SELECT ON public.v_seller_ranking TO authenticated;
GRANT SELECT ON public.v_seller_ranking TO service_role;
