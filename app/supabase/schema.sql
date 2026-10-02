create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.allergens (
  id        text primary key,
  label     text not null,
  synonyms  text[] not null default '{}',
  icon      text
);

create table public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  email                text not null,
  display_name         text not null default '',
  allergies            text[] not null default '{}',
  custom_allergies     text[] not null default '{}',
  preferences          text[] not null default '{}'
    check (preferences <@ array['lactose_free', 'gluten_free', 'vegetarian', 'vegan']::text[]),
  onboarding_completed boolean not null default false,
  onboarding_step      smallint not null default 0 check (onboarding_step between 0 and 3),
  is_premium           boolean not null default false,
  subscription         jsonb,
  terms_version        text not null,
  privacy_version      text not null,
  consent_accepted_at  timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.validate_profile_allergies()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from unnest(new.allergies) as a(id)
    where a.id not in (select id from public.allergens)
  ) then
    raise exception 'allergies contém ID fora do catálogo';
  end if;
  return new;
end;
$$;

create trigger profiles_validate_allergies
  before insert or update of allergies on public.profiles
  for each row execute function public.validate_profile_allergies();

create table public.scans (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  barcode            text not null,
  product_name       text,
  verdict            text not null
    constraint scans_verdict_check
    check (verdict in ('safe', 'warning', 'contains', 'not_found')),
  matched_allergens  text[] not null default '{}',
  scanned_at         timestamptz not null default now()
);

create index scans_user_scanned_at_idx on public.scans (user_id, scanned_at desc);

create table public.products_cache (
  barcode             text primary key,
  name                text,
  brand               text,
  category            text,
  ingredients         text[] not null default '{}',
  allergens_declared  text[] not null default '{}',
  traces_declared     text[] not null default '{}',
  ingredients_text    text,
  image_url           text,
  not_found           boolean not null default false,
  source              text not null,
  fetched_at          timestamptz not null default now()
);

create table public.restaurants (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  address            text not null,
  lat                double precision not null,
  lng                double precision not null,
  cuisine            text not null
    check (cuisine in ('healthy', 'vegetarian', 'snacks', 'other')),
  allergen_friendly  text[] not null default '{}',
  rating             numeric(2, 1) check (rating is null or rating between 0 and 5),
  image              text,
  allergen_source    text,
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  constraint restaurants_coordinates_check check (lat between -90 and 90 and lng between -180 and 180)
);

create table public.saved_restaurants (
  user_id        uuid        not null references public.profiles (id) on delete cascade,
  restaurant_id  uuid        not null references public.restaurants (id) on delete cascade,
  saved_at       timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

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

create trigger restaurants_validate_allergens
  before insert or update of allergen_friendly on public.restaurants
  for each row execute function public.validate_restaurant_allergens();

alter table public.allergens         enable row level security;
alter table public.profiles          enable row level security;
alter table public.saved_restaurants enable row level security;
alter table public.scans             enable row level security;
alter table public.products_cache    enable row level security;
alter table public.restaurants       enable row level security;

create policy "allergens_select_authenticated" on public.allergens
  for select to authenticated using (true);

create policy "restaurants_select_authenticated" on public.restaurants
  for select to authenticated using (active);

create policy "profiles_owner_all" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "saved_restaurants_owner_all" on public.saved_restaurants
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "scans_owner_all" on public.scans
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "products_cache_select" on public.products_cache
  for select to authenticated using (true);
create policy "products_cache_insert" on public.products_cache
  for insert to authenticated with check (fetched_at is not null);
create policy "products_cache_update" on public.products_cache
  for update to authenticated using (true) with check (fetched_at is not null);

grant select on public.allergens, public.restaurants to authenticated;
grant select, insert, update, delete
  on public.profiles,
     public.saved_restaurants, public.scans
  to authenticated;
grant select, insert, update on public.products_cache to authenticated;

create extension if not exists unaccent with schema extensions;

create table public.recipes (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text,
  image_url           text,
  meal_types          text[] not null default '{}'
    check (meal_types <@ array['breakfast', 'lunch', 'dinner', 'snack', 'dessert']::text[]),
  ready_in_minutes    integer not null check (ready_in_minutes > 0),
  servings            integer not null check (servings > 0),
  ingredients         text[] not null check (cardinality(ingredients) > 0),
  steps               text[] not null check (cardinality(steps) > 0),
  allergens           text[] not null default '{}',
  diets               text[] not null default '{}'
    check (diets <@ array['lactose_free', 'gluten_free', 'vegetarian', 'vegan']::text[]),
  calories_kcal       integer check (calories_kcal >= 0),
  protein_g           numeric(5, 1) check (protein_g >= 0),
  carbs_g             numeric(5, 1) check (carbs_g >= 0),
  fat_g               numeric(5, 1) check (fat_g >= 0),
  tip                 text,
  allergens_reviewed  boolean not null default false,
  published           boolean not null default false,
  featured            boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint recipes_gluten_free_consistent
    check (not ('gluten_free' = any (diets) and 'gluten' = any (allergens))),
  constraint recipes_vegan_consistent
    check (not ('vegan' = any (diets) and allergens && array['milk', 'egg', 'fish', 'shellfish']::text[])),
  constraint recipes_vegetarian_consistent
    check (not ('vegetarian' = any (diets) and allergens && array['fish', 'shellfish']::text[])),
  constraint recipes_published_requires_review
    check (not published or allergens_reviewed)
);

create index recipes_allergens_idx on public.recipes using gin (allergens);
create index recipes_meal_types_idx on public.recipes using gin (meal_types);

create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

create or replace function public.validate_recipe_allergens()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from unnest(new.allergens) as a(id)
    where a.id not in (select id from public.allergens)
  ) then
    raise exception 'recipes.allergens contém ID fora do catálogo';
  end if;
  return new;
