create table if not exists public.share_invites (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null default 'line_liff',
  source text not null default 'share_button',
  metadata jsonb not null default '{}'::jsonb,
  open_count integer not null default 0,
  accept_count integer not null default 0,
  completed_count integer not null default 0,
  last_opened_at timestamptz,
  last_accepted_at timestamptz,
  last_completed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint share_invites_invite_code_format check (invite_code ~ '^[A-Z0-9]{8,16}$'),
  constraint share_invites_open_count_nonnegative check (open_count >= 0),
  constraint share_invites_accept_count_nonnegative check (accept_count >= 0),
  constraint share_invites_completed_count_nonnegative check (completed_count >= 0)
);

create index if not exists share_invites_owner_profile_id_idx
  on public.share_invites(owner_profile_id);

create index if not exists share_invites_created_at_idx
  on public.share_invites(created_at desc);

drop trigger if exists share_invites_set_updated_at on public.share_invites;
create trigger share_invites_set_updated_at
before update on public.share_invites
for each row execute function public.set_updated_at();

alter table public.share_invites enable row level security;

revoke all on table public.share_invites from anon, authenticated;
grant all on table public.share_invites to service_role;

comment on table public.share_invites is 'Per-share invite codes used to safely connect LIFF shares to friend_links.';
comment on column public.share_invites.invite_code is 'Short public code carried in LIFF URLs as ?invite=. It resolves to owner_profile_id server-side.';
