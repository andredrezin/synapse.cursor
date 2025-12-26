-- Migration: Fix Profile Visibility
-- Created at: 2025-12-25 12:00:00

-- Drop existing restricted policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Add new policy to allow viewing profiles of people in the same workspace
CREATE POLICY "Users can view profiles of workspace members"
ON public.profiles FOR SELECT
USING (
    auth.uid() = user_id -- Own profile
    OR EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id IN (
            SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        )
        AND wm.user_id = public.profiles.user_id
    )
);

-- Add foreign key from workspace_members to profiles via user_id to facilitate joins
-- First check if it exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'workspace_members_user_id_profiles_fkey'
        AND table_name = 'workspace_members'
    ) THEN
        ALTER TABLE "public"."workspace_members"
        ADD CONSTRAINT "workspace_members_user_id_profiles_fkey"
        FOREIGN KEY ("user_id")
        REFERENCES "public"."profiles" ("user_id")
        ON DELETE CASCADE;
    END IF;
END $$;

-- Grant access to the profiles table for authenticated users
GRANT SELECT ON public.profiles TO authenticated;
