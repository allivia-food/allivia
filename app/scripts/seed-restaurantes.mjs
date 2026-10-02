import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const input = join(root, 'app', 'supabase', 'seed', 'restaurantes.seed.json');
const output = join(root, 'app', 'supabase', 'seed', 'restaurantes.sql');

const CUISINES = ['healthy', 'vegetarian', 'snacks', 'other'];
const ALLERGENS = ['milk', 'egg', 'peanut', 'tree_nuts', 'gluten', 'soy', 'fish', 'shellfish'];
const MIN_RESTAURANTS = 10;

const data = JSON.parse(readFileSync(input, 'utf8'));
const list = Array.isArray(data) ? data : data.restaurantes;
if (!Array.isArray(list)) throw new Error('Esperado um array "restaurantes".');

const errors = [];
const isText = (v) => typeof v === 'string' && v.trim().length > 0;
list.forEach((r, i) => {
  const where = `#${i + 1} (${r.name ?? 'sem nome'})`;
  if (!isText(r.name)) errors.push(`${where}: name obrigatório`);
  if (!isText(r.address)) errors.push(`${where}: address obrigatório`);
  if (typeof r.lat !== 'number' || r.lat < -90 || r.lat > 90) errors.push(`${where}: lat inválida`);
  if (typeof r.lng !== 'number' || r.lng < -180 || r.lng > 180)
    errors.push(`${where}: lng inválida`);
  if (!CUISINES.includes(r.cuisine))
    errors.push(`${where}: cuisine deve ser ${CUISINES.join('|')}`);
  if (!Array.isArray(r.allergenFriendly) || r.allergenFriendly.some((a) => !ALLERGENS.includes(a)))
    errors.push(`${where}: allergenFriendly só aceita ${ALLERGENS.join(', ')}`);
  if (r.rating != null && (typeof r.rating !== 'number' || r.rating < 0 || r.rating > 5))
    errors.push(`${where}: rating de 0 a 5`);
  if (!isText(r.allergenSource))
    errors.push(`${where}: allergenSource obrigatório (de onde veio a informação de alergênicos)`);
});
const names = list.map((r) => `${r.name}|${r.address}`);
names.forEach((n, i) => {
  if (names.indexOf(n) !== i) errors.push(`#${i + 1}: restaurante repetido (${n})`);
});

console.log(`${list.length} restaurante(s) em ${input}`);
if (list.length < MIN_RESTAURANTS)
  console.log(`AVISO: são necessários no mínimo ${MIN_RESTAURANTS} restaurantes reais.`);
if (errors.length) {
  for (const e of errors) console.log(`ERRO ${e}`);
  process.exit(1);
}
if (process.argv.includes('--check')) {
  console.log('OK: arquivo válido.');
  process.exit(0);
}

const q = (v) => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => `'{${a.join(',')}}'`;
const rows = list.map(
  (r) =>
    `insert into public.restaurants (name, address, lat, lng, cuisine, allergen_friendly, rating, image, allergen_source)\n` +
    `select ${q(r.name)}, ${q(r.address)}, ${r.lat}, ${r.lng}, ${q(r.cuisine)}, ${arr(r.allergenFriendly)}, ` +
    `${r.rating ?? 'null'}, ${q(r.image)}, ${q(r.allergenSource)}\n` +
    `where not exists (select 1 from public.restaurants where name = ${q(r.name)} and address = ${q(r.address)});`,
);
const sql = [
  '-- Etec de Taboão da Serra — alliviafood@gmail.com',
  '-- Executar no SQL Editor do Supabase. Idempotente: não duplica (nome + endereço).',
  '',
  ...rows,
  '',
].join('\n');
writeFileSync(output, sql);
console.log(`SQL gerado em ${output}`);
