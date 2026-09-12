-- ════════════════════════════════════════════════════════════════
--  RoutineFlow — Supabase schema (Phase 2: auth, cloud, friends, live)
--  Run this in Supabase → SQL Editor. Safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- ── PROFILES ────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text not null,
  avatar_color text default 'violet',
  bio          text,
  created_at   timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles readable by authed" on public.profiles;
create policy "profiles readable by authed" on public.profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "own profile write" on public.profiles;
create policy "own profile write" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── FRIENDSHIPS ─────────────────────────────────────────────────
-- Created BEFORE todos because the todos "friends can read" policy
-- references this table.
create table if not exists public.friendships (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade, -- requester
  friend_id  uuid not null references auth.users(id) on delete cascade, -- recipient
  status     text not null default 'pending',                          -- pending | accepted
  created_at timestamptz default now(),
  unique (user_id, friend_id)
);

alter table public.friendships enable row level security;

drop policy if exists "see own friendships" on public.friendships;
create policy "see own friendships" on public.friendships
  for select using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "create friend request" on public.friendships;
create policy "create friend request" on public.friendships
  for insert with check (auth.uid() = user_id);

drop policy if exists "respond to friendship" on public.friendships;
create policy "respond to friendship" on public.friendships
  for update using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "remove friendship" on public.friendships;
create policy "remove friendship" on public.friendships
  for delete using (auth.uid() = user_id or auth.uid() = friend_id);

-- Look up a user by username to send a request.
create or replace function public.find_user_by_username(uname text)
returns table (id uuid, username text, display_name text, avatar_color text)
language sql security definer as $$
  select id, username, display_name, avatar_color
  from public.profiles
  where lower(username) = lower(uname)
  limit 1;
$$;

-- ── TODOS ───────────────────────────────────────────────────────
-- id is TEXT so the client can generate ids and sync offline-first.
create table if not exists public.todos (
  id           text not null,
  user_id      uuid not null references auth.users(id) on delete cascade,
  day          date not null,
  title        text not null,
  note         text,
  color        text not null default 'violet',
  category_id  text,
  time         text,
  completed    boolean not null default false,
  completed_at timestamptz,
  sort_order   int not null default 0,
  routine_id   text,
  created_at   timestamptz default now(),
  primary key (user_id, id)
);

create index if not exists todos_user_day_idx on public.todos(user_id, day);

alter table public.todos enable row level security;

drop policy if exists "own todos" on public.todos;
create policy "own todos" on public.todos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Accepted friends can READ each other's todos (powers live sharing).
drop policy if exists "friends can read todos" on public.todos;
create policy "friends can read todos" on public.todos
  for select using (
    exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.user_id = auth.uid() and f.friend_id = todos.user_id) or
          (f.friend_id = auth.uid() and f.user_id = todos.user_id)
        )
    )
  );

-- ── ROUTINES ────────────────────────────────────────────────────
create table if not exists public.routines (
  id           text not null,
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  note         text,
  color        text not null default 'violet',
  category_id  text,
  time         text,
  days_of_week int[] default '{}',
  active       boolean not null default true,
  created_at   timestamptz default now(),
  primary key (user_id, id)
);

alter table public.routines enable row level security;
drop policy if exists "own routines" on public.routines;
create policy "own routines" on public.routines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── DAY META (goal + notes per day) ─────────────────────────────
create table if not exists public.day_meta (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null,
  goal    text,
  notes   text,
  primary key (user_id, day)
);

alter table public.day_meta enable row level security;
drop policy if exists "own day_meta" on public.day_meta;
create policy "own day_meta" on public.day_meta
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── PUSH SUBSCRIPTIONS ──────────────────────────────────────────
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null,
  keys       jsonb not null,
  created_at timestamptz default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;
drop policy if exists "own push subs" on public.push_subscriptions;
create policy "own push subs" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── REALTIME ────────────────────────────────────────────────────
-- Live updates so friends see completions instantly. Guarded so re-runs
-- don't fail if the table is already in the publication.
do $$
begin
  begin
    alter publication supabase_realtime add table public.todos;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.friendships;
  exception when duplicate_object then null;
  end;
end $$;
