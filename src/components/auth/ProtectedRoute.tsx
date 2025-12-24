import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
  requireWorkspace?: boolean;
  requireEmailConfirmed?: boolean;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireOnboarding = true,
  requireWorkspace = true,
  requireEmailConfirmed = false,
  requireAdmin = false,
}) => {
  const { user, profile, workspace, isLoading, isEmailConfirmed, isAdmin } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redirect to verify email page if email not confirmed (when required)
  if (requireEmailConfirmed && !isEmailConfirmed) {
    return <Navigate to="/verify-email" replace />;
  }

  // Redirect to onboarding if onboarding not completed (when required)
  if (requireOnboarding && profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect to onboarding if no workspace (when required)
  if (requireWorkspace && !workspace) {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect to dashboard if admin access required but user is not admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
