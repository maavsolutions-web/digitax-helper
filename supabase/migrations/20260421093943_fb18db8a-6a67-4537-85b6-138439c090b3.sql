-- Roles enum
create type public.app_role as enum ('individual', 'ca');

-- Pipeline stage enum
create type public.pipeline_stage as enum ('docs_pending','processing','ready_for_review','awaiting_approval','filed');

-- Risk level enum
create type public.risk_level as enum ('low','medium','high');

-- Document type enum
create type public.document_type as enum ('form_26as','ais','form_16','investment_proof','other');

-- =====================================================
-- profiles
-- =====================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  pan text,
  income_type text,
  phone text,
  firm_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- =====================================================
-- user_roles
-- =====================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- has_role security definer
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- =====================================================
-- clients (CA's client records)
-- =====================================================
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  ca_id uuid not null references auth.users(id) on delete cascade,
  source_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  pan text,
  income_type text,
  stage public.pipeline_stage not null default 'ready_for_review',
  risk public.risk_level not null default 'medium',
  health_score int,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.clients enable row level security;
create index idx_clients_ca on public.clients(ca_id);
create index idx_clients_source on public.clients(source_user_id);

-- =====================================================
-- documents
-- =====================================================
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  doc_type public.document_type not null,
  file_name text not null,
  file_path text,
  size_bytes int,
  created_at timestamptz not null default now()
);
alter table public.documents enable row level security;
create index idx_documents_owner on public.documents(owner_user_id);
create index idx_documents_client on public.documents(client_id);

-- =====================================================
-- reports
-- =====================================================
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  health_score int not null,
  payable_amount numeric,
  refund_amount numeric,
  key_issues jsonb not null default '[]'::jsonb,
  risk_alerts jsonb not null default '[]'::jsonb,
  savings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
create index idx_reports_owner on public.reports(owner_user_id);
create index idx_reports_client on public.reports(client_id);

-- =====================================================
-- notes (internal CA notes)
-- =====================================================
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  ca_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.notes enable row level security;
create index idx_notes_client on public.notes(client_id);

-- =====================================================
-- Auto-create profile on signup
-- =====================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, firm_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.phone,
    new.raw_user_meta_data->>'firm_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================
-- updated_at trigger for profiles
-- =====================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- profiles
create policy "Users view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "CAs view assigned client profiles" on public.profiles
  for select using (
    public.has_role(auth.uid(), 'ca')
    and exists (select 1 from public.clients c where c.source_user_id = profiles.id and c.ca_id = auth.uid())
  );
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- user_roles
create policy "Users view own roles" on public.user_roles
  for select using (auth.uid() = user_id);
create policy "Users insert own role" on public.user_roles
  for insert with check (auth.uid() = user_id);

-- clients
create policy "CAs view own clients" on public.clients
  for select using (auth.uid() = ca_id);
create policy "Source user views own client record" on public.clients
  for select using (auth.uid() = source_user_id);
create policy "CAs insert clients" on public.clients
  for insert with check (auth.uid() = ca_id or auth.uid() = source_user_id);
create policy "CAs update own clients" on public.clients
  for update using (auth.uid() = ca_id);

-- documents
create policy "Users view own documents" on public.documents
  for select using (auth.uid() = owner_user_id);
create policy "CAs view assigned client documents" on public.documents
  for select using (
    public.has_role(auth.uid(), 'ca')
    and exists (select 1 from public.clients c where c.id = documents.client_id and c.ca_id = auth.uid())
  );
create policy "Users insert own documents" on public.documents
  for insert with check (auth.uid() = owner_user_id);
create policy "Users update own documents" on public.documents
  for update using (auth.uid() = owner_user_id);

-- reports
create policy "Users view own reports" on public.reports
  for select using (auth.uid() = owner_user_id);
create policy "CAs view assigned client reports" on public.reports
  for select using (
    public.has_role(auth.uid(), 'ca')
    and exists (select 1 from public.clients c where c.id = reports.client_id and c.ca_id = auth.uid())
  );
create policy "Users insert own reports" on public.reports
  for insert with check (auth.uid() = owner_user_id);

-- notes
create policy "CAs view own notes" on public.notes
  for select using (auth.uid() = ca_id);
create policy "CAs insert own notes" on public.notes
  for insert with check (auth.uid() = ca_id);
create policy "CAs delete own notes" on public.notes
  for delete using (auth.uid() = ca_id);
