-- =====================================================================
-- SoundCon — Schema do Supabase (rode no SQL Editor do projeto Supabase)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabela profiles: 1:1 com auth.users. Guarda dados de perfil do usuário.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada usuário só lê/edita o próprio perfil.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- Trigger: ao criar um usuário no Auth, cria a linha em profiles,
-- usando o "nome" enviado em options.data (raw_user_meta_data).
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Tabela logs: eventos de conversão/uso. Escrita pelo backend via
-- service-role (ignora RLS). RLS ligada e sem policies públicas =>
-- ninguém com a anon key consegue ler/escrever direto.
-- ---------------------------------------------------------------------
create table if not exists public.logs (
  id bigint generated always as identity primary key,
  thread_id text not null,
  mensagem text not null,
  pitch_cents integer,
  engine text,
  quality_level text,
  duration_ms integer,
  created_at timestamptz not null default now()
);

alter table public.logs enable row level security;
