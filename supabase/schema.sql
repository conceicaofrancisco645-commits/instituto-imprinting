-- Instituto Imprinting — estrutura do banco (Supabase / PostgreSQL)
-- Tabela de manifestações de interesse enviadas pelo site.

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  perfil text not null check (perfil in ('investidor','pesquisador','medico','paciente')),
  nome text not null check (char_length(nome) between 3 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 160),
  telefone text not null check (char_length(regexp_replace(telefone, '\D', '', 'g')) between 10 and 11),
  cidade text not null check (char_length(cidade) between 2 and 80),
  uf char(2) not null,
  respostas jsonb not null default '{}'::jsonb check (pg_column_size(respostas) < 4000), -- respostas da etapa 3, variam por perfil
  mensagem text check (char_length(mensagem) <= 1500),
  consentimento_lgpd boolean not null check (consentimento_lgpd),        -- sem consentimento, não grava
  consentimento_saude boolean not null default false,                   -- obrigatório para paciente (dado sensível)
  versao_politica text not null default '2026-10',
  origem text default 'site',
  constraint paciente_consentimento check (perfil <> 'paciente' or consentimento_saude)
);

-- Segurança: o site usa a chave pública. Com RLS, o visitante só consegue INSERIR.
alter table public.leads enable row level security;

create policy "visitante pode enviar manifestacao" on public.leads
  for insert to anon, authenticated
  with check (consentimento_lgpd and (perfil <> 'paciente' or consentimento_saude));

revoke all on public.leads from anon, authenticated;
grant insert on public.leads to anon, authenticated;

create index leads_perfil_created_idx on public.leads (perfil, created_at desc);

-- Consulta útil para a equipe (no painel do Supabase):
-- select created_at, perfil, nome, email, telefone, cidade, uf, respostas
-- from public.leads where origem <> 'teste' order by created_at desc;
