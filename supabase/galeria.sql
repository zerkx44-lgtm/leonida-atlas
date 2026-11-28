-- ═════════ GALERÍA DE LA COMUNIDAD (capturas del juego + fuegos ❤️‍🔥) ═════════
-- Reglas que aplica la base de datos:
--   * Para subir o dar fuego hay que entrar a la comunidad (cuenta anónima con captcha, la misma del chat).
--   * Cada foto entra como 'pendiente' y solo se ve en la galería cuando un moderador la aprueba.
--   * Cada quien sube solo dentro de su carpeta del almacenamiento (<su id>/...), solo .webp o .jpg, máx. 1 MB.
--   * Máximo 3 fotos en revisión y 8 por día por persona; 40 por hora en todo el sitio.
--   * Groserías en el título o el lugar → se rechaza. Usuarios bloqueados del chat tampoco suben.
--   * 3 reportes de personas distintas regresan la foto a revisión.
--   * Fuegos: uno por persona y foto, solo a fotos aprobadas y no a las propias.

-- Almacenamiento: carpeta pública "galeria" (las rutas llevan identificadores aleatorios
-- y nadie puede listar su contenido).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('galeria', 'galeria', true, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.galeria_fotos (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  apodo        text not null check (char_length(apodo) between 2 and 24),
  titulo       text not null check (char_length(titulo) between 3 and 80),
  zona         text check (char_length(zona) <= 60),
  ruta         text not null unique check (ruta ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg)$'),
  ruta_mini    text not null,
  ancho        int check (ancho between 1 and 4000),
  alto         int check (alto between 1 and 4000),
  estado       text not null default 'pendiente' check (estado in ('pendiente', 'aprobado')),
  fuegos       int not null default 0,
  reportes     int not null default 0,
  revisado_at  timestamptz,
  revisado_por uuid references auth.users(id)
);
create index if not exists galeria_recientes_idx on public.galeria_fotos (estado, created_at desc);
create index if not exists galeria_fuegos_idx on public.galeria_fotos (estado, fuegos desc, created_at desc);
create index if not exists galeria_usuario_idx on public.galeria_fotos (user_id);

create table if not exists public.galeria_fuegos (
  foto_id    uuid not null references public.galeria_fotos(id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (foto_id, user_id)
);
create index if not exists galeria_fuegos_usuario_idx on public.galeria_fuegos (user_id);

create table if not exists public.galeria_reportes (
  foto_id    uuid not null references public.galeria_fotos(id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (foto_id, user_id)
);

-- ¿La cuenta está bloqueada en el chat? (también aplica a la galería)
create or replace function privado.bloqueado() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.chat_bloqueados b where b.user_id = auth.uid() and (b.hasta is null or b.hasta > now()));
$$;
revoke execute on function privado.bloqueado() from public;
grant execute on function privado.bloqueado() to authenticated;

create or replace function public.galeria_antes_insertar() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  texto_n text;
  pegado text;
begin
  if auth.uid() is null then raise exception 'Entra a la comunidad para subir fotos'; end if;
  if privado.bloqueado() then raise exception 'Tu cuenta está bloqueada por un moderador'; end if;
  new.user_id := auth.uid();
  new.created_at := now();
  new.estado := 'pendiente';
  new.fuegos := 0; new.reportes := 0; new.revisado_at := null; new.revisado_por := null;
  new.titulo := btrim(regexp_replace(new.titulo, '\s+', ' ', 'g'));
  new.zona := nullif(btrim(regexp_replace(coalesce(new.zona, ''), '\s+', ' ', 'g')), '');
  new.apodo := btrim(new.apodo);

  -- La foto debe estar en la carpeta de quien la sube, y su miniatura junto a ella.
  if split_part(new.ruta, '/', 1) <> auth.uid()::text then raise exception 'Ruta de foto no válida'; end if;
  new.ruta_mini := regexp_replace(new.ruta, '\.(webp|jpg)$', '_m.\1');
  if not exists (select 1 from storage.objects o where o.bucket_id = 'galeria' and o.name = new.ruta)
     or not exists (select 1 from storage.objects o where o.bucket_id = 'galeria' and o.name = new.ruta_mini) then
    raise exception 'No se encontró la foto subida; vuelve a intentarlo';
  end if;

  if not privado.es_admin() then
    if (select count(*) from galeria_fotos where user_id = auth.uid() and estado = 'pendiente') >= 3 then
      raise exception 'Ya tienes 3 fotos en revisión; espera a que las aprueben';
    end if;
    if (select count(*) from galeria_fotos where user_id = auth.uid() and created_at > now() - interval '1 day') >= 8 then
      raise exception 'Llegaste al límite de 8 fotos por día';
    end if;
    if (select count(*) from galeria_fotos where created_at > now() - interval '1 hour') >= 40 then
      raise exception 'Hay muchas fotos en revisión; intenta en un rato';
    end if;
  end if;

  texto_n := lower(extensions.unaccent(new.titulo || ' ' || coalesce(new.zona, '') || ' ' || new.apodo));
  pegado := regexp_replace(texto_n, '[^a-z]', '', 'g');
  if exists (select 1 from palabras_bloqueadas p where texto_n ~ ('\m' || p.palabra) or (char_length(p.palabra) >= 6 and pegado like '%' || p.palabra || '%')) then
    raise exception 'El título tiene lenguaje no permitido';
  end if;
  if texto_n ~ '(https?://|www\.)' then raise exception 'No se permiten links en el título'; end if;
  return new;
end $$;
drop trigger if exists galeria_antes_insertar on public.galeria_fotos;
create trigger galeria_antes_insertar before insert on public.galeria_fotos for each row execute function public.galeria_antes_insertar();

-- Al moderar (cambio de estado o título) se guarda quién y cuándo.
create or replace function public.galeria_antes_actualizar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.created_at := old.created_at; new.user_id := old.user_id; new.ruta := old.ruta; new.ruta_mini := old.ruta_mini;
  if new.estado is distinct from old.estado or new.titulo is distinct from old.titulo or new.zona is distinct from old.zona then
    if privado.es_admin() then new.revisado_at := now(); new.revisado_por := auth.uid(); end if;
    if new.estado = 'aprobado' and old.estado <> 'aprobado' then new.reportes := 0; delete from galeria_reportes where foto_id = new.id; end if;
  end if;
  return new;
end $$;
drop trigger if exists galeria_antes_actualizar on public.galeria_fotos;
create trigger galeria_antes_actualizar before update on public.galeria_fotos for each row execute function public.galeria_antes_actualizar();

create or replace function public.galeria_antes_fuego() returns trigger
language plpgsql security definer set search_path = public as $$
declare f record;
begin
  if auth.uid() is null then raise exception 'Entra a la comunidad para dar fuego'; end if;
  new.user_id := auth.uid(); new.created_at := now();
  select user_id, estado into f from galeria_fotos where id = new.foto_id;
  if f.estado is distinct from 'aprobado' then raise exception 'Esa foto no está publicada'; end if;
  if f.user_id = auth.uid() then raise exception 'No puedes darle fuego a tu propia foto'; end if;
  if (select count(*) from galeria_fuegos where user_id = auth.uid() and created_at > now() - interval '1 hour') >= 120 then
    raise exception 'Vas muy rápido; espera un momento';
  end if;
  return new;
end $$;
drop trigger if exists galeria_antes_fuego on public.galeria_fuegos;
create trigger galeria_antes_fuego before insert on public.galeria_fuegos for each row execute function public.galeria_antes_fuego();

create or replace function public.galeria_contar_fuegos() returns trigger
language plpgsql security definer set search_path = public as $$
declare fid uuid := coalesce(new.foto_id, old.foto_id);
begin
  update galeria_fotos set fuegos = (select count(*) from galeria_fuegos where foto_id = fid) where id = fid;
  return null;
end $$;
drop trigger if exists galeria_contar_fuegos on public.galeria_fuegos;
create trigger galeria_contar_fuegos after insert or delete on public.galeria_fuegos for each row execute function public.galeria_contar_fuegos();

create or replace function public.galeria_antes_reportar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Entra a la comunidad para reportar'; end if;
  new.user_id := auth.uid(); new.created_at := now();
  if (select count(*) from galeria_reportes where user_id = auth.uid() and created_at > now() - interval '1 hour') >= 15 then
    raise exception 'Demasiados reportes en poco tiempo';
  end if;
  return new;
end $$;
drop trigger if exists galeria_antes_reportar on public.galeria_reportes;
create trigger galeria_antes_reportar before insert on public.galeria_reportes for each row execute function public.galeria_antes_reportar();

create or replace function public.galeria_tras_reporte() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from galeria_reportes where foto_id = new.foto_id;
  update galeria_fotos set reportes = n, estado = case when n >= 3 then 'pendiente' else estado end where id = new.foto_id;
  return null;
end $$;
drop trigger if exists galeria_tras_reporte on public.galeria_reportes;
create trigger galeria_tras_reporte after insert on public.galeria_reportes for each row execute function public.galeria_tras_reporte();

revoke execute on function public.galeria_antes_insertar(), public.galeria_antes_actualizar(), public.galeria_antes_fuego(),
  public.galeria_contar_fuegos(), public.galeria_antes_reportar(), public.galeria_tras_reporte() from public, anon, authenticated;

alter table public.galeria_fotos enable row level security;
alter table public.galeria_fuegos enable row level security;
alter table public.galeria_reportes enable row level security;

drop policy if exists "galeria leer" on public.galeria_fotos;
create policy "galeria leer" on public.galeria_fotos for select
  using (estado = 'aprobado' or user_id = (select auth.uid()) or privado.es_admin());
drop policy if exists "galeria subir" on public.galeria_fotos;
create policy "galeria subir" on public.galeria_fotos for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "galeria moderar" on public.galeria_fotos;
create policy "galeria moderar" on public.galeria_fotos for update to authenticated using (privado.es_admin()) with check (privado.es_admin());
drop policy if exists "galeria borrar" on public.galeria_fotos;
create policy "galeria borrar" on public.galeria_fotos for delete to authenticated using (user_id = (select auth.uid()) or privado.es_admin());

drop policy if exists "ver mis fuegos" on public.galeria_fuegos;
create policy "ver mis fuegos" on public.galeria_fuegos for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "dar fuego" on public.galeria_fuegos;
create policy "dar fuego" on public.galeria_fuegos for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "quitar fuego" on public.galeria_fuegos;
create policy "quitar fuego" on public.galeria_fuegos for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "reportar foto" on public.galeria_reportes;
create policy "reportar foto" on public.galeria_reportes for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "admin ve reportes de fotos" on public.galeria_reportes;
create policy "admin ve reportes de fotos" on public.galeria_reportes for select to authenticated using (privado.es_admin());

revoke all on public.galeria_fotos, public.galeria_fuegos, public.galeria_reportes from anon, authenticated;
grant select (id, created_at, user_id, apodo, titulo, zona, ruta, ruta_mini, ancho, alto, estado, fuegos, reportes) on public.galeria_fotos to anon, authenticated;
grant insert (apodo, titulo, zona, ruta, ancho, alto) on public.galeria_fotos to authenticated;
grant update (estado, titulo, zona) on public.galeria_fotos to authenticated;
grant delete on public.galeria_fotos to authenticated;
grant select (foto_id, user_id), insert (foto_id), delete on public.galeria_fuegos to authenticated;
grant select, insert (foto_id) on public.galeria_reportes to authenticated;

-- Archivos: cada quien sube y borra solo en su carpeta; moderadores borran cualquiera.
drop policy if exists "galeria subir archivo" on storage.objects;
create policy "galeria subir archivo" on storage.objects for insert to authenticated
  with check (bucket_id = 'galeria' and (storage.foldername(name))[1] = (select auth.uid())::text
              and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}(_m)?\.(webp|jpg)$' and not privado.bloqueado());
drop policy if exists "galeria borrar archivo" on storage.objects;
create policy "galeria borrar archivo" on storage.objects for delete to authenticated
  using (bucket_id = 'galeria' and ((storage.foldername(name))[1] = (select auth.uid())::text or privado.es_admin()));
-- El borrado por la API de almacenamiento necesita poder "ver" el archivo.
drop policy if exists "galeria ver archivo propio" on storage.objects;
create policy "galeria ver archivo propio" on storage.objects for select to authenticated
  using (bucket_id = 'galeria' and ((storage.foldername(name))[1] = (select auth.uid())::text or privado.es_admin()));
