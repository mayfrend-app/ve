-- ============================================================================
-- VE·LOBBY — Esquema de Supabase
-- Ejecuta TODO este archivo en: Supabase Dashboard → SQL Editor → New query
-- ============================================================================

-- 1) Función que decide si el usuario autenticado es administrador
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

-- 2) Tabla de contenido del lobby (videos, banners, anuncios, apps, códigos, notas)
create table if not exists public.content (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('video','banner','anuncio','app','codigo','nota')),
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

-- 3) Tabla de administradores (correos de Google autorizados)
create table if not exists public.admins (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.content enable row level security;
alter table public.admins  enable row level security;

-- Contenido: lectura pública, escritura solo para admins
drop policy if exists "content_public_read" on public.content;
create policy "content_public_read"
  on public.content for select
  using (true);

drop policy if exists "content_admin_insert" on public.content;
create policy "content_admin_insert"
  on public.content for insert
  with check (public.is_admin());

drop policy if exists "content_admin_update" on public.content;
create policy "content_admin_update"
  on public.content for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "content_admin_delete" on public.content;
create policy "content_admin_delete"
  on public.content for delete
  using (public.is_admin());

-- Admins: cualquier usuario autenticado puede consultar la lista
-- (necesario para que la webapp verifique permisos tras el login con Google)
drop policy if exists "admins_authenticated_read" on public.admins;
create policy "admins_authenticated_read"
  on public.admins for select
  to authenticated
  using (true);

-- El PRIMER inicio de sesión con Google se auto-registra como admin
-- (solo cuando la tabla está vacía; después la tabla queda cerrada)
drop policy if exists "admins_first_insert" on public.admins;
create policy "admins_first_insert"
  on public.admins for insert
  to authenticated
  with check ((select count(*) from public.admins) = 0);

-- Solo un admin puede modificar la lista de admins
drop policy if exists "admins_admin_update" on public.admins;
create policy "admins_admin_update"
  on public.admins for update
  using (public.is_admin());

drop policy if exists "admins_admin_delete" on public.admins;
create policy "admins_admin_delete"
  on public.admins for delete
  using (public.is_admin());

-- ============================================================================
-- Tiempo real: publica los cambios de "content" a todos los dispositivos
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'content'
  ) then
    alter publication supabase_realtime add table public.content;
  end if;
end $$;

-- ============================================================================
-- Para agregar más administradores más adelante (cambia el correo):
--   insert into public.admins (email) values ('TU_CORREO@gmail.com');
-- ============================================================================
