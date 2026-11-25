alter table public.scans drop constraint if exists scans_verdict_check;
alter table public.scans
  add constraint scans_verdict_check
  check (verdict in ('safe', 'warning', 'contains', 'not_found'));

alter table public.products_cache
  add column if not exists ingredients_text text,
  add column if not exists traces_declared  text[] not null default '{}',
  add column if not exists image_url        text,
  add column if not exists not_found        boolean not null default false;

