create extension if not exists pgcrypto;

create table if not exists public.promo_slides (
  id text primary key,
  title text not null,
  meta text default '',
  image text default '',
  link text default '',
  background text default '#b8b8b8',
  dark boolean default false,
  editor_settings jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.student_events (
  id text primary key,
  title text not null,
  start_date date not null,
  end_date date not null,
  type text not null default 'student-event',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.promo_slides add column if not exists editor_settings jsonb not null default '{}'::jsonb;
alter table public.promo_slides enable row level security;
alter table public.student_events enable row level security;

drop policy if exists "Public can read promo slides" on public.promo_slides;
create policy "Public can read promo slides"
on public.promo_slides
for select
using (active = true);

drop policy if exists "Authenticated can manage promo slides" on public.promo_slides;
create policy "Authenticated can manage promo slides"
on public.promo_slides
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read student events" on public.student_events;
create policy "Public can read student events"
on public.student_events
for select
using (active = true);

drop policy if exists "Authenticated can manage student events" on public.student_events;
create policy "Authenticated can manage student events"
on public.student_events
for all
to authenticated
using (true)
with check (true);

insert into public.promo_slides (id, title, meta, image, link, background, dark, editor_settings, sort_order, active)
values
  ('visual-league', '시각 내전', '행사 기간 : 4월 8일(수)~4월 10일(금)', 'assets/event-banner-poster.jpeg', '', '#b9c0cd', false, '{"imageScale":1,"imageX":50,"imageY":50,"textX":24,"textY":24,"textWidth":54,"overlayOpacity":0.72}', 0, true),
  ('circle-leader-recruitment', '써클장 모집', '기간 : 페이지 확인', '', 'https://forms.gle/rQKQXmLhevxFGWRbA', '#b8b8b8', true, '{"imageScale":1,"imageX":50,"imageY":50,"textX":24,"textY":24,"textWidth":54,"overlayOpacity":0.42}', 1, true)
on conflict (id) do update set
  title = excluded.title,
  meta = excluded.meta,
  image = excluded.image,
  link = excluded.link,
  background = excluded.background,
  dark = excluded.dark,
  editor_settings = excluded.editor_settings,
  sort_order = excluded.sort_order,
  active = excluded.active;

insert into public.student_events (id, title, start_date, end_date, type, sort_order, active)
values
  ('circle-recruitment', '써클 모집 기간 · 19:00', '2026-03-24', '2026-03-24', 'student-event', 0, true),
  ('visual-war', '시각디자인학과 내전', '2026-04-08', '2026-04-10', 'student-event', 1, true)
on conflict (id) do update set
  title = excluded.title,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  type = excluded.type,
  sort_order = excluded.sort_order,
  active = excluded.active;


insert into storage.buckets (id, name, public)
values ('promo-images', 'promo-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view promo images" on storage.objects;
create policy "Public can view promo images"
on storage.objects
for select
using (bucket_id = 'promo-images');

drop policy if exists "Authenticated can upload promo images" on storage.objects;
create policy "Authenticated can upload promo images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'promo-images');

drop policy if exists "Authenticated can update promo images" on storage.objects;
create policy "Authenticated can update promo images"
on storage.objects
for update
to authenticated
using (bucket_id = 'promo-images')
with check (bucket_id = 'promo-images');

drop policy if exists "Authenticated can delete promo images" on storage.objects;
create policy "Authenticated can delete promo images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'promo-images');
