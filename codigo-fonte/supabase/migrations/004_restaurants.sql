alter table public.restaurants
  add column if not exists active          boolean     not null default true,
  add column if not exists allergen_source text,
  add column if not exists created_at      timestamptz not null default now();

alter table public.restaurants
  alter column address set not null,
  alter column lat     set not null,
  alter column lng     set not null,
  alter column cuisine set not null;

alter table public.restaurants drop constraint if exists restaurants_cuisine_check;
alter table public.restaurants
  add constraint restaurants_cuisine_check
  check (cuisine in ('healthy', 'vegetarian', 'snacks', 'other'));

alter table public.restaurants drop constraint if exists restaurants_rating_check;
alter table public.restaurants
  add constraint restaurants_rating_check check (rating is null or rating between 0 and 5);

alter table public.restaurants drop constraint if exists restaurants_coordinates_check;
alter table public.restaurants
  add constraint restaurants_coordinates_check
  check (lat between -90 and 90 and lng between -180 and 180);

create or replace function public.validate_restaurant_allergens()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from unnest(new.allergen_friendly) as a(id)
    where a.id not in (select id from public.allergens)
  ) then
    raise exception 'restaurants.allergen_friendly contém ID fora do catálogo';
  end if;
  return new;
end;
$$;

drop trigger if exists restaurants_validate_allergens on public.restaurants;
create trigger restaurants_validate_allergens
  before insert or update of allergen_friendly on public.restaurants
  for each row execute function public.validate_restaurant_allergens();

drop policy if exists "restaurants_select_authenticated" on public.restaurants;
create policy "restaurants_select_authenticated" on public.restaurants
  for select to authenticated using (active);

drop table if exists public.saved_restaurants;
create table public.saved_restaurants (
  user_id        uuid        not null references public.profiles (id) on delete cascade,
  restaurant_id  uuid        not null references public.restaurants (id) on delete cascade,
  saved_at       timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

alter table public.saved_restaurants enable row level security;

create policy "saved_restaurants_owner_all" on public.saved_restaurants
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.saved_restaurants to authenticated;
