# Guia Passo a Passo: Conectar Projeto ao GitHub

## ✅ Passo 1: Criar Repositório no GitHub

1. Acesse o GitHub: https://github.com
2. Faça login na sua conta (ou crie uma conta se não tiver)
3. Clique no botão **"+"** no canto superior direito
4. Selecione **"New repository"**
5. Preencha os dados:
   - **Repository name**: `synapsewhats` (ou outro nome de sua escolha)
   - **Description**: (opcional) "Sistema de gestão WhatsApp com IA"
   - **Visibility**: Escolha **Public** ou **Private**
   - ⚠️ **IMPORTANTE**: NÃO marque nenhuma das opções:
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
6. Clique em **"Create repository"**

---

## ✅ Passo 2: Copiar a URL do Repositório

Após criar o repositório, o GitHub mostrará uma página com instruções. Você verá uma URL como:

- **HTTPS**: `https://github.com/SEU_USUARIO/synapsewhats.git`
- **SSH**: `git@github.com:SEU_USUARIO/synapsewhats.git`

**Copie a URL HTTPS** (é mais fácil para começar).

---

## ✅ Passo 3: Conectar Repositório Local ao GitHub

Abra o PowerShell ou Terminal no diretório do projeto e execute os seguintes comandos:

### 3.1. Adicionar o repositório remoto
```powershell
git remote add origin https://github.com/SEU_USUARIO/synapsewhats.git
```
*(Substitua `SEU_USUARIO` e `synapsewhats` pelos seus valores reais)*

### 3.2. Renomear branch para 'main' (padrão do GitHub)
```powershell
git branch -M main
```

### 3.3. Verificar se o remote foi adicionado corretamente
```powershell
git remote -v
```
*Você deve ver algo como:*
```
origin  https://github.com/SEU_USUARIO/synapsewhats.git (fetch)
origin  https://github.com/SEU_USUARIO/synapsewhats.git (push)
```

---

## ✅ Passo 4: Enviar Código para o GitHub

### 4.1. Fazer o push inicial
```powershell
git push -u origin main
```

### 4.2. Autenticação
- Se solicitado, você precisará fazer login no GitHub
- Pode ser necessário usar um **Personal Access Token** em vez da senha
- Se não tiver um token, siga o Passo 5 abaixo

---

## ✅ Passo 5: Criar Personal Access Token (se necessário)

Se o GitHub pedir autenticação e sua senha não funcionar:

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Dê um nome descritivo: `synapsewhats-local`
4. Selecione o escopo: **repo** (marque todas as opções de repo)
5. Clique em **"Generate token"**
6. **COPIE O TOKEN** (você só verá ele uma vez!)
7. Use este token como senha quando o Git pedir credenciais

---

## ✅ Passo 6: Verificar no GitHub

1. Acesse seu repositório no GitHub: `https://github.com/SEU_USUARIO/synapsewhats`
2. Você deve ver todos os arquivos do projeto
3. O commit inicial deve aparecer no histórico

---

## 📝 Comandos Úteis para o Futuro

### Ver status do repositório
```powershell
git status
```

### Adicionar arquivos modificados
```powershell
git add .
```

### Fazer commit
```powershell
git commit -m "Descrição das alterações"
```

### Enviar para o GitHub
```powershell
git push
```

### Ver histórico de commits
```powershell
git log --oneline
```

### Ver branches
```powershell
git branch
```

---

## ❓ Problemas Comuns

### Erro: "remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/SEU_USUARIO/synapsewhats.git
```

### Erro: "failed to push some refs"
```powershell
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Verificar configuração do Git
```powershell
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"
```

---

## 🎉 Pronto!

Seu projeto está conectado ao GitHub e pronto para desenvolvimento colaborativo!


