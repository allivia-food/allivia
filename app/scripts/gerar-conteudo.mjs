import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const app = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFileSync(app + path, 'utf8');
const data = JSON.parse(read('supabase/seed/conteudo-pdf.json'));
const q = (value) => (value == null ? 'null' : `'${String(value).replaceAll("'", "''")}'`);
const array = (values) => `ARRAY[${values.map(q).join(',')}]::text[]`;
const normalize = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
const idFor = (value) => {
  const h = createHash('md5').update(value).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

if (data.recipes.length !== 35 || data.restaurants.length !== 7)
  throw new Error('Inventário incompleto: esperado 35 receitas e 7 restaurantes.');
for (const kind of ['recipes', 'restaurants']) {
  const keys = data[kind].map((r) => normalize(r.title ?? r.name));
  if (new Set(keys).size !== keys.length) throw new Error(`Duplicação em ${kind}`);
}
for (const r of data.recipes) {
  if (!r.ingredients.length || !r.steps.length || r.ready_in_minutes <= 0 || r.servings <= 0)
    throw new Error(`Receita incompleta: ${r.title}`);
  if (r.diets.includes('gluten_free') && r.allergens.includes('gluten'))
    throw new Error(`Glúten: ${r.title}`);
  if (
    r.diets.includes('vegan') &&
    r.allergens.some((a) => ['milk', 'egg', 'fish', 'shellfish'].includes(a))
  )
    throw new Error(`Vegano: ${r.title}`);
}

let sql = `-- ALLIVIA: conteúdo do PDF, incremental e repetível.
-- Banco existente: execute este arquivo inteiro no SQL Editor.
-- Banco novo: execute primeiro app/supabase/schema.sql. Não rode os seeds antigos.
-- Preserve um backup antes de atualizar conteúdo editorial já existente.
BEGIN;
DO $$ BEGIN
  IF to_regclass('public.recipes') IS NULL OR to_regclass('public.restaurants') IS NULL OR to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'Estrutura Allivia ausente. Execute schema.sql apenas em banco novo.';
  END IF;
END $$;
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS import_pending text,
  ADD COLUMN IF NOT EXISTS source_reference text,
  ADD COLUMN IF NOT EXISTS yield_label text,
  ADD COLUMN IF NOT EXISTS calorie_basis text,
  ADD COLUMN IF NOT EXISTS difficulty text,
  ADD COLUMN IF NOT EXISTS source_key text;
CREATE UNIQUE INDEX IF NOT EXISTS recipes_source_key_idx ON public.recipes(source_key);
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS diets text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_key text;
CREATE UNIQUE INDEX IF NOT EXISTS restaurants_source_key_idx ON public.restaurants(source_key);
ALTER TABLE public.restaurants ALTER COLUMN lat DROP NOT NULL, ALTER COLUMN lng DROP NOT NULL;
ALTER TABLE public.restaurants DROP CONSTRAINT IF EXISTS restaurants_coordinate_pair_check;
ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_coordinate_pair_check CHECK ((lat IS NULL) = (lng IS NULL));
ALTER TABLE public.restaurants DROP CONSTRAINT IF EXISTS restaurants_diets_check;
ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_diets_check CHECK (diets <@ ARRAY['lactose_free','gluten_free','vegetarian','vegan']::text[]);
`;

// Link unambiguously matching earlier imports without changing their IDs or saved items.
function adopt(table, key, name, column) {
  return `DO $$ BEGIN
    IF (SELECT count(*) FROM public.${table} WHERE lower(extensions.unaccent(${column})) = lower(extensions.unaccent(${q(name)}))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', ${q(name)};
    END IF;
    UPDATE public.${table} SET source_key = ${q(key)} WHERE source_key IS NULL AND lower(extensions.unaccent(${column})) = lower(extensions.unaccent(${q(name)}));
  END $$;\n`;
}

for (const r of data.recipes) {
  const key = `pdf:recipe:${r.source_page}`;
  sql += adopt('recipes', key, r.title, 'title');
  const values = [
    q(r.id),
    q(key),
    q(r.title),
    array(r.meal_types),
    r.ready_in_minutes,
    r.servings,
    array(r.ingredients),
    array(r.steps),
    array(r.allergens),
    array(r.diets),
    r.calories_kcal ?? 'null',
    q(r.tip),
    q(r.pending || null),
    !r.pending,
    !r.pending,
    q(r.source_reference),
    q(r.yield_label),
    q(r.calorie_basis),
    q(r.difficulty),
  ];
  const columns =
    'id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty'.split(
      ',',
    );
  sql += `INSERT INTO public.recipes(${columns.join(',')}) VALUES (${values.join(',')}) ON CONFLICT(source_key) DO UPDATE SET ${columns
    .slice(2)
    .map((col) => `${col}=excluded.${col}`)
    .join(',')};\n`;
}
for (const r of data.restaurants) {
  const key = `pdf:restaurant:${normalize(r.name)}`;
  sql += adopt('restaurants', key, r.name, 'name');
  const columns =
    'id,source_key,name,address,cuisine,description,phone,diets,allergen_friendly,allergen_source,active';
  sql += `INSERT INTO public.restaurants(${columns}) VALUES (${q(r.id ?? idFor('pdf-restaurant:' + r.name))},${q(key)},${q(r.name)},${q(r.address)},${q(r.cuisine)},${q(r.description)},${q(r.phone)},${array(r.diets)},${array(r.allergen_friendly)},${q(r.allergen_source)},true) ON CONFLICT(source_key) DO UPDATE SET ${columns
    .split(',')
    .slice(2)
    .map((col) => `${col}=excluded.${col}`)
    .join(',')};\n`;
}
// SETOF recipes must include the metadata columns added above.
const schema = read('supabase/schema.sql');
let search = schema.slice(
  schema.indexOf('create or replace function public.search_recipes('),
  schema.indexOf('do $$', schema.indexOf('create or replace function public.search_recipes(')),
);
search = search.replace(
  /select c\.id, c\.title,[\s\S]*?from candidates c/,
  'select r.*\n  from candidates c join public.recipes r on r.id = c.id',
);
if (!search.includes('select r.*')) throw new Error('Função de busca não reconhecida');
sql += '\n' + search;
const access = read('supabase/migrations/006_recipe_access_images.sql');
sql += '\n' + access.slice(access.indexOf('ALTER TABLE'), access.lastIndexOf('COMMIT;'));
const cleanup = read('supabase/seed/restaurantes-teste.sql');
sql += '\n' + cleanup.slice(cleanup.indexOf('DELETE FROM'), cleanup.indexOf('COMMIT;'));
const removedRecipes = read('supabase/migrations/008_remove_recipes_without_photos.sql');
sql +=
  '\n' +
  removedRecipes.slice(
    removedRecipes.indexOf('DELETE FROM'),
    removedRecipes.lastIndexOf('COMMIT;'),
  );
sql += `\nCOMMIT;\nSELECT count(*) AS receitas_importadas, count(*) FILTER (WHERE published) AS publicadas, count(*) FILTER (WHERE NOT published) AS rascunhos FROM public.recipes WHERE source_key LIKE 'pdf:recipe:%';\nSELECT name, address, lat, lng FROM public.restaurants WHERE source_key LIKE 'pdf:restaurant:%' ORDER BY name;\nSELECT title,import_pending FROM public.recipes WHERE source_key LIKE 'pdf:recipe:%' AND NOT published;\n`;
if (process.argv.includes('--check')) {
  if (read('supabase/migrations/005_conteudo_pdf.sql') !== sql)
    throw new Error('SQL desatualizado: execute npm run gerar:conteudo.');
} else {
  writeFileSync(app + 'supabase/migrations/005_conteudo_pdf.sql', sql);
}
console.log(
  `SQL gerado: ${data.recipes.length} receitas (${data.recipes.filter((r) => !r.pending).length} publicadas), ${data.restaurants.length} restaurantes.`,
);
