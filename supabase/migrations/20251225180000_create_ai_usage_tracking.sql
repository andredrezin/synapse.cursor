
-- Tabela para rastrear o uso de IA por workspace
create table if not exists public.ai_usage_tracking (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    period_start date not null default current_date, -- Início do ciclo de faturamento atual
    message_count integer default 0,
    token_count integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    unique(workspace_id, period_start)
);

-- RLS: Apenas membros do workspace podem ver o uso
alter table public.ai_usage_tracking enable row level security;

create policy "Users can view usage for their workspace"
    on public.ai_usage_tracking
    for select
    using (
        workspace_id in (
            select workspace_id from public.profiles
            where id = auth.uid()
        )
    );

-- Apenas sistema ou funções admin deveriam incrementar o uso, mas por enquanto permitiremos update para facilitar testes
create policy "Users can update usage for their workspace"
    on public.ai_usage_tracking
    for update
    using (
        workspace_id in (
            select workspace_id from public.profiles
            where id = auth.uid()
        )
    );

-- Tipos atualizados para refletir limits
-- (Opcional, já que vamos controlar via código, mas é bom ter documentado)
comment on table public.ai_usage_tracking is 'Rastreia o uso de recursos de IA por período de faturamento';
