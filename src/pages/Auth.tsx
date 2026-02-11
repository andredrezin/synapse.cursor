import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Logo } from "@/components/Logo";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .max(255, "Email muito longo"),
  password: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .max(72, "Senha muito longa"),
});

const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Nome deve ter no mínimo 2 caracteres")
      .max(100, "Nome muito longo"),
    email: z
      .string()
      .trim()
      .email("Email inválido")
      .max(255, "Email muito longo"),
    password: z
      .string()
      .min(6, "Senha deve ter no mínimo 6 caracteres")
      .max(72, "Senha muito longa"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showEmailSent, setShowEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || "/dashboard";

  // Redirect if already logged in
  if (user) {
    navigate(from, { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const result = loginSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    // Temporary restriction for portfolio case
    const OWNER_EMAIL = "dpereiraandre89@gmail.com";
    if (data.email.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
      toast({
        variant: "destructive",
        title: "Acesso Restrito",
        description:
          "No momento este sistema está em modo privado para portfólio. Acesso permitido apenas ao proprietário.",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(data.email, data.password);

    if (error) {
      let errorMessage = error.message;
      if (error.message === "Invalid login credentials") {
        errorMessage = "Email ou senha incorretos";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Por favor, confirme seu email antes de fazer login.";
      }
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: errorMessage,
      });
    } else {
      toast({
        title: "Bem-vindo de volta!",
        description: "Login realizado com sucesso.",
      });
      navigate(from, { replace: true });
    }

    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const result = signupSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    // Temporary restriction for portfolio case
    toast({
      variant: "default",
      title: "Em Construção",
      description:
        "Novos cadastros estão temporariamente desativados. Este é um projeto de demonstração técnica.",
    });
    setIsLoading(false);
    return;

    const { error } = await signUp(data.email, data.password, data.fullName);

    if (error) {
      let message = error.message;
      if (error.message.includes("already registered")) {
        message = "Este email já está cadastrado. Tente fazer login.";
      }
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: message,
      });
    } else {
      setSentEmail(data.email);
      setShowEmailSent(true);
    }

    setIsLoading(false);
  };

  // Show email sent confirmation
  if (showEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Verifique seu email</CardTitle>
              <CardDescription className="mt-2">
                Enviamos um link de verificação para:
                <br />
                <span className="font-medium text-foreground">{sentEmail}</span>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-secondary/50 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Próximos passos:</h4>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </span>
                  Abra seu email e clique no link de verificação
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </span>
                  Complete o onboarding criando seu workspace
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </span>
                  Acesse seu dashboard e comece a usar!
                </li>
              </ol>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Não recebeu o email? Verifique sua pasta de spam ou{" "}
              <button
                onClick={() => setShowEmailSent(false)}
                className="text-primary hover:underline"
              >
                tente novamente
              </button>
            </p>

            <div className="pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowEmailSent(false)}
              >
                Voltar ao login
              </Button>
            </div>
          </CardContent>
        </Card>
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

      <Card className="w-full max-w-md relative z-10 border-border/40 bg-card/40 backdrop-blur-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity mb-2"
          >
            <Logo className="h-28" />
          </Link>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Acesso Restrito
            </CardTitle>
            <CardDescription className="text-primary font-medium flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
              SISTEMA EM EVOLUÇÃO
              <Sparkles className="w-4 h-4 animate-pulse" />
            </CardDescription>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Este projeto é um portfólio de engenharia de IA. O acesso interno
              é exclusivo para demonstração técnica.
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar (Dono)</TabsTrigger>
              <TabsTrigger
                value="signup"
                disabled
                className="opacity-50 cursor-not-allowed"
              >
                Criar Conta (Breve)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email Profissional</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Senha</Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg uppercase tracking-tight">
                    Cadastro Suspenso
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Novos registros estão desativados temporariamente. Este
                    sistema está em modo de exibição de portfólio.
                  </p>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/">Voltar para Home</Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Voltar para a página inicial
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
