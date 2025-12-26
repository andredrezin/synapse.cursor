import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Building2, Loader2, ArrowRight, Sparkles, CheckCircle, User, Phone, Mail, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const step1Schema = z.object({
  fullName: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  phone: z.string().trim().min(10, 'Telefone deve ter no mínimo 10 dígitos').max(20, 'Telefone inválido').optional().or(z.literal('')),
});

const step2Schema = z.object({
  companyName: z.string().trim().min(2, 'Nome da empresa deve ter no mínimo 2 caracteres').max(50, 'Nome da empresa deve ter no máximo 50 caracteres'),
  position: z.string().trim().max(50, 'Cargo deve ter no máximo 50 caracteres').optional().or(z.literal('')),
});

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Admin data
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: Company data
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');

  const { user, profile, workspace, createWorkspace, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Pre-fill with existing profile data
  useEffect(() => {
    if (profile) {
      if (profile.full_name) setFullName(profile.full_name);
      if (profile.phone) setPhone(profile.phone);
      if (profile.company) setCompanyName(profile.company);
    }
  }, [profile]);

  // Check if user already completed onboarding
  useEffect(() => {
    if (profile?.onboarding_completed && workspace) {
      navigate('/dashboard', { replace: true });
    }
  }, [profile, workspace, navigate]);

  // If no user, redirect to auth
  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
    }
  }, [user, navigate]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = step1Schema.safeParse({ fullName, phone });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    // Update profile with admin data
    setIsLoading(true);
    const { error: updateError } = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim() || null,
    });

    if (updateError) {
      setError(updateError.message || 'Erro ao salvar dados');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = step2Schema.safeParse({ companyName, position });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    const inviteId = searchParams.get('invite');

    if (inviteId) {
      // Handle invitation acceptance
      try {
        const { data: invite, error: inviteError } = await supabase
          .from('team_invites')
          .select('*')
          .eq('id', inviteId)
          .single();

        if (inviteError || !invite || invite.status !== 'pending') {
          throw new Error('Convite inválido ou já expirado.');
        }

        // Add user to workspace
        const { error: memberError } = await supabase
          .from('workspace_members')
          .insert({
            workspace_id: invite.workspace_id,
            user_id: user.id,
            role: invite.role,
          });

        if (memberError) throw memberError;

        // Update invite status
        await supabase
          .from('team_invites')
          .update({ status: 'accepted' })
          .eq('id', inviteId);

        // Update profile
        await updateProfile({
          current_workspace_id: invite.workspace_id,
          onboarding_completed: true
        });

        toast({
          title: 'Convite aceito!',
          description: 'Você agora faz parte da equipe.',
        });

        setStep(3);
        setTimeout(() => navigate('/dashboard', { replace: true }), 2500);
        return;
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: 'Erro ao aceitar convite',
          description: err.message,
        });
        setIsLoading(false);
        return;
      }
    }

    // Update profile with company info
    const { error: profileError } = await updateProfile({
      company: companyName.trim(),
    });

    if (profileError) {
      setError(profileError.message || 'Erro ao salvar dados da empresa');
      setIsLoading(false);
      return;
    }

    // Create workspace
    const { error: createError, workspace: newWorkspace } = await createWorkspace(companyName.trim());

    if (createError) {
      setError(createError.message || 'Erro ao criar workspace');
      toast({
        variant: 'destructive',
        title: 'Erro ao criar workspace',
        description: createError.message,
      });
      setIsLoading(false);
      return;
    }

    // Create default workspace settings
    if (newWorkspace?.id) {
      await supabase
        .from('workspace_settings')
        .insert({ workspace_id: newWorkspace.id });
    }

    setStep(3);

    toast({
      title: 'Configuração concluída!',
      description: 'Seu workspace está pronto para uso.',
    });

    // Redirect after a short delay to show success state
    setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 2500);
  };

  // Show loading while checking auth
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <Link to="/" className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-primary/20 rounded-lg">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold">WhatsMetrics</span>
          </Link>

          {/* Step indicators */}
          {step < 3 && (
            <div className="flex items-center justify-center gap-2">
              <div className={`w-8 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-8 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          )}

          {step === 1 && (
            <>
              <div className="flex items-center justify-center gap-2 text-primary">
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">Passo 1 de 2</span>
              </div>

              <div>
                <CardTitle className="text-2xl">Seus dados</CardTitle>
                <CardDescription className="mt-2">
                  Primeiro, precisamos de algumas informações sobre você.
                </CardDescription>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center justify-center gap-2 text-primary">
                <Building2 className="w-5 h-5" />
                <span className="text-sm font-medium">Passo 2 de 2</span>
              </div>

              <div>
                <CardTitle className="text-2xl">Sua empresa</CardTitle>
                <CardDescription className="mt-2">
                  Agora, conte-nos sobre sua empresa.
                </CardDescription>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Tudo pronto!</CardTitle>
                <CardDescription className="mt-2">
                  Sua conta está configurada. Redirecionando para o dashboard...
                </CardDescription>
              </div>
            </>
          )}
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">Nome completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setError('');
                    }}
                    placeholder="Seu nome completo"
                    className="pl-10"
                    disabled={isLoading}
                    autoFocus
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setError('');
                    }}
                    placeholder="(11) 99999-9999"
                    className="pl-10"
                    disabled={isLoading}
                    maxLength={20}
                    type="tel"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Opcional. Será usado para notificações importantes.
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || !fullName.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Nome da empresa *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      setError('');
                    }}
                    placeholder="Nome da sua empresa"
                    className="pl-10"
                    disabled={isLoading}
                    autoFocus
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Seu cargo</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="position"
                    value={position}
                    onChange={(e) => {
                      setPosition(e.target.value);
                      setError('');
                    }}
                    placeholder="Ex: CEO, Gerente, Vendedor"
                    className="pl-10"
                    disabled={isLoading}
                    maxLength={50}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Opcional. Ajuda a personalizar sua experiência.
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading || !companyName.trim()}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      Concluir
                      <Sparkles className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>Perfil configurado</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>Empresa cadastrada</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>Workspace criado</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>Configurações aplicadas</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
