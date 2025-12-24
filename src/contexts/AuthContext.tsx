import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  company: string | null;
  phone: string | null;
  onboarding_completed: boolean;
  current_workspace_id: string | null;
}

interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  workspace: Workspace | null;
  workspaceRole: 'owner' | 'admin' | 'member' | 'seller' | null;
  isLoading: boolean;
  isEmailConfirmed: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  createWorkspace: (name: string) => Promise<{ error: Error | null; workspace?: Workspace }>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceRole, setWorkspaceRole] = useState<'owner' | 'admin' | 'member' | 'seller' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isEmailConfirmed = user?.email_confirmed_at != null;
  const isAdmin = workspaceRole === 'owner' || workspaceRole === 'admin';

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as Profile);
      return data as Profile;
    }
    return null;
  };

  const fetchWorkspace = async (workspaceId: string, userId: string) => {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (!error && data) {
      setWorkspace(data as Workspace);
      
      // Fetch user's role in this workspace
      const { data: memberData } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single();
      
      if (memberData) {
        setWorkspaceRole(memberData.role as 'owner' | 'admin' | 'member' | 'seller');
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      if (profileData?.current_workspace_id) {
        await fetchWorkspace(profileData.current_workspace_id, user.id);
      }
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(async () => {
            const profileData = await fetchProfile(session.user.id);
            if (profileData?.current_workspace_id) {
              await fetchWorkspace(profileData.current_workspace_id, session.user.id);
            }
            setIsLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setWorkspace(null);
          setWorkspaceRole(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        if (profileData?.current_workspace_id) {
          await fetchWorkspace(profileData.current_workspace_id, session.user.id);
        }
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setWorkspace(null);
    setWorkspaceRole(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }

    return { error };
  };

  const createWorkspace = async (name: string) => {
    if (!session?.access_token) {
      return { error: new Error('No session available') };
    }

    const { data, error } = await supabase.functions.invoke('create-workspace', {
      body: { name },
    });

    if (error) {
      return { error };
    }

    if (data?.workspace) {
      // Refresh profile and workspace data
      await refreshProfile();
      return { error: null, workspace: data.workspace };
    }

    return { error: new Error(data?.error || 'Failed to create workspace') };
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        workspace,
        workspaceRole,
        isLoading,
        isEmailConfirmed,
        isAdmin,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshProfile,
        createWorkspace,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
