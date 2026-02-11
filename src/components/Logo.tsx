import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = "h-8",
  showText = true,
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Ícone Original Synapse */}
      <img
        src="/logo-synapse.png"
        alt="Synapse Logo"
        className="h-full w-auto object-contain"
      />

      {/* Texto Synapse - Opcional se já estiver na imagem, mas mantemos para flexibilidade */}
      {showText && (
        <span
          className="font-bold tracking-tight text-foreground"
          style={{ fontSize: "1.5em" }}
        >
          {/* Se a imagem já tiver o texto, podemos ocultar este span ou deixá-lo vazio */}
        </span>
      )}
    </div>
  );
};
