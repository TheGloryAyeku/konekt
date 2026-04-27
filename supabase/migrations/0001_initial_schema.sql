-- Konekt initial schema
-- Run with: supabase db push   (or paste into the Supabase SQL editor)

-- Supabase hosts extensions in the `extensions` schema. Include it in the
-- search_path so unqualified references (e.g. `citext`) resolve.
set search_path = public, extensions;

-- citext must exist before any table references it.
create extension if not exists citext with schema extensions;

-- ─── enums ──────────────────────────────────────────────────────────────────

create type plan_type as enum ('free', 'pro');
create type subscription_status as enum ('active', 'cancelled', 'past_due', 'pending');

-- ─── profiles ───────────────────────────────────────────────────────────────
-- A profile is a 1:1 extension of auth.users. The username is the public
-- handle: konekt.ng/<username>.

create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     citext unique not null
               check (char_length(username) between 3 and 30
                      and username ~ '^[a-z0-9_]+$'),
  display_name text,
  bio          text check (char_length(bio) <= 240),
  avatar_url   text,
  theme        jsonb default '{"background": "#ffffff", "foreground": "#000000"}'::jsonb,
  plan         plan_type not null default 'free',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index profiles_username_idx on profiles (username);

-- ─── links ──────────────────────────────────────────────────────────────────

create table links (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references profiles(id) on delete cascade,
  title            text not null check (char_length(title) between 1 and 80),
  url              text not null,
  thumbnail_url    text,
  position         integer not null,
  is_enabled       boolean not null default true,
  scheduled_start  timestamptz,
  scheduled_end    timestamptz,
  click_count      bigint not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint scheduled_range_check
    check (scheduled_end is null or scheduled_start is null or scheduled_end > scheduled_start)
);

create index links_profile_id_position_idx on links (profile_id, position);
create index links_profile_id_enabled_idx on links (profile_id) where is_enabled;

-- ─── custom_domains ─────────────────────────────────────────────────────────

create table custom_domains (
  id                  uuid primary key default gen_random_uuid(),
  profile_id          uuid not null references profiles(id) on delete cascade,
  domain              citext unique not null,
  verified            boolean not null default false,
  verification_token  text not null,
  created_at          timestamptz not null default now()
);

create index custom_domains_profile_id_idx on custom_domains (profile_id);

-- ─── subscriptions ──────────────────────────────────────────────────────────

create table subscriptions (
  id                          uuid primary key default gen_random_uuid(),
  profile_id                  uuid not null references profiles(id) on delete cascade,
  plan                        plan_type not null,
  status                      subscription_status not null,
  paystack_customer_code      text,
  paystack_subscription_code  text unique,
  current_period_end          timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index subscriptions_profile_id_idx on subscriptions (profile_id);

-- ─── link click events ─────────────────────────────────────────────────────
-- Fallback analytics store before ClickHouse is wired up. Partition by day
-- later if volume justifies it.

create table link_click_events (
  id                bigserial primary key,
  profile_id        uuid not null references profiles(id) on delete cascade,
  link_id           uuid references links(id) on delete set null,
  event_type        text not null check (event_type in ('page_view', 'link_click')),
  referrer_host     text,
  referrer_platform text,
  device            text check (device in ('mobile', 'tablet', 'desktop', 'unknown')),
  country           text,
  created_at        timestamptz not null default now()
);

create index link_click_events_profile_created_idx on link_click_events (profile_id, created_at desc);
create index link_click_events_link_created_idx on link_click_events (link_id, created_at desc);

-- ─── helpers ────────────────────────────────────────────────────────────────

create or replace function increment_link_click_count(link_id_input uuid)
returns void language sql security definer as $$
  update links set click_count = click_count + 1 where id = link_id_input;
$$;

-- ─── updated_at trigger ─────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger links_set_updated_at
  before update on links
  for each row execute function set_updated_at();

create trigger subscriptions_set_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

-- ─── auto-create profile on signup ──────────────────────────────────────────

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  suggested_username text;
begin
  suggested_username := lower(
    regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g')
  );

  -- Pad to minimum 3 chars if needed
  if char_length(suggested_username) < 3 then
    suggested_username := suggested_username || substr(new.id::text, 1, 6);
  end if;

  -- Ensure uniqueness with a suffix if taken
  while exists (select 1 from profiles where username = suggested_username) loop
    suggested_username := suggested_username || substr(md5(random()::text), 1, 3);
  end loop;

  insert into profiles (id, username, display_name)
  values (new.id, suggested_username, coalesce(new.raw_user_meta_data->>'display_name', suggested_username));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── RLS ────────────────────────────────────────────────────────────────────

alter table profiles        enable row level security;
alter table links            enable row level security;
alter table custom_domains   enable row level security;
alter table subscriptions    enable row level security;
alter table link_click_events enable row level security;

-- profiles: publicly readable, owner-writable
create policy "profiles are readable by anyone"
  on profiles for select using (true);

create policy "users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- links: enabled links are publicly readable; owner has full control
create policy "enabled links are readable by anyone"
  on links for select using (is_enabled = true
    and (scheduled_start is null or scheduled_start <= now())
    and (scheduled_end   is null or scheduled_end   >= now()));

create policy "owners can read all their links"
  on links for select using (
    exists (select 1 from profiles p where p.id = links.profile_id and p.id = auth.uid())
  );

create policy "owners can insert their links"
  on links for insert with check (
    exists (select 1 from profiles p where p.id = links.profile_id and p.id = auth.uid())
  );

create policy "owners can update their links"
  on links for update using (
    exists (select 1 from profiles p where p.id = links.profile_id and p.id = auth.uid())
  );

create policy "owners can delete their links"
  on links for delete using (
    exists (select 1 from profiles p where p.id = links.profile_id and p.id = auth.uid())
  );

-- custom_domains: owner-only
create policy "owners can read their domains"
  on custom_domains for select using (
    exists (select 1 from profiles p where p.id = custom_domains.profile_id and p.id = auth.uid())
  );

create policy "owners can manage their domains"
  on custom_domains for all using (
    exists (select 1 from profiles p where p.id = custom_domains.profile_id and p.id = auth.uid())
  );

-- subscriptions: owner-readable only; writes go through service role
create policy "owners can read their subscriptions"
  on subscriptions for select using (
    exists (select 1 from profiles p where p.id = subscriptions.profile_id and p.id = auth.uid())
  );

-- link_click_events: owner-readable for analytics; writes go through service role
create policy "owners can read their click events"
  on link_click_events for select using (
    exists (select 1 from profiles p where p.id = link_click_events.profile_id and p.id = auth.uid())
  );
