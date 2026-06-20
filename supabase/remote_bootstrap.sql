create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'archetype_key') then
    create type public.archetype_key as enum (
      'explorer',
      'craftsman',
      'guardian',
      'navigator',
      'strategist',
      'inventor',
      'trader',
      'mentor',
      'builder'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'quiz_session_status') then
    create type public.quiz_session_status as enum ('started', 'completed', 'abandoned');
  end if;

  if not exists (select 1 from pg_type where typname = 'membership_status') then
    create type public.membership_status as enum ('free', 'trial', 'active', 'past_due', 'cancelled');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  line_user_id text not null unique,
  display_name text,
  picture_url text,
  locale text default 'zh-TW',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  status public.quiz_session_status not null default 'started',
  primary_type public.archetype_key,
  secondary_type public.archetype_key,
  evolution_type public.archetype_key,
  archetype_scores jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  scenario_id text not null,
  option_id text not null check (option_id in ('a', 'b', 'c')),
  archetype_key public.archetype_key not null,
  answered_at timestamptz not null default now(),
  unique (session_id, scenario_id)
);

create table if not exists public.archetype_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.quiz_sessions(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  primary_type public.archetype_key not null,
  secondary_type public.archetype_key not null,
  evolution_type public.archetype_key not null,
  archetype_scores jsonb not null default '{}'::jsonb,
  share_card_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.friend_links (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  friend_profile_id uuid not null references public.profiles(id) on delete cascade,
  source text not null default 'line',
  created_at timestamptz not null default now(),
  unique (owner_profile_id, friend_profile_id),
  constraint friend_links_no_self_link check (owner_profile_id <> friend_profile_id)
);

create table if not exists public.share_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  session_id uuid references public.quiz_sessions(id) on delete set null,
  channel text not null default 'line_liff',
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  status public.membership_status not null default 'free',
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  session_id uuid references public.quiz_sessions(id) on delete set null,
  line_user_id text,
  event_name text not null,
  page text,
  scenario_id text,
  option_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists profiles_line_user_id_idx on public.profiles(line_user_id);
create index if not exists quiz_sessions_profile_id_idx on public.quiz_sessions(profile_id);
create index if not exists quiz_answers_session_id_idx on public.quiz_answers(session_id);
create index if not exists archetype_results_profile_id_idx on public.archetype_results(profile_id);
create index if not exists friend_links_owner_profile_id_idx on public.friend_links(owner_profile_id);
create index if not exists share_events_profile_id_idx on public.share_events(profile_id);
create index if not exists user_events_event_name_idx on public.user_events(event_name);
create index if not exists user_events_profile_id_idx on public.user_events(profile_id);
create index if not exists user_events_session_id_idx on public.user_events(session_id);
create index if not exists user_events_occurred_at_idx on public.user_events(occurred_at desc);
create index if not exists user_events_line_user_id_idx on public.user_events(line_user_id);

alter table public.profiles enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.archetype_results enable row level security;
alter table public.friend_links enable row level security;
alter table public.share_events enable row level security;
alter table public.memberships enable row level security;
alter table public.user_events enable row level security;

revoke all on table public.user_events from anon, authenticated;
grant all on table public.user_events to service_role;

select table_name
from information_schema.tables
where table_schema = 'public'
and table_name in (
  'profiles',
  'quiz_sessions',
  'quiz_answers',
  'archetype_results',
  'friend_links',
  'share_events',
  'memberships',
  'user_events'
)
order by table_name;
