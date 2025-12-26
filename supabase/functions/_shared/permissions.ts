/**
 * Permission validation utilities for Supabase Edge Functions
 * Ensures users can only access their own workspace data
 */

interface PermissionCheckResult {
  allowed: boolean;
  role?: 'owner' | 'admin' | 'member' | 'seller';
  error?: string;
}

/**
 * Verify user has access to workspace
 */
export async function verifyWorkspaceAccess(
  supabase: any,
  userId: string,
  workspaceId: string
): Promise<PermissionCheckResult> {
  try {
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (memberError || !member) {
      return {
        allowed: false,
        error: 'Acesso negado a este workspace',
      };
    }

    return {
      allowed: true,
      role: member.role as 'owner' | 'admin' | 'member' | 'seller',
    };
  } catch (error) {
    return {
      allowed: false,
      error: 'Erro ao verificar permissões',
    };
  }
}

/**
 * Verify user owns or is admin of workspace
 */
export async function verifyWorkspaceAdmin(
  supabase: any,
  userId: string,
  workspaceId: string
): Promise<PermissionCheckResult> {
  const check = await verifyWorkspaceAccess(supabase, userId, workspaceId);
  
  if (!check.allowed) {
    return check;
  }

  if (check.role !== 'owner' && check.role !== 'admin') {
    return {
      allowed: false,
      error: 'Apenas administradores podem realizar esta ação',
    };
  }

  return check;
}

/**
 * Verify user has access to connection (via workspace)
 */
export async function verifyConnectionAccess(
  supabase: any,
  userId: string,
  connectionId: string
): Promise<PermissionCheckResult & { workspaceId?: string }> {
  try {
    // Get connection's workspace
    const { data: connection, error: connError } = await supabase
      .from('whatsapp_connections')
      .select('workspace_id')
      .eq('id', connectionId)
      .single();

    if (connError || !connection) {
      return {
        allowed: false,
        error: 'Conexão não encontrada',
      };
    }

    const workspaceCheck = await verifyWorkspaceAccess(
      supabase,
      userId,
      connection.workspace_id
    );

    return {
      ...workspaceCheck,
      workspaceId: connection.workspace_id,
    };
  } catch (error) {
    return {
      allowed: false,
      error: 'Erro ao verificar acesso à conexão',
    };
  }
}

/**
 * Verify user has access to conversation (via workspace)
 */
export async function verifyConversationAccess(
  supabase: any,
  userId: string,
  conversationId: string
): Promise<PermissionCheckResult & { workspaceId?: string }> {
  try {
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('workspace_id, assigned_to')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return {
        allowed: false,
        error: 'Conversa não encontrada',
      };
    }

    // Check workspace access
    const workspaceCheck = await verifyWorkspaceAccess(
      supabase,
      userId,
      conversation.workspace_id
    );

    if (!workspaceCheck.allowed) {
      return workspaceCheck;
    }

    // If conversation is assigned, verify user is assigned or is admin
    if (conversation.assigned_to) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      const isAssigned = profile?.id === conversation.assigned_to;
      const isAdmin = workspaceCheck.role === 'owner' || workspaceCheck.role === 'admin';

      if (!isAssigned && !isAdmin) {
        return {
          allowed: false,
          error: 'Você não tem acesso a esta conversa',
        };
      }
    }

    return {
      ...workspaceCheck,
      workspaceId: conversation.workspace_id,
    };
  } catch (error) {
    return {
      allowed: false,
      error: 'Erro ao verificar acesso à conversa',
    };
  }
}

/**
 * Verify user has access to lead (via workspace)
 */
export async function verifyLeadAccess(
  supabase: any,
  userId: string,
  leadId: string
): Promise<PermissionCheckResult & { workspaceId?: string }> {
  try {
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('workspace_id, assigned_to')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return {
        allowed: false,
        error: 'Lead não encontrado',
      };
    }

    const workspaceCheck = await verifyWorkspaceAccess(
      supabase,
      userId,
      lead.workspace_id
    );

    if (!workspaceCheck.allowed) {
      return workspaceCheck;
    }

    // If lead is assigned, verify user is assigned or is admin
    if (lead.assigned_to) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      const isAssigned = profile?.id === lead.assigned_to;
      const isAdmin = workspaceCheck.role === 'owner' || workspaceCheck.role === 'admin';

      if (!isAssigned && !isAdmin) {
        return {
          allowed: false,
          error: 'Você não tem acesso a este lead',
        };
      }
    }

    return {
      ...workspaceCheck,
      workspaceId: lead.workspace_id,
    };
  } catch (error) {
    return {
      allowed: false,
      error: 'Erro ao verificar acesso ao lead',
    };
  }
}


