-- Clipsong schema (Supabase Postgres). Access: row level security on every table.
-- Catalogue ids are text: 'jm-<jamendo id>' for Jamendo, 'up-<uuid>' for uploads,
-- short ids for the demo seed.
create extension if not exists pg_trgm;

-- ───────────────────────── profiles ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 60),
  avatar_url text,
  is_artist boolean not null default false,
  monetizable_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A profile is created for every new auth user (email or Google).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(nullif(new.raw_user_meta_data->>'name', ''), nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1), 'Creador'), 60));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── catalogue ─────────────────────────
create table public.artists (
  id text primary key,
  source text not null check (source in ('jamendo','upload','demo')),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  image_url text,
  bio text not null default '',
  hue smallint not null default 0,
  updated_at timestamptz not null default now()
);

create table public.albums (
  id text primary key,
  source text not null check (source in ('jamendo','upload','demo')),
  artist_id text not null references public.artists(id) on delete cascade,
  title text not null,
  cover_url text,
  year smallint,
  kind text not null default 'album' check (kind in ('album','single','ep')),
  hue smallint not null default 0,
  updated_at timestamptz not null default now()
);
create index on public.albums (artist_id);

create table public.tracks (
  id text primary key,
  source text not null check (source in ('jamendo','upload','demo')),
  album_id text not null references public.albums(id) on delete cascade,
  artist_id text not null references public.artists(id) on delete cascade,
  title text not null,
  duration_ms integer not null check (duration_ms > 0),
  track_number smallint not null default 1,
  explicit boolean not null default false,
  audio_url text not null,
  licence text not null check (licence in ('CC-BY','CC-BY-SA','CC-BY-NC','CC-BY-ND','CC-BY-NC-SA','CC-BY-NC-ND')),
  licence_url text not null,
  genres text[] not null default '{}',
  playable boolean not null default true,
  licence_checked_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.tracks (album_id, track_number);
create index on public.tracks (artist_id);
create index tracks_title_trgm on public.tracks using gin (title gin_trgm_ops);
create index tracks_genres on public.tracks using gin (genres);

-- Licence history: what the licence was on a given day (Creador "licence receipts").
create table public.licence_snapshots (
  id bigint generated always as identity primary key,
  track_id text not null references public.tracks(id) on delete cascade,
  licence text not null,
  licence_url text not null,
  seen_at timestamptz not null default now()
);
create index on public.licence_snapshots (track_id, seen_at desc);

-- ───────────────────────── library ─────────────────────────
create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(name) between 1 and 100),
  description text not null default '' check (length(description) <= 300),
  is_public boolean not null default false,
  is_collaborative boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.playlists (owner_id);

create table public.playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  track_id text not null references public.tracks(id) on delete cascade,
  position double precision not null,   -- fractional index: a move is one update
  added_by uuid references public.profiles(id) on delete set null,
  added_at timestamptz not null default now()
);
create index on public.playlist_items (playlist_id, position);

create table public.playlist_collaborators (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (playlist_id, user_id)
);
create index on public.playlist_collaborators (user_id);

create table public.saved_tracks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id text not null references public.tracks(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, track_id)
);
create index on public.saved_tracks (user_id, saved_at desc);

create table public.saved_albums (
  user_id uuid not null references public.profiles(id) on delete cascade,
  album_id text not null references public.albums(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, album_id)
);

create table public.follows (
  user_id uuid not null references public.profiles(id) on delete cascade,
  artist_id text not null references public.artists(id) on delete cascade,
  followed_at timestamptz not null default now(),
  primary key (user_id, artist_id)
);

create table public.library_pins (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id text not null,                 -- 'liked' or a playlist/album/artist id
  pinned_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table public.play_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id text not null references public.tracks(id) on delete cascade,
  context_type text check (context_type in ('album','playlist','artist','search','liked','radio')),
  context_id text,
  context_name text,
  ms_played integer not null default 0 check (ms_played >= 0),
  played_at timestamptz not null default now()
);
create index on public.play_history (user_id, played_at desc);