end;
$$;

create trigger recipes_validate_allergens
  before insert or update of allergens on public.recipes
  for each row execute function public.validate_recipe_allergens();

alter table public.recipes enable row level security;

create policy "recipes_select_published" on public.recipes
  for select to authenticated using (published);

grant select on public.recipes to authenticated;

create table public.saved_recipes (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  recipe_id  uuid not null references public.recipes (id) on delete cascade,
  saved_at   timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

alter table public.saved_recipes enable row level security;

create policy "saved_recipes_owner_all" on public.saved_recipes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.saved_recipes to authenticated;

create or replace function public.search_recipes(
  p_meal_type    text    default null,
  p_min_minutes  integer default null,
  p_max_minutes  integer default null,
  p_diets        text[]  default '{}',
  p_include      text[]  default '{}',
  p_exclude      text[]  default '{}',
  p_limit        integer default 10,
  p_offset       integer default 0
)
returns setof public.recipes
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (
    select coalesce(p.allergies, '{}') as allergies,
           coalesce(p.custom_allergies, '{}') as custom_allergies
    from public.profiles p
    where p.id = auth.uid()
  ),
  blocked_terms as (
    select extensions.unaccent(lower(s.term)) as term
    from public.allergens a, unnest(a.synonyms) as s(term)
    where a.id = any (coalesce((select allergies from me), '{}'))
    union
    select extensions.unaccent(lower(c.term))
    from unnest(coalesce((select custom_allergies from me), '{}')) as c(term)
  ),
  candidates as (
    select r.*,
           extensions.unaccent(lower(array_to_string(r.ingredients, ' '))) as ingredients_text
    from public.recipes r
    where r.published
      and not (r.allergens && coalesce((select allergies from me), '{}'))
      and (p_meal_type is null or p_meal_type = any (r.meal_types))
      and (p_min_minutes is null or r.ready_in_minutes > p_min_minutes)
      and (p_max_minutes is null or r.ready_in_minutes <= p_max_minutes)
      and r.diets @> coalesce(p_diets, '{}')
  )
  select c.id, c.title, c.description, c.image_url, c.meal_types, c.ready_in_minutes,
         c.servings, c.ingredients, c.steps, c.allergens, c.diets, c.calories_kcal,
         c.protein_g, c.carbs_g, c.fat_g, c.tip, c.allergens_reviewed, c.published,
         c.featured, c.created_at, c.updated_at
  from candidates c
  where not exists (select 1 from blocked_terms b where c.ingredients_text like '%' || b.term || '%')
    and not exists (
      select 1 from unnest(coalesce(p_include, '{}')) as i(term)
      where c.ingredients_text not like '%' || extensions.unaccent(lower(i.term)) || '%'
    )
    and not exists (
      select 1 from unnest(coalesce(p_exclude, '{}')) as e(term)
      where c.ingredients_text like '%' || extensions.unaccent(lower(e.term)) || '%'
    )
  order by c.featured desc, c.created_at desc, c.id
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
$$;

revoke execute on function public.search_recipes(text, integer, integer, text[], text[], text[], integer, integer) from public, anon;
grant execute on function public.search_recipes(text, integer, integer, text[], text[], text[], integer, integer) to authenticated;

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('recipe-images', 'recipe-images', true)
    on conflict (id) do nothing;
  end if;
end;
$$;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

insert into public.allergens (id, label, synonyms) values
  ('milk',      'Leite',         array['leite','lactose','soro de leite','caseína','caseinato','manteiga','queijo','creme de leite','iogurte','whey']),
  ('egg',       'Ovo',           array['ovo','ovos','albumina','clara','gema','lisozima','maionese']),
  ('peanut',    'Amendoim',      array['amendoim','pasta de amendoim']),
  ('tree_nuts', 'Castanhas',     array['castanha','castanha-do-pará','caju','amêndoa','avelã','noz','nozes','pistache','macadâmia']),
  ('gluten',    'Glúten',        array['glúten','trigo','centeio','cevada','malte','farinha de trigo','semolina','aveia']),
  ('soy',       'Soja',          array['soja','lecitina de soja','proteína de soja','shoyu']),
  ('fish',      'Peixes',        array['peixe','bacalhau','atum','salmão','sardinha','anchova']),
  ('shellfish', 'Frutos do mar', array['camarão','lagosta','caranguejo','siri','marisco','mexilhão','ostra','lula','polvo']);
