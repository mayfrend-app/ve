-- ============================================================================
-- MAYFREND.VE — Esquema de Supabase
-- Ejecuta TODO este archivo en: Supabase Dashboard → SQL Editor → New query
-- Es seguro volver a ejecutarlo (usa "if not exists" / "or replace").
-- ============================================================================

-- 1) Tablas ------------------------------------------------------------------
create table if not exists public.content (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('video','banner','anuncio','app','descarga','codigo','nota')),
  title       text not null default '',
  description text not null default '',
  url         text not null default '',
  image_url   text not null default '',
  platform    text not null default 'web',
  code_text   text not null default '',
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.admins (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- Migración: si la tabla "content" ya existía con la restricción antigua,
-- se actualiza para aceptar el nuevo tipo "descarga".
alter table public.content drop constraint if exists content_type_check;
alter table public.content
  add constraint content_type_check
  check (type in ('video','banner','anuncio','app','descarga','codigo','nota'));

create table if not exists public.donations (
  id         uuid primary key default gen_random_uuid(),
  method     text not null default 'paypal',
  label      text not null default '',
  detail     text not null default '',
  detail2    text not null default '',
  active     boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 2) Función is_admin --------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admins a
    join auth.users u on u.id = auth.uid()
    where lower(a.email) = lower(u.email)
  );
$$;

-- 3) Row Level Security ------------------------------------------------------
alter table public.content   enable row level security;
alter table public.admins    enable row level security;
alter table public.donations enable row level security;

-- Contenido: lectura pública, escritura solo para admins
drop policy if exists "content_public_read" on public.content;
create policy "content_public_read" on public.content for select using (true);
drop policy if exists "content_admin_insert" on public.content;
create policy "content_admin_insert" on public.content for insert with check (public.is_admin());
drop policy if exists "content_admin_update" on public.content;
create policy "content_admin_update" on public.content for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "content_admin_delete" on public.content;
create policy "content_admin_delete" on public.content for delete using (public.is_admin());

-- Donaciones: lectura pública, escritura solo para admins
drop policy if exists "donations_public_read" on public.donations;
create policy "donations_public_read" on public.donations for select using (true);
drop policy if exists "donations_admin_insert" on public.donations;
create policy "donations_admin_insert" on public.donations for insert with check (public.is_admin());
drop policy if exists "donations_admin_update" on public.donations;
create policy "donations_admin_update" on public.donations for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "donations_admin_delete" on public.donations;
create policy "donations_admin_delete" on public.donations for delete using (public.is_admin());

-- Admins
drop policy if exists "admins_authenticated_read" on public.admins;
create policy "admins_authenticated_read" on public.admins for select to authenticated using (true);
drop policy if exists "admins_first_insert" on public.admins;
create policy "admins_first_insert" on public.admins for insert to authenticated
  with check ((select count(*) from public.admins) = 0);
drop policy if exists "admins_admin_update" on public.admins;
create policy "admins_admin_update" on public.admins for update using (public.is_admin());
drop policy if exists "admins_admin_delete" on public.admins;
create policy "admins_admin_delete" on public.admins for delete using (public.is_admin());

-- 4) Storage: buckets públicos para banners y descargas ----------------------
insert into storage.buckets (id, name, public)
values ('banners', 'banners', true), ('descargas', 'descargas', true)
on conflict (id) do nothing;

drop policy if exists "banners_public_read" on storage.objects;
create policy "banners_public_read" on storage.objects for select using (bucket_id = 'banners');
drop policy if exists "banners_admin_insert" on storage.objects;
create policy "banners_admin_insert" on storage.objects for insert with check (bucket_id = 'banners' and public.is_admin());
drop policy if exists "banners_admin_delete" on storage.objects;
create policy "banners_admin_delete" on storage.objects for delete using (bucket_id = 'banners' and public.is_admin());

drop policy if exists "descargas_public_read" on storage.objects;
create policy "descargas_public_read" on storage.objects for select using (bucket_id = 'descargas');
drop policy if exists "descargas_admin_insert" on storage.objects;
create policy "descargas_admin_insert" on storage.objects for insert with check (bucket_id = 'descargas' and public.is_admin());
drop policy if exists "descargas_admin_delete" on storage.objects;
create policy "descargas_admin_delete" on storage.objects for delete using (bucket_id = 'descargas' and public.is_admin());

-- 4.5) Escáner de public/: archivos agregados por el administrador -----------
-- (se combinan con el manifiesto public/assets.json del repositorio)
create table if not exists public.public_assets (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('app','video','image')),
  name       text not null default '',
  path       text not null,
  note       text not null default '',
  created_at timestamptz not null default now()
);

alter table public.public_assets enable row level security;

drop policy if exists "public_assets_public_read" on public.public_assets;
create policy "public_assets_public_read"
  on public.public_assets for select
  using (true);

drop policy if exists "public_assets_admin_insert" on public.public_assets;
create policy "public_assets_admin_insert"
  on public.public_assets for insert
  with check (public.is_admin());

drop policy if exists "public_assets_admin_update" on public.public_assets;
create policy "public_assets_admin_update"
  on public.public_assets for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "public_assets_admin_delete" on public.public_assets;
create policy "public_assets_admin_delete"
  on public.public_assets for delete
  using (public.is_admin());

-- 5) Tiempo real: publica cambios de content, donations y public_assets ------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'content'
  ) then
    alter publication supabase_realtime add table public.content;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'donations'
  ) then
    alter publication supabase_realtime add table public.donations;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'public_assets'
  ) then
    alter publication supabase_realtime add table public.public_assets;
  end if;
end $$;

-- 6) Administrador inicial ---------------------------------------------------
insert into public.admins (email) values ('v19629049@gmail.com')
on conflict (email) do nothing;

-- ============================================================================
-- Para agregar más administradores:
--   insert into public.admins (email) values ('TU_CORREO@gmail.com');
-- ============================================================================
