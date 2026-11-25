-- Aplicar depois da migração 005, ou usar o TXT completo atualizado.
BEGIN;

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS image_credit text,
  ADD COLUMN IF NOT EXISTS image_source_url text;

-- Executa com as permissões do usuário: o perfil continua protegido por RLS.
create or replace function public.recipe_matches_profile(
  p_allergens text[], p_ingredients text[]
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and not (coalesce(p_allergens, '{}') && p.allergies)
      and not exists (
        select 1
        from (
          select s.term
          from public.allergens a,
               unnest(a.synonyms || array[a.label]) as s(term)
          where a.id = any(p.allergies)
          union
          select unnest(p.custom_allergies)
        ) blocked
        where length(btrim(blocked.term)) > 0
          and exists (
            select 1 from unnest(coalesce(p_ingredients, '{}')) i(ingredient)
            where strpos(
              regexp_replace(extensions.unaccent(lower(i.ingredient)), '\s+', ' ', 'g'),
              regexp_replace(extensions.unaccent(lower(btrim(blocked.term))), '\s+', ' ', 'g')
            ) > 0
          )
      )
  );
$$;
revoke execute on function public.recipe_matches_profile(text[], text[]) from public, anon;
grant execute on function public.recipe_matches_profile(text[], text[]) to authenticated;

-- Restritiva: também limita outras políticas permissivas de leitura existentes.
drop policy if exists recipes_profile_allergies on public.recipes;
create policy recipes_profile_allergies on public.recipes
  as restrictive for select to authenticated
  using (published and allergens_reviewed and public.recipe_matches_profile(allergens, ingredients));

-- Os favoritos são preservados se o perfil mudar. Inserir um favorito novo exige
-- que a receita esteja visível para o usuário naquele momento.
drop policy if exists saved_recipes_compatible_write on public.saved_recipes;
create policy saved_recipes_compatible_write on public.saved_recipes
  as restrictive for all to authenticated
  using (true)
  with check (exists (select 1 from public.recipes r where r.id = saved_recipes.recipe_id));

DO $$ BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('recipe-images', 'recipe-images', true, 10485760,
            array['image/jpeg','image/png','image/webp'])
    ON CONFLICT(id) DO UPDATE SET public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
  END IF;
END $$;
-- Uploads administrativos são feitos pelo script, sem conceder escrita pública.
COMMIT;
