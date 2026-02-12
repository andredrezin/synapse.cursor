# 🤝 Guia de Contribuição - Synapse

Obrigado por considerar contribuir com o Synapse! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Padrões de Código](#padrões-de-código)
- [Processo de Pull Request](#processo-de-pull-request)
- [Reportar Bugs](#reportar-bugs)
- [Sugerir Funcionalidades](#sugerir-funcionalidades)

## 📜 Código de Conduta

Este projeto adere a um código de conduta. Ao participar, você concorda em manter este código.

### Nossos Valores

- 🤝 **Respeito**: Trate todos com respeito
- 🌟 **Inclusão**: Seja acolhedor e inclusivo
- 💡 **Aprendizado**: Esteja aberto a aprender e ensinar
- 🎯 **Foco**: Mantenha o foco no objetivo do projeto

## 🚀 Como Contribuir

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Depois clone seu fork
git clone https://github.com/SEU_USUARIO/Synapse_Cursor.git
cd Synapse_Cursor
```

### 2. Configure o Ambiente

```bash
# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp ENV_EXAMPLE.md .env
# Edite o .env com suas credenciais

# Inicie o servidor de desenvolvimento
npm run dev
```

### 3. Crie uma Branch

```bash
# Crie uma branch para sua feature/fix
git checkout -b feature/nome-da-sua-feature
# ou
git checkout -b fix/nome-do-bug
```

### 4. Faça Suas Alterações

- Siga os [Padrões de Código](#padrões-de-código)
- Escreva código limpo e bem documentado
- Adicione testes quando apropriado
- Atualize a documentação se necessário

### 5. Commit

```bash
# Adicione suas mudanças
git add .

# Faça commit com mensagem descritiva
git commit -m "feat: adiciona nova funcionalidade X"
# ou
git commit -m "fix: corrige bug Y"
```

**Convenção de Commits:**
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação (não afeta código)
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Tarefas de manutenção

### 6. Push e Pull Request

```bash
# Push para seu fork
git push origin feature/nome-da-sua-feature

# Depois abra um Pull Request no GitHub
```

## ⚙️ Configuração do Ambiente

### Requisitos

- Node.js 18+
- npm ou yarn
- Git
- Conta no Supabase (para desenvolvimento)

### Setup

1. Clone o repositório
2. Instale dependências: `npm install`
3. Configure `.env` (veja [ENV_EXAMPLE.md](./ENV_EXAMPLE.md))
4. Execute migrations do Supabase
5. Inicie o servidor: `npm run dev`

## 📐 Padrões de Código

### TypeScript

- Use TypeScript para todos os arquivos `.ts` e `.tsx`
- Defina tipos explícitos quando possível
- Evite `any` - use tipos específicos ou `unknown`

### React

- Use componentes funcionais com hooks
- Mantenha componentes pequenos e focados
- Use nomes descritivos para componentes e funções
- Extraia lógica complexa para hooks customizados

### Estilização

- Use Tailwind CSS para estilização
- Siga o design system existente
- Use componentes shadcn/ui quando disponíveis
- Mantenha consistência visual

### Estrutura de Arquivos

```
src/
├── components/     # Componentes reutilizáveis
├── pages/         # Páginas/rotas
├── hooks/         # Custom hooks
├── contexts/      # Contextos React
├── lib/           # Utilitários
└── utils/         # Funções auxiliares
```

### Nomenclatura

- **Componentes**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useAuth.ts`)
- **Utilitários**: camelCase (`formatDate.ts`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)

### Exemplo de Componente

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface UserCardProps {
  name: string;
  email: string;
  onEdit?: () => void;
}

export const UserCard = ({ name, email, onEdit }: UserCardProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    await onEdit?.();
    setIsLoading(false);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold">{name}</h3>
      <p className="text-sm text-muted-foreground">{email}</p>
      {onEdit && (
        <Button onClick={handleClick} disabled={isLoading}>
          Editar
        </Button>
      )}
    </div>
  );
};
```

## 🔄 Processo de Pull Request

### Antes de Abrir um PR

- [ ] Código segue os padrões do projeto
- [ ] Testes passam (se aplicável)
- [ ] Documentação atualizada
- [ ] Sem erros de lint (`npm run lint`)
- [ ] Build funciona (`npm run build`)

### Template de PR

```markdown
## Descrição
Breve descrição das mudanças

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Breaking change
- [ ] Documentação

## Como Testar
Passos para testar as mudanças

## Screenshots (se aplicável)

## Checklist
- [ ] Código testado
- [ ] Documentação atualizada
- [ ] Sem erros de lint
```

### Revisão

- PRs serão revisados por mantenedores
- Feedback será fornecido quando necessário
- Mudanças podem ser solicitadas antes do merge

## 🐛 Reportar Bugs

### Antes de Reportar

1. Verifique se o bug já foi reportado
2. Tente reproduzir o bug
3. Colete informações relevantes

### Template de Bug Report

```markdown
**Descrição do Bug**
Descrição clara do bug

**Passos para Reproduzir**
1. Vá para '...'
2. Clique em '...'
3. Veja o erro

**Comportamento Esperado**
O que deveria acontecer

**Comportamento Atual**
O que está acontecendo

**Screenshots**
Se aplicável

**Ambiente**
- OS: [ex: Windows 10]
- Browser: [ex: Chrome 120]
- Versão: [ex: 1.0.0]

**Informações Adicionais**
Qualquer outra informação relevante
```

## 💡 Sugerir Funcionalidades

### Template de Feature Request

```markdown
**Funcionalidade Sugerida**
Descrição clara da funcionalidade

**Problema que Resolve**
Qual problema essa funcionalidade resolve?

**Solução Proposta**
Como você imagina que funcionaria?

**Alternativas Consideradas**
Outras soluções que você considerou

**Contexto Adicional**
Qualquer outra informação relevante
```

## 📞 Contato

Para dúvidas ou sugestões:
- Abra uma issue no GitHub
- Entre em contato com os mantenedores

## 🙏 Agradecimentos

Obrigado por contribuir com o Synapse! Cada contribuição torna o projeto melhor.

---

**Lembre-se**: Contribuir é sobre aprender, compartilhar e construir juntos! 🚀



