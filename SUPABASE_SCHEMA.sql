-- ============================================================
-- COVER APP — Grupo Aislar
-- Schema SQL para Supabase
-- Pegar completo en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- ── EXTENSIONES ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── TABLA: profiles (extiende auth.users de Supabase) ───────
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text,
  role        text default 'operario' check (role in ('operario','gerente','admin')),
  avatar_url  text,
  created_at  timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Usuarios ven su propio perfil" on public.profiles for select using (auth.uid() = id);
create policy "Usuarios editan su propio perfil" on public.profiles for update using (auth.uid() = id);
create policy "Todos los autenticados ven perfiles" on public.profiles for select using (auth.role() = 'authenticated');

-- Auto-crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── TABLA: plants (instalaciones) ───────────────────────────
create table public.plants (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  address     text,
  area_m2     numeric,
  membrane    text check (membrane in ('TPO','EPDM','PVC','Asfáltica')),
  grid_rows   integer default 10,
  grid_cols   integer default 10,
  cell_size_m integer default 10,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.plants enable row level security;
create policy "Autenticados ven plantas" on public.plants for select using (auth.role() = 'authenticated');
create policy "Autenticados crean plantas" on public.plants for insert with check (auth.role() = 'authenticated');
create policy "Autenticados editan plantas" on public.plants for update using (auth.role() = 'authenticated');

-- ── TABLA: sectors (celdas del gemelo digital) ──────────────
create table public.sectors (
  id            uuid default uuid_generate_v4() primary key,
  plant_id      uuid references public.plants(id) on delete cascade not null,
  row_index     integer not null,
  col_index     integer not null,
  label         text,
  notes         text,
  rci           integer default 100 check (rci between 0 and 100),
  last_inspected_at timestamptz,
  updated_by    uuid references public.profiles(id),
  updated_at    timestamptz default now(),
  unique(plant_id, row_index, col_index)
);
alter table public.sectors enable row level security;
create policy "Autenticados ven sectores" on public.sectors for select using (auth.role() = 'authenticated');
create policy "Autenticados editan sectores" on public.sectors for all using (auth.role() = 'authenticated');

-- ── TABLA: inspections ──────────────────────────────────────
create table public.inspections (
  id              uuid default uuid_generate_v4() primary key,
  plant_id        uuid references public.plants(id) on delete cascade not null,
  sector_id       uuid references public.sectors(id),
  inspector_id    uuid references public.profiles(id) not null,
  type            text check (type in ('Primavera','Otoño','Post-Evento','Extraordinaria')),
  membrane        text,
  status          text default 'draft' check (status in ('draft','completed')),
  rci             integer check (rci between 0 and 100),
  -- JSA
  jsa_epp         boolean default false,
  jsa_estructura  boolean default false,
  jsa_supervisor  boolean default false,
  jsa_clima       boolean default false,
  jsa_senalizacion boolean default false,
  jsa_anclaje     boolean default false,
  -- Membrana
  memb_cuarteamiento  text,
  memb_ampollas       text,
  memb_granulos       text,
  memb_perforaciones  text,
  memb_uv_deg         text,
  -- Uniones
  union_viento        text,
  union_adhesiva      text,
  union_termico       text,
  -- Drenaje
  drain_embudo        boolean default false,
  drain_agua          boolean default false,
  drain_bajante       boolean default false,
  -- Equipos
  equip_hvac          boolean default false,
  equip_sellos        boolean default false,
  equip_escorrentia   boolean default false,
  -- Cierre
  notes               text,
  signature_url       text,
  completed_at        timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
alter table public.inspections enable row level security;
create policy "Autenticados ven inspecciones" on public.inspections for select using (auth.role() = 'authenticated');
create policy "Inspector crea inspecciones" on public.inspections for insert with check (auth.uid() = inspector_id);
create policy "Inspector edita sus inspecciones" on public.inspections for update using (auth.uid() = inspector_id or exists(select 1 from profiles where id=auth.uid() and role in ('gerente','admin')));

-- ── TABLA: inspection_photos ────────────────────────────────
create table public.inspection_photos (
  id              uuid default uuid_generate_v4() primary key,
  inspection_id   uuid references public.inspections(id) on delete cascade not null,
  step            text not null, -- 'membrana' | 'uniones' | 'drenaje' | 'equipos'
  storage_path    text not null,
  public_url      text,
  lat             numeric,
  lng             numeric,
  taken_at        timestamptz default now(),
  uploaded_by     uuid references public.profiles(id)
);
alter table public.inspection_photos enable row level security;
create policy "Autenticados ven fotos" on public.inspection_photos for select using (auth.role() = 'authenticated');
create policy "Autenticados suben fotos" on public.inspection_photos for insert with check (auth.role() = 'authenticated');

-- ── TABLA: tickets ──────────────────────────────────────────
create table public.tickets (
  id              uuid default uuid_generate_v4() primary key,
  plant_id        uuid references public.plants(id) on delete cascade not null,
  created_by      uuid references public.profiles(id) not null,
  assigned_to     uuid references public.profiles(id),
  severity        text check (severity in ('leve','moderado','critico')) not null,
  status          text default 'abierto' check (status in ('abierto','en_proceso','resuelto')),
  title           text not null,
  description     text,
  sector          text,
  resolution_notes text,
  sla_start_at    timestamptz,
  resolved_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.tickets enable row level security;
create policy "Autenticados ven tickets" on public.tickets for select using (auth.role() = 'authenticated');
create policy "Autenticados crean tickets" on public.tickets for insert with check (auth.role() = 'authenticated');
create policy "Autenticados editan tickets" on public.tickets for update using (auth.role() = 'authenticated');

-- ── TABLA: ticket_photos ────────────────────────────────────
create table public.ticket_photos (
  id          uuid default uuid_generate_v4() primary key,
  ticket_id   uuid references public.tickets(id) on delete cascade not null,
  storage_path text not null,
  public_url  text,
  uploaded_by uuid references public.profiles(id),
  uploaded_at timestamptz default now()
);
alter table public.ticket_photos enable row level security;
create policy "Autenticados ven fotos tickets" on public.ticket_photos for select using (auth.role() = 'authenticated');
create policy "Autenticados suben fotos tickets" on public.ticket_photos for insert with check (auth.role() = 'authenticated');

-- ── STORAGE BUCKETS ─────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('inspection-photos', 'inspection-photos', true);
insert into storage.buckets (id, name, public) values ('ticket-photos', 'ticket-photos', true);
insert into storage.buckets (id, name, public) values ('signatures', 'signatures', true);

create policy "Autenticados suben inspection photos" on storage.objects for insert with check (bucket_id = 'inspection-photos' and auth.role() = 'authenticated');
create policy "Todos ven inspection photos" on storage.objects for select using (bucket_id = 'inspection-photos');
create policy "Autenticados suben ticket photos" on storage.objects for insert with check (bucket_id = 'ticket-photos' and auth.role() = 'authenticated');
create policy "Todos ven ticket photos" on storage.objects for select using (bucket_id = 'ticket-photos');
create policy "Autenticados suben signatures" on storage.objects for insert with check (bucket_id = 'signatures' and auth.role() = 'authenticated');
create policy "Todos ven signatures" on storage.objects for select using (bucket_id = 'signatures');

-- ── FUNCIÓN: recalcular RCI de planta ───────────────────────
create or replace function public.get_plant_avg_rci(plant_uuid uuid)
returns integer as $$
  select coalesce(round(avg(rci))::integer, 100)
  from public.sectors
  where plant_id = plant_uuid;
$$ language sql stable;
