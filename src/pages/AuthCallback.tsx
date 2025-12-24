import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const AuthCallback = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the auth code from URL (Supabase uses hash fragments or query params)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        // Check for errors
        if (error) {
          setErrorMessage(errorDescription || error);
          setStatus('error');
          return;
        }

        // If we have tokens, set the session
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setErrorMessage(sessionError.message);
            setStatus('error');
            return;
          }

          setStatus('success');

          // Determine where to redirect based on type
          if (type === 'recovery') {
            // Password recovery - go to reset password page
            setTimeout(() => navigate('/reset-password'), 1500);
          } else {
            // Email confirmation or other - go to onboarding
            setTimeout(() => navigate('/onboarding'), 1500);
          }
          return;
        }

        // Check if there's already an active session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus('success');
          setTimeout(() => navigate('/onboarding'), 1500);
          return;
        }

        // No tokens and no session - something went wrong
        setErrorMessage('Link inválido ou expirado. Por favor, tente novamente.');
        setStatus('error');
      } catch (err) {
        console.error('Auth callback error:', err);
        setErrorMessage('Ocorreu um erro ao processar a autenticação.');
        setStatus('error');
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/80 backdrop-blur-sm">
        {status === 'loading' && (
          <>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
              <div>
                <CardTitle className="text-2xl">Verificando...</CardTitle>
                <CardDescription className="mt-2">
                  Aguarde enquanto validamos sua autenticação.
                </CardDescription>
              </div>
            </CardHeader>
          </>
        )}

        {status === 'success' && (
          <>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Email verificado!</CardTitle>
                <CardDescription className="mt-2">
                  Sua conta foi confirmada. Redirecionando...
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
              </div>
            </CardContent>
          </>
        )}

        {status === 'error' && (
          <>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-2xl">Erro na verificação</CardTitle>
                <CardDescription className="mt-2">
                  {errorMessage}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/auth">
                  Tentar novamente
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">
                  Voltar para a página inicial
                </Link>
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default AuthCallback;
