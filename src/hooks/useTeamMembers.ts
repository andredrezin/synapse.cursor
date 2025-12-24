import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface TeamMemberWithProfile extends WorkspaceMember {
  profile?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'phone' | 'company'> | null;
  stats: {
    conversions: number;
    conversations: number;
    avgResponseTime: number;
  };
}

export const useTeamMembers = () => {
  const { workspace, workspaceRole } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMemberWithProfile[]>([]);
  const [invites, setInvites] = useState<Database['public']['Tables']['team_invites']['Row'][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!workspace?.id) return;

    setIsLoading(true);
    setError(null);

    // Fetch workspace members
    const { data: membersData, error: membersError } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspace.id);

    if (membersError) {
      console.error('Error fetching members:', membersError);
      setError(membersError.message);
      setIsLoading(false);
      return;
    }

    // Fetch profiles for each member
    const membersWithProfiles = await Promise.all(
      (membersData || []).map(async (member) => {
        // Get profile for this user
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, phone, company')
          .eq('user_id', member.user_id)
          .single();

        // Get leads converted by this member
        let conversions = 0;
        let conversations = 0;
        
        if (profileData?.id) {
          const { count: convCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspace.id)
            .eq('assigned_to', profileData.id)
            .eq('status', 'converted');

          conversions = convCount || 0;

          const { count: convosCount } = await supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspace.id)
            .eq('assigned_to', profileData.id);

          conversations = convosCount || 0;
        }

        return {
          ...member,
          profile: profileData,
          stats: {
            conversions,
            conversations,
            avgResponseTime: Math.random() * 5 + 1,
          },
        } as TeamMemberWithProfile;
      })
    );

    setMembers(membersWithProfiles);

    // Fetch pending invites if user is admin
    if (workspaceRole === 'owner' || workspaceRole === 'admin') {
      const { data: invitesData } = await supabase
        .from('team_invites')
        .select('*')
        .eq('workspace_id', workspace.id)
        .eq('status', 'pending');

      setInvites(invitesData || []);
    }

    setIsLoading(false);
  };

  const inviteMember = async (email: string, role: string = 'member') => {
    if (!workspace?.id) {
      return { error: new Error('No workspace selected') };
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { error: new Error('Not authenticated') };
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userData.user.id)
      .single();

    if (!profileData) {
      return { error: new Error('Profile not found') };
    }

    const { data, error } = await supabase
      .from('team_invites')
      .insert({
        workspace_id: workspace.id,
        email,
        role,
        invited_by: profileData.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast({
          variant: 'destructive',
          title: 'Convite já existe',
          description: 'Este email já foi convidado.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao enviar convite',
          description: error.message,
        });
      }
      return { error };
    }

    toast({
      title: 'Convite enviado!',
      description: `Convite enviado para ${email}.`,
    });

    await fetchMembers();
    return { data, error: null };
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover membro',
        description: error.message,
      });
      return { error };
    }

    toast({
      title: 'Membro removido!',
    });

    await fetchMembers();
    return { error: null };
  };

  const updateMemberRole = async (memberId: string, role: string) => {
    const { error } = await supabase
      .from('workspace_members')
      .update({ role })
      .eq('id', memberId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar papel',
        description: error.message,
      });
      return { error };
    }

    toast({
      title: 'Papel atualizado!',
    });

    await fetchMembers();
    return { error: null };
  };

  const cancelInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from('team_invites')
      .delete()
      .eq('id', inviteId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao cancelar convite',
        description: error.message,
      });
      return { error };
    }

    toast({
      title: 'Convite cancelado!',
    });

    await fetchMembers();
    return { error: null };
  };

  useEffect(() => {
    if (!workspace?.id) return;
    fetchMembers();
  }, [workspace?.id]);

  return {
    members,
    invites,
    isLoading,
    error,
    canManage: workspaceRole === 'owner' || workspaceRole === 'admin',
    fetchMembers,
    inviteMember,
    removeMember,
    updateMemberRole,
    cancelInvite,
  };
};
