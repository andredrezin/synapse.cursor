# 🧪 Guia de Testes - Fase 2: Performance

## 📋 Como Testar as Melhorias Implementadas

Este guia te ajudará a testar todas as melhorias de performance implementadas na Fase 2.

---

## 🚀 1. Preparação - Iniciar o Projeto

### Passo 1: Verificar se o projeto está rodando

```bash
# Se não estiver rodando, execute:
npm run dev
```

O projeto deve iniciar em `http://localhost:5173` (ou outra porta se esta estiver ocupada).

### Passo 2: Fazer login e selecionar um workspace

- Acesse a aplicação
- Faça login com suas credenciais
- Selecione um workspace

---

## 📄 2. Testar Paginação em Leads

### O que testar:
- ✅ Paginação funciona corretamente
- ✅ Navegação entre páginas
- ✅ Contador de itens está correto
- ✅ Performance melhorada com muitos leads

### Como testar:

1. **Acesse a página de Leads**
   - Navegue para `/dashboard/leads`
   - Ou clique em "Leads" no menu lateral

2. **Verifique a paginação**
   - Se você tiver mais de 50 leads, verá controles de paginação no final da página
   - Deve mostrar: "Mostrando 1 - 50 de X leads"
   - Botões "Anterior" e "Próximo" devem estar presentes

3. **Teste a navegação**
   - Clique em "Próximo" para ir para a próxima página
   - Clique em "Anterior" para voltar
   - Clique em números de página específicos
   - Verifique se os dados mudam corretamente

4. **Teste com filtros**
   - Use a busca por nome/telefone
   - Filtre por temperatura (hot/warm/cold)
   - Verifique se a paginação se ajusta aos resultados filtrados

### O que observar:
- ⚡ **Performance**: A página deve carregar rapidamente mesmo com muitos leads
- 🎯 **Precisão**: Os números de página devem estar corretos
- 🔄 **Navegação**: Transições entre páginas devem ser suaves

---

## 💬 3. Testar Paginação em Conversas

### O que testar:
- ✅ Paginação funciona em conversas
- ✅ Ordenação por data de atualização
- ✅ Performance melhorada

### Como testar:

1. **Acesse a página de Conversas**
   - Navegue para `/dashboard/conversations`
   - Ou clique em "Conversas" no menu lateral

2. **Verifique a paginação**
   - Se você tiver mais de 50 conversas, verá controles de paginação
   - Deve mostrar: "Mostrando 1 - 50 de X conversas"

3. **Teste a navegação**
   - Navegue entre páginas
   - Verifique se as conversas mais recentes aparecem primeiro

### O que observar:
- ⚡ **Performance**: Carregamento rápido mesmo com muitas conversas
- 📅 **Ordenação**: Conversas mais recentes primeiro

---

## 💾 4. Testar Cache e Otimização de Queries

### O que testar:
- ✅ Cache funciona corretamente
- ✅ Menos requisições ao banco de dados
- ✅ Dados atualizados quando necessário

### Como testar:

1. **Abra o DevTools do navegador**
   - Pressione `F12` ou `Ctrl+Shift+I`
   - Vá para a aba "Network" (Rede)

2. **Teste o cache de Leads**
   - Acesse a página de Leads
   - Observe as requisições na aba Network
   - Navegue para outra página e volte para Leads
   - **Resultado esperado**: Não deve fazer nova requisição se passou menos de 30 segundos

3. **Teste o cache de Métricas**
   - Acesse o Dashboard
   - Observe as requisições
   - Recarregue a página dentro de 1 minuto
   - **Resultado esperado**: Deve usar cache (não fazer nova requisição)

4. **Teste invalidação de cache**
   - Crie um novo lead
   - Volte para a lista de leads
   - **Resultado esperado**: Deve fazer nova requisição (cache invalidado)

### O que observar:
- 📊 **Redução de requisições**: Deve haver menos requisições ao banco
- ⚡ **Performance**: Páginas devem carregar mais rápido após primeira visita
- 🔄 **Atualização**: Dados devem atualizar quando há mudanças (via realtime)

---

## 📊 5. Testar Métricas Calculadas no Backend

### O que testar:
- ✅ Métricas são calculadas no backend
- ✅ Performance melhorada no dashboard
- ✅ Validação de permissões funciona

### Como testar:

1. **Acesse o Dashboard**
   - Navegue para `/dashboard`
   - Ou clique em "Dashboard" no menu lateral

2. **Verifique as métricas**
   - Taxa de conversão
   - Leads ativos
   - Novos leads hoje
   - Conversas hoje
   - Leads quentes
   - Vendas hoje

3. **Abra o DevTools**
   - Vá para a aba "Network"
   - Filtre por "dashboard-metrics"
   - **Resultado esperado**: Deve ver uma requisição para `dashboard-metrics`

