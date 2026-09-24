-- =====================================================================
--  SCHOOLCHECK · Esquema de base de datos para Supabase (PostgreSQL)
--  Pégalo completo en Supabase -> SQL Editor -> New query -> Run.
--  Es seguro ejecutarlo más de una vez.
-- =====================================================================

-- ---------- TABLAS ----------
create table if not exists public.jornadas (
  id              text primary key,
  nombre_jornada  text    not null,
  hora_inicio     time    not null,
  hora_fin        time    not null,
  hora_limite     time    not null,
  tolerancia_min  integer not null default 5 check (tolerancia_min >= 0)
);

-- Perfil de cada persona con acceso. El id es el mismo de su cuenta en
-- Supabase Auth (las contraseñas las guarda Auth, cifradas, no esta tabla).
create table if not exists public.usuarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  correo      text not null,
  rol         text not null check (rol in ('coordinador','directivo')),
  id_jornada  text references public.jornadas(id) on delete set null
);
create unique index if not exists usuarios_correo_unico on public.usuarios (lower(correo));

create table if not exists public.estudiantes (
  id                text primary key,
  nombre            text not null,
  curso             text not null,
  numero_documento  text not null unique,
  email_acudiente   text,
  codigo_qr         text not null unique,
  foto              text,
  estado            text not null default 'Activo'
);

create table if not exists public.registros (
  id             text primary key,
  id_estudiante  text not null references public.estudiantes(id) on delete cascade,
  id_usuario     uuid references public.usuarios(id) on delete set null,
  fecha          date not null,
  hora_ingreso   time not null,
  tipo_registro  text not null check (tipo_registro in ('Puntual','Retardo')),
  metodo         text
);
create index if not exists registros_fecha_idx      on public.registros (fecha);
create index if not exists registros_estudiante_idx on public.registros (id_estudiante);

-- ---------- JORNADAS INICIALES (deben coincidir con js/config.js) ----------
insert into public.jornadas (id, nombre_jornada, hora_inicio, hora_fin, hora_limite, tolerancia_min) values
  ('J1','Mañana','06:00','12:00','06:00',5),
  ('J2','Tarde', '12:30','18:00','12:30',5),
  ('J3','Noche', '18:00','22:00','18:00',5)
on conflict (id) do nothing;

-- ---------- FUNCIONES AUXILIARES ----------
-- Rol y jornada de quien hace la consulta (null si no tiene perfil).
create or replace function public.mi_rol() returns text
  language sql stable security definer set search_path = public as
$$ select rol from public.usuarios where id = auth.uid() $$;

create or replace function public.mi_jornada() returns text
  language sql stable security definer set search_path = public as
$$ select id_jornada from public.usuarios where id = auth.uid() $$;

-- Elimina la cuenta de acceso de un coordinador (solo lo puede pedir un directivo).
create or replace function public.eliminar_usuario(p_id uuid) returns void
  language plpgsql security definer set search_path = public, auth as
$$
begin
  if public.mi_rol() is distinct from 'directivo' then
    raise exception 'Solo un directivo puede eliminar usuarios';
  end if;
  if p_id = auth.uid() then
    raise exception 'No puedes eliminar tu propia cuenta';
  end if;
  delete from auth.users where id = p_id;
end;
$$;
revoke all on function public.eliminar_usuario(uuid) from public, anon;
grant execute on function public.eliminar_usuario(uuid) to authenticated;

-- ---------- SEGURIDAD (RLS) ----------
-- Regla base: solo entra quien tiene una fila en "usuarios". Una persona que
-- se registre por su cuenta en Supabase Auth NO tiene perfil, así que no ve nada.
alter table public.jornadas    enable row level security;
alter table public.usuarios    enable row level security;
alter table public.estudiantes enable row level security;
alter table public.registros   enable row level security;

-- Limpia políticas anteriores para poder re-ejecutar el script
do $$
declare p record;
begin
  for p in select policyname, tablename from pg_policies
           where schemaname = 'public' and tablename in ('jornadas','usuarios','estudiantes','registros')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- jornadas: todos con perfil leen; solo el directivo modifica
create policy jornadas_ver   on public.jornadas for select to authenticated using (public.mi_rol() is not null);
create policy jornadas_admin on public.jornadas for all    to authenticated
  using (public.mi_rol() = 'directivo') with check (public.mi_rol() = 'directivo');

-- usuarios: todos con perfil leen; el directivo administra; cada quien puede
-- cambiar su propio nombre pero no su rol ni su jornada
create policy usuarios_ver   on public.usuarios for select to authenticated using (public.mi_rol() is not null);
create policy usuarios_admin on public.usuarios for all    to authenticated
  using (public.mi_rol() = 'directivo') with check (public.mi_rol() = 'directivo');
create policy usuarios_propio on public.usuarios for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and rol = public.mi_rol() and id_jornada is not distinct from public.mi_jornada());

-- estudiantes: cualquier persona con perfil los consulta y administra
create policy estudiantes_todo on public.estudiantes for all to authenticated
  using (public.mi_rol() is not null) with check (public.mi_rol() is not null);

-- registros: con perfil se leen, se crean y se corrigen; solo el directivo borra
create policy registros_ver    on public.registros for select to authenticated using (public.mi_rol() is not null);
create policy registros_crear  on public.registros for insert to authenticated with check (public.mi_rol() is not null);
create policy registros_editar on public.registros for update to authenticated
  using (public.mi_rol() is not null) with check (public.mi_rol() is not null);
create policy registros_borrar on public.registros for delete to authenticated using (public.mi_rol() = 'directivo');

-- =====================================================================
--  PRIMER DIRECTIVO (hazlo una sola vez, DESPUÉS de correr todo lo anterior)
--  1) Supabase -> Authentication -> Users -> Add user -> Create new user
--     Escribe tu correo y una contraseña y marca "Auto Confirm User".
--  2) Cambia el correo de abajo por el mismo y ejecuta SOLO este bloque:
-- =====================================================================
-- insert into public.usuarios (id, nombre, correo, rol)
-- select id, 'Directivo', email, 'directivo' from auth.users
-- where email = 'TU_CORREO@ejemplo.com';
