import { useAuth } from '@/contexts/AuthContext';

export const usePermissions = () => {
  const { workspaceRole, profile, workspace } = useAuth();

  const isOwner = workspaceRole === 'owner';
  const isAdmin = workspaceRole === 'admin' || workspaceRole === 'owner';
  const isMember = workspaceRole === 'member';
  const isSeller = workspaceRole === 'seller';

  // Permission checks
  const canManageTeam = isAdmin; // Can invite/remove members
  const canManageSettings = isAdmin; // Can change workspace settings
  const canManagePixels = isAdmin; // Can manage tracking pixels
  const canViewAllData = isAdmin; // Can view all leads/conversations
  const canAssignLeads = isAdmin; // Can assign leads to other members
  const canDeleteLeads = isAdmin; // Can delete leads
  const canExportData = isAdmin; // Can export data

  // For sellers, they can only see their own data
  const canOnlyViewOwnData = isSeller || isMember;

  // Seller specific permissions
  const canViewOwnLeads = true; // All roles can view their assigned leads
  const canRespondToLeads = true; // All roles can respond to leads
  const canUpdateLeadStatus = true; // All roles can update lead status

  // Get role display name
  const getRoleDisplayName = (role: string | null) => {
    switch (role) {
      case 'owner':
        return 'Proprietário';
      case 'admin':
        return 'Administrador';
      case 'seller':
        return 'Vendedor';
      case 'member':
        return 'Membro';
      default:
        return 'Membro';
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'default';
      case 'seller':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return {
    // Role checks
    isOwner,
    isAdmin,
    isMember,
    isSeller,
    workspaceRole,
    
    // Permission checks
    canManageTeam,
    canManageSettings,
    canManagePixels,
    canViewAllData,
    canAssignLeads,
    canDeleteLeads,
    canExportData,
    canOnlyViewOwnData,
    canViewOwnLeads,
    canRespondToLeads,
    canUpdateLeadStatus,
    
    // Helpers
    getRoleDisplayName,
    getRoleBadgeVariant,
    currentRole: getRoleDisplayName(workspaceRole),
    profileId: profile?.id,
  };
};
