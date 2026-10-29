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

-- ============================================================
-- Reforço de segurança (após varredura de 28/10/2026)
-- ============================================================

-- Visitante só envia as colunas do formulário: id, created_at e versao_politica não podem ser forjados
revoke insert on public.leads from anon, authenticated;
grant insert (perfil, nome, email, telefone, cidade, uf, respostas, mensagem, consentimento_lgpd, consentimento_saude, origem)
  on public.leads to anon, authenticated;

-- Recusa < e > nos campos de texto (evita código HTML guardado nos dados)
alter table public.leads
  add constraint leads_sem_html check (
    nome !~ '[<>]' and email !~ '[<>]' and telefone !~ '[<>]' and cidade !~ '[<>]'
    and coalesce(mensagem, '') !~ '[<>]' and respostas::text !~ '[<>]'
    and coalesce(origem, '') !~ '[<>]'
  ) not valid,
  add constraint leads_origem_tamanho check (char_length(coalesce(origem, '')) <= 40) not valid,
  add constraint leads_uf_formato check (uf ~ '^[A-Z]{2}$') not valid;

-- Limite de envios contra robôs: 3 por e-mail por hora e 30 por minuto no total
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.leads_limite_envios()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.email := lower(trim(new.email));
  if (select count(*) from public.leads
      where email = new.email and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'limite_envios_email' using errcode = 'P0001',
      hint = 'Este e-mail já enviou 3 manifestações na última hora.';
  end if;
  if (select count(*) from public.leads
      where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'limite_envios_geral' using errcode = 'P0001',
      hint = 'Muitos envios no último minuto.';
  end if;
  return new;
end;
$$;

revoke all on function private.leads_limite_envios() from public, anon, authenticated;

create trigger leads_limite_envios
  before insert on public.leads
  for each row execute function private.leads_limite_envios();

create index if not exists leads_email_created_idx on public.leads (email, created_at desc);
create index if not exists leads_created_idx on public.leads (created_at desc);

-- ============================================================
-- Aviso por e-mail a cada envio (PRONTO, MAS DESLIGADO)
-- Cenário no Make: "Instituto Imprinting — aviso de novo lead por e-mail"
-- (Webhook -> Enviar e-mail). Para ligar: ative o cenário no Make e rode o bloco abaixo.
-- ============================================================
-- create extension if not exists pg_net;
--
-- create or replace function private.leads_avisar_make()
-- returns trigger language plpgsql security definer set search_path = '' as $$
-- begin
--   perform net.http_post(
--     url := 'https://hook.us2.make.com/<id-do-webhook>',
--     body := jsonb_build_object(
--       'perfil', new.perfil, 'nome', new.nome, 'email', new.email,
--       'telefone', new.telefone, 'cidade', new.cidade, 'uf', new.uf,
--       'origem', new.origem, 'created_at', new.created_at)
--   );
--   return new;
-- end; $$;
--
-- create trigger leads_avisar_make after insert on public.leads
--   for each row execute function private.leads_avisar_make();
