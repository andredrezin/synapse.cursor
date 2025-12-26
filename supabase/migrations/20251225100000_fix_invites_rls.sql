-- Allow users to view their own invites
CREATE POLICY "Users can view their own invites" ON public.team_invites
  FOR SELECT USING (email = auth.jwt() ->> 'email');

-- Allow users to accept their own invites
CREATE POLICY "Users can accept their own invites" ON public.team_invites
  FOR UPDATE USING (email = auth.jwt() ->> 'email')
  WITH CHECK (status = 'accepted');

-- Allow users to join workspace if invited
CREATE POLICY "Users can join workspace if invited" ON public.workspace_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_invites
      WHERE workspace_id = workspace_members.workspace_id
        AND email = (auth.jwt() ->> 'email')
        AND status = 'pending'
    )
  );
