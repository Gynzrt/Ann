-- ayas.kys schema: profiles, links, views, uploads.
-- Run with `supabase db push` or paste into the SQL editor of your project.

create extension if not exists pgcrypto;

create sequence if not exists public.profile_uid_seq;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_.]{1,20}$'),
  display_name text not null default '',
  bio text not null default '' check (char_length(bio) <= 500),
  location text not null default '' check (char_length(location) <= 60),
  avatar_url text not null default '',
  badges text[] not null default '{}',
  views integer not null default 0,
  uid integer not null unique default nextval('public.profile_uid_seq'),
  premium boolean not null default false,
  appearance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null,
  url text not null check (char_length(url) <= 500),
  label text,
  position integer not null default 0
);
create index links_user_idx on public.links (user_id, position);

create table public.profile_views (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  visitor text not null,
  day date not null default current_date,
  primary key (profile_id, visitor, day)
);

-- Row level security ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.links enable row level security;
alter table public.profile_views enable row level security;

create policy "profiles are public" on public.profiles for select using (true);
create policy "owners update profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "links are public" on public.links for select using (true);
create policy "owners insert links" on public.links for insert with check (auth.uid() = user_id);
create policy "owners update links" on public.links for update using (auth.uid() = user_id);
create policy "owners delete links" on public.links for delete using (auth.uid() = user_id);

create policy "owners read their views" on public.profile_views for select using (auth.uid() = profile_id);

create or replace function public.selectable_badges() returns text[]
language sql immutable as $$ select array['developer','creator','gamer','supporter','og','competitor'] $$;

-- Users cannot change counters or premium status from the client.
create or replace function public.protect_profile_columns() returns trigger
language plpgsql as $$
begin
  if auth.role() = 'authenticated' then
    new.views := old.views;
    new.uid := old.uid;
    new.premium := old.premium;
    -- System badges stay as they were; self-selectable ones may be toggled.
    new.badges := array(
      select b from unnest(old.badges) b where b not in (select unnest(public.selectable_badges()))
      union
      select b from unnest(new.badges) b where b in (select unnest(public.selectable_badges()))
    );
    new.created_at := old.created_at;
  end if;
  return new;
end $$;
create trigger protect_profile_columns before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Create the profile row when someone signs up (username comes from sign-up metadata).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  uname text := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  v_uid integer := nextval('public.profile_uid_seq');
begin
  if uname !~ '^[a-z0-9_.]{1,20}$' then
    uname := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  insert into public.profiles (id, username, display_name, uid, badges)
  values (new.id, uname, uname, v_uid,
          case when v_uid <= 100 then array['early'] else '{}'::text[] end);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- One view per visitor per day. Callable by anyone.
create or replace function public.record_view(p_username text, p_visitor text) returns integer
language plpgsql security definer set search_path = public as $$
declare
  pid uuid;
  total integer;
begin
  select id into pid from profiles where username = lower(p_username);
  if pid is null then return 0; end if;
  insert into profile_views (profile_id, visitor) values (pid, left(p_visitor, 64))
    on conflict do nothing;
  if found then
    update profiles set views = views + 1 where id = pid returning views into total;
  else
    select views into total from profiles where id = pid;
  end if;
  return total;
end $$;
grant execute on function public.record_view(text, text) to anon, authenticated;

create or replace function public.username_available(p_username text) returns boolean
language sql security definer set search_path = public as $$
  select not exists (select 1 from profiles where username = lower(p_username) and id is distinct from auth.uid());
$$;
grant execute on function public.username_available(text) to anon, authenticated;

create or replace function public.delete_me() returns void
language sql security definer set search_path = public, auth as $$
  delete from auth.users where id = auth.uid();
$$;
grant execute on function public.delete_me() to authenticated;

-- Storage --------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('media', 'media', true)
  on conflict (id) do nothing;

create policy "media is public" on storage.objects for select using (bucket_id = 'media');
create policy "users upload to own folder" on storage.objects for insert
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own files" on storage.objects for delete
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