-- ───────────────────────── billing ─────────────────────────
create table public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  plan text not null default 'free' check (plan in ('free','creador','estudio')),
  status text not null default 'active' check (status in ('active','trialing','past_due','canceled','incomplete','unpaid')),
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table public.stripe_events (          -- webhook idempotency
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

-- ───────────────────────── access helpers ─────────────────────────
-- security definer so policies can check playlists without recursing into RLS.
create function public.can_read_playlist(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from playlists p where p.id = pid and (p.is_public or p.owner_id = auth.uid()))
      or exists (select 1 from playlist_collaborators c where c.playlist_id = pid and c.user_id = auth.uid());
$$;
create function public.can_edit_playlist(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from playlists p where p.id = pid and p.owner_id = auth.uid())
      or exists (select 1 from playlists p join playlist_collaborators c on c.playlist_id = p.id
                 where p.id = pid and p.is_collaborative and c.user_id = auth.uid());
$$;

create function public.is_collaborator(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from playlist_collaborators c where c.playlist_id = pid and c.user_id = auth.uid());
$$;
create function public.is_playlist_owner(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from playlists p where p.id = pid and p.owner_id = auth.uid());
$$;

-- Account deletion that actually deletes: removes the auth user, everything cascades.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- updated_at
create function public.touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger touch before update on public.profiles for each row execute function public.touch();
create trigger touch before update on public.playlists for each row execute function public.touch();

-- ───────────────────────── row level security ─────────────────────────
alter table public.profiles enable row level security;
alter table public.artists enable row level security;
alter table public.albums enable row level security;
alter table public.tracks enable row level security;
alter table public.licence_snapshots enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_items enable row level security;
alter table public.playlist_collaborators enable row level security;
alter table public.saved_tracks enable row level security;
alter table public.saved_albums enable row level security;
alter table public.follows enable row level security;
alter table public.library_pins enable row level security;
alter table public.play_history enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stripe_events enable row level security;   -- no policies: service role only

-- catalogue: anyone reads, only the service role writes
create policy catalogue_read on public.artists for select using (true);
create policy catalogue_read on public.albums for select using (true);
create policy catalogue_read on public.tracks for select using (true);
create policy own_read on public.licence_snapshots for select to authenticated using (true);

-- profiles: public names, edit your own
create policy profile_read on public.profiles for select using (true);
create policy profile_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- owner-only rows
create policy own_rows on public.saved_tracks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on public.saved_albums for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on public.follows for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on public.library_pins for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on public.play_history for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_read on public.subscriptions for select to authenticated using (user_id = auth.uid());  -- writes: webhook (service role)

-- playlists
-- Checked on the row itself (not via can_read_playlist) so INSERT ... RETURNING
-- sees the new row: a stable function's snapshot does not include it yet.
create policy pl_read on public.playlists for select using (
  is_public or owner_id = auth.uid()
  or public.is_collaborator(id));
create policy pl_insert on public.playlists for insert to authenticated with check (owner_id = auth.uid());
create policy pl_update on public.playlists for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy pl_delete on public.playlists for delete to authenticated using (owner_id = auth.uid());

create policy items_read on public.playlist_items for select using (public.can_read_playlist(playlist_id));
create policy items_insert on public.playlist_items for insert to authenticated with check (public.can_edit_playlist(playlist_id) and added_by = auth.uid());
create policy items_update on public.playlist_items for update to authenticated using (public.can_edit_playlist(playlist_id)) with check (public.can_edit_playlist(playlist_id));
create policy items_delete on public.playlist_items for delete to authenticated using (public.can_edit_playlist(playlist_id));

create policy collab_read on public.playlist_collaborators for select to authenticated using (user_id = auth.uid() or public.can_edit_playlist(playlist_id));
create policy collab_insert on public.playlist_collaborators for insert to authenticated with check (public.is_playlist_owner(playlist_id));
create policy collab_delete on public.playlist_collaborators for delete to authenticated using (public.is_playlist_owner(playlist_id) or user_id = auth.uid());
