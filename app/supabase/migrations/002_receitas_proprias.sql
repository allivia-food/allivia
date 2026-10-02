create extension if not exists unaccent with schema extensions;

drop table if exists public.recipes_cache;

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

drop table if exists public.saved_recipes;

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
