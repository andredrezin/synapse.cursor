-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace admins can manage members" ON public.workspace_members;

-- Drop and recreate the workspaces policy that depends on workspace_members
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;

-- Create a security definer function to check workspace membership without recursion
CREATE OR REPLACE FUNCTION public.check_workspace_membership(ws_id uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id AND user_id = uid
  );
$$;

-- Create a function to check if user is workspace admin
CREATE OR REPLACE FUNCTION public.is_workspace_admin(ws_id uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id 
    AND user_id = uid 
    AND role IN ('owner', 'admin')
  );
$$;

-- Recreate workspace_members policies using the security definer functions
CREATE POLICY "Users can view members of their workspaces"
ON public.workspace_members
FOR SELECT
USING (check_workspace_membership(workspace_id, auth.uid()));

CREATE POLICY "Workspace admins can manage members"
ON public.workspace_members
FOR ALL
USING (is_workspace_admin(workspace_id, auth.uid()));

-- Recreate workspaces SELECT policy
CREATE POLICY "Users can view workspaces they are members of"
ON public.workspaces
FOR SELECT
USING (check_workspace_membership(id, auth.uid()));

-- Update the is_workspace_member function to use the new approach
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
$$;