4. **Verifique a resposta**
   - Clique na requisição `dashboard-metrics`
   - Vá para a aba "Response"
   - **Resultado esperado**: Deve retornar apenas métricas calculadas, não todos os leads

5. **Teste com diferentes perfis**
   - Se você tem perfil de vendedor, deve ver apenas seus leads
   - Se você tem perfil de admin, deve ver todos os leads

### O que observar:
- ⚡ **Performance**: Dashboard deve carregar mais rápido
- 📊 **Dados**: Métricas devem estar corretas
- 🔒 **Segurança**: Vendedores devem ver apenas seus dados

---

## 🔄 6. Testar Remoção de Polling

### O que testar:
- ✅ Não há polling desnecessário
- ✅ Atualizações via realtime funcionam
- ✅ OAuth ainda funciona

### Como testar:

1. **Abra o DevTools**
   - Vá para a aba "Network"
   - Filtre por "whatsapp-status"

2. **Acesse a página de Conexões WhatsApp**
   - Navegue para `/dashboard/whatsapp-connections`
   - Ou clique em "Conexões WhatsApp" no menu

3. **Observe as requisições**
   - **Resultado esperado**: Não deve haver polling constante de status
   - Se uma conexão está "connected", não deve fazer polling
   - Se uma conexão está "connecting" ou "qr_pending", pode fazer polling apenas durante OAuth

4. **Teste atualização via realtime**
   - Se você tem outra aba aberta e mudar o status de uma conexão
   - **Resultado esperado**: A outra aba deve atualizar automaticamente (realtime)

### O que observar:
- 🚫 **Sem polling**: Não deve haver requisições repetidas desnecessárias
- ⚡ **Performance**: Menos carga no servidor
- 🔄 **Realtime**: Atualizações devem funcionar via WebSocket

---

## 📈 7. Testar Performance Geral

### O que testar:
- ✅ Tempo de carregamento melhorado
- ✅ Uso de memória otimizado
- ✅ Experiência do usuário fluida

### Como testar:

1. **Teste com muitos dados**
   - Se possível, crie muitos leads (100+) para testar paginação
   - Observe o tempo de carregamento

2. **Compare antes e depois**
   - Antes: Carregava todos os leads de uma vez (lento)
   - Depois: Carrega apenas 50 por vez (rápido)

3. **Teste navegação**
   - Navegue entre páginas rapidamente
   - **Resultado esperado**: Deve usar cache, carregamento instantâneo

4. **Teste em dispositivos móveis**
   - Abra o DevTools
   - Ative o modo responsivo (Ctrl+Shift+M)
   - Teste em diferentes tamanhos de tela

### O que observar:
- ⚡ **Velocidade**: Páginas devem carregar em menos de 1 segundo
- 💾 **Memória**: Uso de memória deve ser menor
- 🎯 **UX**: Experiência deve ser fluida e responsiva

---

## 🐛 8. Verificar Possíveis Problemas

### Problemas comuns e soluções:

#### ❌ Paginação não aparece
- **Causa**: Menos de 50 itens
- **Solução**: Crie mais leads/conversas ou reduza o `pageSize` no código

#### ❌ Cache não funciona
- **Causa**: DevTools pode estar desabilitando cache
- **Solução**: Desmarque "Disable cache" no DevTools

#### ❌ Métricas não atualizam
- **Causa**: Edge Function pode não estar deployada
- **Solução**: Deploy da função `dashboard-metrics` no Supabase

#### ❌ Performance ainda lenta
- **Causa**: Pode ser conexão lenta ou muitos dados
- **Solução**: Verifique a conexão e considere aumentar o `pageSize`

---

## 📝 9. Checklist de Testes

Use este checklist para garantir que tudo está funcionando:

- [ ] Paginação em Leads funciona
- [ ] Paginação em Conversas funciona
- [ ] Cache reduz requisições ao banco
- [ ] Métricas são calculadas no backend
- [ ] Dashboard carrega rapidamente
- [ ] Não há polling desnecessário
- [ ] Realtime funciona corretamente
- [ ] Filtros funcionam com paginação
- [ ] Navegação entre páginas é suave
- [ ] Performance geral melhorou

---

## 🔍 10. Ferramentas Úteis

### DevTools do Navegador
- **Network**: Ver requisições HTTP
- **Console**: Ver logs e erros
- **Performance**: Analisar performance
- **Application**: Ver cache e storage

### Extensões Úteis
- React DevTools
- Redux DevTools (se usar Redux)
- Lighthouse (análise de performance)

---

## 📞 Suporte

Se encontrar problemas durante os testes:

1. Verifique os logs no console do navegador
2. Verifique os logs no terminal onde o projeto está rodando
3. Verifique os logs no Supabase Dashboard (Edge Functions)
4. Consulte a documentação em `FASE2_PERFORMANCE_COMPLETA.md`

---

**Boa sorte com os testes! 🚀**


