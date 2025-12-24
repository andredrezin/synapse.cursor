import { MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">WhatsMetrics</span>
          </div>
          
          <nav className="flex flex-wrap items-center justify-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Preços</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentação</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Suporte</a>
          </nav>
          
          <p className="text-sm text-muted-foreground">
            © 2024 WhatsMetrics. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
