-- Leonida Atlas — base de datos para aportes moderados (Supabase / Postgres).
-- Pégalo completo en Supabase → SQL Editor → Run.
-- Reglas clave:
--   * Cualquiera puede ENVIAR un aporte, pero siempre entra como 'pendiente'.
--   * El público solo puede LEER aportes 'aprobado'.
--   * Solo usuarios en la tabla `admins` pueden ver pendientes, aprobar, rechazar o borrar.
--   * La base vuelve a revisar groserías (tabla palabras_bloqueadas) y marca banderas;
--     saltarse el filtro del navegador no sirve para publicar nada.

create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;

-- ───────── Tablas ─────────
create table if not exists public.aportes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  tipo        text not null default 'nuevo' check (tipo in ('nuevo', 'correccion')),
  poi_ref     text check (char_length(poi_ref) <= 80),
  titulo      text not null check (char_length(titulo) between 3 and 80),
  mensaje     text not null check (char_length(mensaje) between 10 and 600),
  categoria   text not null check (char_length(categoria) <= 40),
  video_url   text check (char_length(video_url) <= 300),
  apodo       text check (char_length(apodo) <= 30),
  x           real not null check (x between 0 and 1000),
  y           real not null check (y between 0 and 1300),
  estado      text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado')),
  banderas    text[] not null default '{}',
  nota_admin  text,
  revisado_at timestamptz,
  revisado_por uuid references auth.users(id)
);
create index if not exists aportes_estado_idx on public.aportes (estado, created_at desc);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  creado  timestamptz not null default now()
);

create table if not exists public.palabras_bloqueadas (palabra text primary key);
insert into public.palabras_bloqueadas (palabra) values
  ('pendej'),('chingad'),('verga'),('culer'),('cabron'),('puta'),('puto'),('mamon'),('pinche'),('joto'),('maricon'),
  ('zorra'),('mierda'),('hijodeputa'),('hijueputa'),('malparid'),('gilipoll'),('imbecil'),('estupid'),('idiota'),
  ('fuck'),('shit'),('bitch'),('asshole'),('cunt'),('nigg'),('fagg'),('retard'),('whore'),('slut'),('porn')
on conflict do nothing;

-- ───────── Funciones ─────────
-- es_admin vive en un esquema privado (no expuesto por la API) para que nadie pueda llamarla por /rpc.
create schema if not exists privado;
grant usage on schema privado to anon, authenticated;
drop function if exists public.es_admin() cascade;
create or replace function privado.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Antes de insertar: forzar estado pendiente, validar video y calcular banderas.
create or replace function public.aportes_antes_insertar() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  texto text := lower(extensions.unaccent(coalesce(new.titulo,'') || ' ' || coalesce(new.mensaje,'') || ' ' || coalesce(new.apodo,'')));
  pegado text := regexp_replace(texto, '[^a-z]', '', 'g');
  hits text[];
  recientes int;
begin
  new.estado := 'pendiente';
  new.created_at := now();
  new.nota_admin := null; new.revisado_at := null; new.revisado_por := null;

  if new.video_url is not null and new.video_url !~* '^https://([a-z0-9-]+\.)*(youtube\.com|youtu\.be|tiktok\.com|x\.com|twitter\.com|instagram\.com|facebook\.com|fb\.watch|twitch\.tv|kick\.com)/' then
    raise exception 'Enlace de video no permitido';
  end if;

  -- Freno anti-spam simple: máximo 30 aportes por minuto en todo el sitio.
  select count(*) into recientes from public.aportes where created_at > now() - interval '1 minute';
  if recientes >= 30 then raise exception 'Demasiados envíos, intenta en un minuto'; end if;

  select array_agg(palabra) into hits from public.palabras_bloqueadas
   where texto ~ ('\m' || palabra) or (char_length(palabra) >= 6 and pegado like '%' || palabra || '%');

  -- Las banderas del navegador se conservan (solo texto corto) y se suman las del servidor.
  new.banderas := coalesce((select array_agg(left(b, 40)) from (select b from unnest(coalesce(new.banderas, '{}'::text[])) b limit 6) s), '{}');
  if hits is not null then new.banderas := new.banderas || ('groseria: ' || array_to_string(hits, ', ')); end if;
  if texto ~ '(https?://|www\.)' then new.banderas := new.banderas || 'link en el texto'::text; end if;
  return new;
end $$;

drop trigger if exists aportes_antes_insertar on public.aportes;
create trigger aportes_antes_insertar before insert on public.aportes
  for each row execute function public.aportes_antes_insertar();

-- Al moderar: guardar quién y cuándo.
create or replace function public.aportes_antes_actualizar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.revisado_at := now();
  new.revisado_por := auth.uid();
  new.created_at := old.created_at;
  return new;
end $$;
drop trigger if exists aportes_antes_actualizar on public.aportes;
create trigger aportes_antes_actualizar before update on public.aportes
  for each row execute function public.aportes_antes_actualizar();

-- Las funciones de los triggers no deben poder llamarse desde la API.
revoke execute on function public.aportes_antes_insertar() from public, anon, authenticated;
revoke execute on function public.aportes_antes_actualizar() from public, anon, authenticated;
revoke execute on function privado.es_admin() from public;
grant execute on function privado.es_admin() to anon, authenticated;

-- ───────── Seguridad (RLS) ─────────
alter table public.aportes enable row level security;
alter table public.admins enable row level security;
alter table public.palabras_bloqueadas enable row level security;

drop policy if exists "leer aprobados o admin" on public.aportes;
create policy "leer aprobados o admin" on public.aportes for select
  using (estado = 'aprobado' or privado.es_admin());

drop policy if exists "cualquiera envia pendiente" on public.aportes;
create policy "cualquiera envia pendiente" on public.aportes for insert
  with check (estado = 'pendiente');

drop policy if exists "admin modera" on public.aportes;
create policy "admin modera" on public.aportes for update
  using (privado.es_admin()) with check (privado.es_admin());

drop policy if exists "admin borra" on public.aportes;
create policy "admin borra" on public.aportes for delete using (privado.es_admin());

drop policy if exists "admin ve admins" on public.admins;
create policy "admin ve admins" on public.admins for select using (privado.es_admin());
-- palabras_bloqueadas: sin políticas = nadie la lee desde la API (solo el trigger).

-- Columnas que el público NO puede escribir al enviar.
revoke all on public.aportes from anon, authenticated;
revoke all on public.admins from anon, authenticated;
revoke all on public.palabras_bloqueadas from anon, authenticated;
grant insert (tipo, poi_ref, titulo, mensaje, categoria, video_url, apodo, x, y, banderas) on public.aportes to anon, authenticated;
grant select on public.aportes to anon, authenticated;
grant update (titulo, mensaje, categoria, video_url, apodo, estado, nota_admin) on public.aportes to authenticated;
grant delete on public.aportes to authenticated;
grant select on public.admins to authenticated;

-- ───────── Dar de alta a un moderador ─────────
-- 1) Supabase → Authentication → Users → "Add user" (correo + contraseña).
-- 2) Corre esto con su correo:
-- insert into public.admins (user_id) select id from auth.users where email = 'TU_CORREO_AQUI';
