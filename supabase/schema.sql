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

-- ═════════════════════════════════════════════════════════════════════════
-- CHAT DE LA COMUNIDAD
-- Los visitantes entran con una cuenta anónima de Supabase (Auth → "Allow
-- anonymous sign-ins" activado). Reglas que aplica la base de datos:
--   * Groserías, links (salvo videos) y mayúsculas sostenidas → el mensaje se rechaza.
--   * Máximo 1 mensaje cada 6 s y 20 cada 10 min por persona; sin repetir el mismo texto.
--   * Usuarios bloqueados no pueden escribir.
--   * 3 reportes de personas distintas ocultan el mensaje hasta que un moderador lo revise.
--   * Solo moderadores publican avisos oficiales, ocultan, borran y bloquean.
-- ═════════════════════════════════════════════════════════════════════════
create table if not exists public.chat_mensajes (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  apodo       text not null check (char_length(apodo) between 2 and 24),
  texto       text not null check (char_length(texto) between 1 and 300),
  oficial     boolean not null default false,
  oculto      boolean not null default false,
  reportes    int not null default 0
);
create index if not exists chat_mensajes_id_idx on public.chat_mensajes (id desc);

create table if not exists public.chat_reportes (
  mensaje_id bigint not null references public.chat_mensajes(id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  motivo     text check (char_length(motivo) <= 60),
  created_at timestamptz not null default now(),
  primary key (mensaje_id, user_id)
);

create table if not exists public.chat_bloqueados (
  user_id uuid primary key references auth.users(id) on delete cascade,
  motivo  text,
  hasta   timestamptz,           -- null = permanente
  creado  timestamptz not null default now()
);

create or replace function public.chat_antes_insertar() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  texto_n text := lower(extensions.unaccent(coalesce(new.texto,'') || ' ' || coalesce(new.apodo,'')));
  pegado text := regexp_replace(texto_n, '[^a-z]', '', 'g');
  letras text := regexp_replace(coalesce(new.texto,''), '[^[:alpha:]]', '', 'g');
  ultimo record;
begin
  if auth.uid() is null then raise exception 'Necesitas entrar al chat para escribir'; end if;
  new.user_id := auth.uid();
  new.created_at := now();
  new.oculto := false;
  new.reportes := 0;
  new.oficial := coalesce(new.oficial, false) and privado.es_admin();
  new.texto := btrim(regexp_replace(new.texto, '\s+', ' ', 'g'));
  new.apodo := btrim(new.apodo);

  if exists (select 1 from chat_bloqueados b where b.user_id = auth.uid() and (b.hasta is null or b.hasta > now())) then
    raise exception 'No puedes escribir en el chat: tu cuenta está bloqueada por un moderador';
  end if;

  if not privado.es_admin() then
    select created_at, texto into ultimo from chat_mensajes where user_id = auth.uid() order by id desc limit 1;
    if ultimo.created_at is not null and ultimo.created_at > now() - interval '6 seconds' then
      raise exception 'Vas muy rápido: espera unos segundos';
    end if;
    if ultimo.texto is not null and lower(ultimo.texto) = lower(new.texto) and ultimo.created_at > now() - interval '5 minutes' then
      raise exception 'Ya enviaste ese mismo mensaje';
    end if;
    if (select count(*) from chat_mensajes where user_id = auth.uid() and created_at > now() - interval '10 minutes') >= 20 then
      raise exception 'Llegaste al límite de mensajes; intenta en unos minutos';
    end if;
    if exists (select 1 from palabras_bloqueadas p where texto_n ~ ('\m' || p.palabra) or (char_length(p.palabra) >= 6 and pegado like '%' || p.palabra || '%')) then
      raise exception 'Tu mensaje tiene lenguaje no permitido';
    end if;
    if new.texto ~* '(https?://|www\.)' and new.texto !~* '^[^h]*https://([a-z0-9-]+\.)*(youtube\.com|youtu\.be|tiktok\.com|x\.com|twitter\.com|instagram\.com|twitch\.tv|kick\.com)/' then
      raise exception 'Solo se permiten links de videos (YouTube, TikTok, X, Instagram, Twitch o Kick)';
    end if;
    if char_length(letras) > 15 and letras = upper(letras) then
      raise exception 'No escribas todo en mayúsculas';
    end if;
    if new.texto ~ '(.)\1{7,}' then
      raise exception 'Demasiados caracteres repetidos';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists chat_antes_insertar on public.chat_mensajes;
create trigger chat_antes_insertar before insert on public.chat_mensajes for each row execute function public.chat_antes_insertar();

create or replace function public.chat_tras_reporte() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update chat_mensajes m set reportes = (select count(*) from chat_reportes r where r.mensaje_id = m.id),
                             oculto = m.oculto or (select count(*) from chat_reportes r where r.mensaje_id = m.id) >= 3
   where m.id = new.mensaje_id;
  return new;
end $$;
drop trigger if exists chat_tras_reporte on public.chat_reportes;
create trigger chat_tras_reporte after insert on public.chat_reportes for each row execute function public.chat_tras_reporte();

create or replace function public.chat_antes_reportar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Necesitas entrar al chat para reportar'; end if;
  new.user_id := auth.uid(); new.created_at := now();
  if (select count(*) from chat_reportes where user_id = auth.uid() and created_at > now() - interval '1 hour') >= 15 then
    raise exception 'Demasiados reportes en poco tiempo';
  end if;
  return new;
end $$;
drop trigger if exists chat_antes_reportar on public.chat_reportes;
create trigger chat_antes_reportar before insert on public.chat_reportes for each row execute function public.chat_antes_reportar();

revoke execute on function public.chat_antes_insertar() from public, anon, authenticated;
revoke execute on function public.chat_tras_reporte() from public, anon, authenticated;
revoke execute on function public.chat_antes_reportar() from public, anon, authenticated;

alter table public.chat_mensajes enable row level security;
alter table public.chat_reportes enable row level security;
alter table public.chat_bloqueados enable row level security;

drop policy if exists "chat leer" on public.chat_mensajes;
create policy "chat leer" on public.chat_mensajes for select using (not oculto or privado.es_admin());
drop policy if exists "chat escribir" on public.chat_mensajes;
create policy "chat escribir" on public.chat_mensajes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "chat moderar" on public.chat_mensajes;
create policy "chat moderar" on public.chat_mensajes for update to authenticated using (privado.es_admin()) with check (privado.es_admin());
drop policy if exists "chat borrar" on public.chat_mensajes;
create policy "chat borrar" on public.chat_mensajes for delete to authenticated using (privado.es_admin());

drop policy if exists "reportar" on public.chat_reportes;
create policy "reportar" on public.chat_reportes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "admin ve reportes" on public.chat_reportes;
create policy "admin ve reportes" on public.chat_reportes for select to authenticated using (privado.es_admin());

drop policy if exists "admin bloquea" on public.chat_bloqueados;
create policy "admin bloquea" on public.chat_bloqueados for all to authenticated using (privado.es_admin()) with check (privado.es_admin());
drop policy if exists "ver mi bloqueo" on public.chat_bloqueados;
create policy "ver mi bloqueo" on public.chat_bloqueados for select to authenticated using (user_id = auth.uid());

revoke all on public.chat_mensajes, public.chat_reportes, public.chat_bloqueados from anon, authenticated;
grant select (id, created_at, apodo, texto, oficial, oculto, reportes, user_id) on public.chat_mensajes to anon, authenticated;
grant insert (apodo, texto, oficial) on public.chat_mensajes to authenticated;
grant update (oculto, texto) on public.chat_mensajes to authenticated;
grant delete on public.chat_mensajes to authenticated;
grant insert (mensaje_id, motivo) on public.chat_reportes to authenticated;
grant select on public.chat_reportes to authenticated;
grant select, insert, update, delete on public.chat_bloqueados to authenticated;

-- Limpieza: borra mensajes de más de 30 días (correr a mano o con pg_cron si se activa)
-- delete from public.chat_mensajes where created_at < now() - interval '30 days';

-- ═════════ LIMPIEZA AUTOMÁTICA (lo que promete el aviso de privacidad) ═════════
-- Cada hora (minuto 7): borra mensajes del chat con más de 24 h (avisos oficiales: 30 días)
-- y aportes rechazados con más de 30 días.
create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'leonida-limpieza';
select cron.schedule('leonida-limpieza', '7 * * * *', $$
  delete from public.chat_mensajes where not oficial and created_at < now() - interval '24 hours';
  delete from public.chat_mensajes where oficial and created_at < now() - interval '30 days';
  delete from public.aportes where estado = 'rechazado' and coalesce(revisado_at, created_at) < now() - interval '30 days';
$$);

-- ═════════ APOYADORES (insignia ☕ en el chat para quien dona en Ko-fi) ═════════
-- Un moderador marca la cuenta anónima del chat de quien donó. Todos pueden ver
-- quién tiene insignia; solo moderadores pueden darla o quitarla.
create table if not exists public.chat_apoyadores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nota    text check (char_length(nota) <= 120),
  creado  timestamptz not null default now()
);
alter table public.chat_apoyadores enable row level security;
drop policy if exists "ver apoyadores" on public.chat_apoyadores;
create policy "ver apoyadores" on public.chat_apoyadores for select using (true);
drop policy if exists "admin da insignia" on public.chat_apoyadores;
create policy "admin da insignia" on public.chat_apoyadores for insert to authenticated with check (privado.es_admin());
drop policy if exists "admin quita insignia" on public.chat_apoyadores;
create policy "admin quita insignia" on public.chat_apoyadores for delete to authenticated using (privado.es_admin());
revoke all on public.chat_apoyadores from anon, authenticated;
grant select (user_id, creado) on public.chat_apoyadores to anon, authenticated;
grant select, insert, delete on public.chat_apoyadores to authenticated;
