import { readFileSync, realpathSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

import { loadEnv } from './_env.mjs';

const app = fileURLToPath(new URL('../', import.meta.url));
const photosRoot = resolve(app, 'assets/recipe-photos');
const manifest = JSON.parse(readFileSync(resolve(photosRoot, 'manifest.json'), 'utf8'));
const catalog = JSON.parse(readFileSync(resolve(app, 'supabase/seed/conteudo-pdf.json'), 'utf8'));
const sourceKeys = new Set(catalog.recipes.map((r) => `pdf:recipe:${r.source_page}`));
const seen = new Set();
const files = [];
const missing = [];
if (!Array.isArray(manifest) || manifest.length !== catalog.recipes.length)
  throw new Error('Manifesto incompleto.');
for (const entry of manifest) {
  if (!sourceKeys.has(entry.source_key) || seen.has(entry.source_key))
    throw new Error('Chave de receita desconhecida ou repetida.');
  seen.add(entry.source_key);
  if (!entry.file) {
    missing.push(entry.title);
    continue;
  }
  if (process.argv.includes('--upload') && !entry.credit?.trim())
    throw new Error(`Preencha o crédito da foto: ${entry.title}`);
  if (entry.source_url && !/^https:\/\//i.test(entry.source_url))
    throw new Error(`Fonte da foto deve usar HTTPS: ${entry.title}`);
  const path = realpathSync(resolve(photosRoot, entry.file));
  if (!path.toLowerCase().startsWith(realpathSync(photosRoot).toLowerCase() + sep))
    throw new Error('Arquivo fora da pasta de fotos.');
  const bytes = readFileSync(path);
  const extension = extname(path).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  const valid =
    (types[extension] === 'image/jpeg' &&
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255) ||
    (extension === '.png' &&
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (extension === '.webp' &&
      bytes.toString('ascii', 0, 4) === 'RIFF' &&
      bytes.toString('ascii', 8, 12) === 'WEBP');
  if (!valid || bytes.length > 10 * 1024 * 1024)
    throw new Error(`Foto inválida ou maior que 10 MB: ${entry.title}`);
  const digest = createHash('sha256').update(bytes).digest('hex');
  files.push({
    entry,
    bytes,
    contentType: types[extension],
    object: `${entry.source_key.replaceAll(':', '/')}/${digest}${extension}`,
  });
}
console.log(`${files.length} foto(s) pronta(s); ${missing.length} receita(s) sem foto cadastrada.`);
if (!process.argv.includes('--upload')) {
  console.log('Validação local concluída. Nenhum envio ou alteração no banco.');
} else {
  if (!files.length) throw new Error('Nenhuma foto cadastrada. Preencha manifest.json primeiro.');
  const env = loadEnv();
  const url = process.env.SUPABASE_URL ?? env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error(
      'Defina SUPABASE_SERVICE_ROLE_KEY no ambiente do terminal e configure a URL. Nunca use chave administrativa em EXPO_PUBLIC_*.',
    );
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Confirm every row first, so a missing import fails before any upload.
  for (const item of files) {
    const { data, error } = await client
      .from('recipes')
      .select('id')
      .eq('source_key', item.entry.source_key)
      .maybeSingle();
    if (error || !data) throw new Error(`Importe primeiro o SQL atualizado: ${item.entry.title}`);
    item.recipeId = data.id;
  }
  for (const item of files) {
    const { error } = await client.storage.from('recipe-images').upload(item.object, item.bytes, {
      contentType: item.contentType,
      cacheControl: '31536000',
      upsert: true,
    });
    if (error)
      throw new Error(
        `Falha no upload: ${item.entry.title}. Confira o bucket e a permissão administrativa.`,
      );
    const { data } = client.storage.from('recipe-images').getPublicUrl(item.object);
    const update = await client
      .from('recipes')
      .update({
        image_url: data.publicUrl,
        image_credit: item.entry.credit.trim(),
        image_source_url: item.entry.source_url || null,
      })
      .eq('id', item.recipeId)
      .select('id')
      .single();
    if (update.error)
      throw new Error(
        `Falha ao vincular a foto: ${item.entry.title}. O comando pode ser repetido.`,
      );
    console.log(`Foto vinculada: ${item.entry.title}`);
  }
  console.log('Envio concluído. Reinicie o app para renovar as imagens no cache.');
}
