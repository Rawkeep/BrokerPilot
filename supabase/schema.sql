-- ==========================================================================
-- BrokerPilot — Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database.
-- ==========================================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- --------------------------------------------------------------------------
-- Profiles (extends Supabase auth.users)
-- --------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  broker_type text default 'immobilien',
  company text,
  phone text,
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------------------------
-- Leads
-- --------------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  broker_type text not null,
  stage text not null default 'anfrage',
  priority text default 'medium',
  deal_value numeric default 0,
  source text,
  notes text,
  tags text[] default '{}',
  custom_fields jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_leads_user_id on public.leads(user_id);
create index if not exists idx_leads_broker_type on public.leads(broker_type);
create index if not exists idx_leads_stage on public.leads(stage);

-- --------------------------------------------------------------------------
-- Lead Activities (timeline)
-- --------------------------------------------------------------------------
create table if not exists public.activities (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- 'note', 'call', 'email', 'meeting', 'stage_change', 'pipeline_run'
  description text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_activities_lead_id on public.activities(lead_id);

-- --------------------------------------------------------------------------
-- Pipeline Results (AI agent outputs)
-- --------------------------------------------------------------------------
create table if not exists public.pipeline_results (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  qualifier_result jsonb,
  analyst_result jsonb,
  swot_result jsonb,
  proposal jsonb,
  status text default 'complete', -- 'complete', 'partial', 'error'
  created_at timestamptz default now()
);

create index if not exists idx_pipeline_results_lead_id on public.pipeline_results(lead_id);

-- --------------------------------------------------------------------------
-- Documents (file references in Supabase Storage)
-- --------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  file_path text not null, -- path in Supabase Storage
  file_type text, -- 'pdf', 'image', 'doc', etc.
  file_size integer,
  category text default 'general', -- 'expose', 'contract', 'gutachten', 'proposal'
  created_at timestamptz default now()
);

create index if not exists idx_documents_lead_id on public.documents(lead_id);
create index if not exists idx_documents_user_id on public.documents(user_id);

-- --------------------------------------------------------------------------
-- Follow-Up Reminders
-- --------------------------------------------------------------------------
create table if not exists public.reminders (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz not null,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_reminders_user_due on public.reminders(user_id, due_at);

-- --------------------------------------------------------------------------
-- Email Templates
-- --------------------------------------------------------------------------
create table if not exists public.email_templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  subject text not null,
  body text not null,
  broker_type text,
  category text default 'follow_up', -- 'follow_up', 'proposal', 'welcome', 'custom'
  variables text[] default '{}', -- e.g. '{lead_name, company, deal_value}'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- --------------------------------------------------------------------------
-- Row Level Security (RLS)
-- --------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.activities enable row level security;
alter table public.pipeline_results enable row level security;
alter table public.documents enable row level security;
alter table public.reminders enable row level security;
alter table public.email_templates enable row level security;

-- Users can only see/edit their own data
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can view own leads" on public.leads for select using (auth.uid() = user_id);
create policy "Users can insert own leads" on public.leads for insert with check (auth.uid() = user_id);
create policy "Users can update own leads" on public.leads for update using (auth.uid() = user_id);
create policy "Users can delete own leads" on public.leads for delete using (auth.uid() = user_id);

create policy "Users can view own activities" on public.activities for select using (auth.uid() = user_id);
create policy "Users can insert own activities" on public.activities for insert with check (auth.uid() = user_id);

create policy "Users can view own pipeline results" on public.pipeline_results for select using (auth.uid() = user_id);
create policy "Users can insert own pipeline results" on public.pipeline_results for insert with check (auth.uid() = user_id);

create policy "Users can view own documents" on public.documents for select using (auth.uid() = user_id);
create policy "Users can insert own documents" on public.documents for insert with check (auth.uid() = user_id);
create policy "Users can delete own documents" on public.documents for delete using (auth.uid() = user_id);

create policy "Users can view own reminders" on public.reminders for select using (auth.uid() = user_id);
create policy "Users can insert own reminders" on public.reminders for insert with check (auth.uid() = user_id);
create policy "Users can update own reminders" on public.reminders for update using (auth.uid() = user_id);
create policy "Users can delete own reminders" on public.reminders for delete using (auth.uid() = user_id);

create policy "Users can view own templates" on public.email_templates for select using (auth.uid() = user_id);
create policy "Users can insert own templates" on public.email_templates for insert with check (auth.uid() = user_id);
create policy "Users can update own templates" on public.email_templates for update using (auth.uid() = user_id);
create policy "Users can delete own templates" on public.email_templates for delete using (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- Updated-at trigger
-- --------------------------------------------------------------------------
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at before update on public.leads
  for each row execute function public.update_updated_at();

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger email_templates_updated_at before update on public.email_templates
  for each row execute function public.update_updated_at();

-- --------------------------------------------------------------------------
-- Storage Buckets
-- --------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Storage policies
create policy "Users can upload own documents"
  on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own documents"
  on storage.objects for select
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own documents"
  on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
