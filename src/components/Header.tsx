import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="container mx-auto px-6 h-64 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-56" />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            Recursos
          </a>
          <a
            href="#metrics"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            Métricas
          </a>
          <a
            href="#ai"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            IA
          </a>
          <a
            href="#pricing"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            Preços
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <Button asChild>
              <Link to="/dashboard">Acessar Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Entrar</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth">Começar Grátis</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
