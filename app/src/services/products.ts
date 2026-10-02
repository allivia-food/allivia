import { Platform } from 'react-native';

import { ALLERGENS, type AllergenId } from '@/constants/allergens';
import type { Product } from '@/features/scanner/analyzeProduct';
import { withTimeout } from '@/utils/withTimeout';

import { getSupabase } from './supabase';

export const PRODUCT_TIMEOUT_MS = 10_000;
export const CACHE_READ_TIMEOUT_MS = 3_000;
export const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const NOT_FOUND_TTL_MS = 24 * 60 * 60 * 1000;
export const SOURCE = 'openfoodfacts';

const OFF_FIELDS =
  'code,product_name,product_name_pt,brands,categories,ingredients_text,ingredients_text_pt,allergens_tags,traces_tags,image_front_url';

export class InvalidProductDataError extends Error {
  constructor() {
    super('Invalid product data');
    this.name = 'InvalidProductDataError';
  }
}

export interface ProductLookup {
  product: Product | null;
  fromCache: boolean;
}

export function mapOffTags(tags: unknown): AllergenId[] {
  if (!Array.isArray(tags)) return [];
  return ALLERGENS.filter((a) => a.offTags.some((t) => tags.includes(t))).map((a) => a.id);
}

export function splitIngredients(text: string): string[] {
  const items: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of text) {
    if (ch === '(' || ch === '[') depth += 1;
    if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    if (depth === 0 && (ch === ',' || ch === ';')) {
      items.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  items.push(current);
  return items
    .map((s) => s.replace(/\s+/g, ' ').replace(/^[\s.:]+|[\s.:]+$/g, ''))
    .filter((s) => s.length > 0);
}

const str = (v: unknown): string | null =>
  typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;

export function normalizeOffResponse(barcode: string, body: unknown): Product | null {
  if (!body || typeof body !== 'object') throw new InvalidProductDataError();
  const b = body as { status?: unknown; product?: Record<string, unknown> };
  if (b.status === 0 || b.status === 'failure' || !b.product) return null;
  if (typeof b.product !== 'object') throw new InvalidProductDataError();
  const p = b.product;
  const ingredientsText = str(p.ingredients_text_pt) ?? str(p.ingredients_text);
  const category =
    str(p.categories)
      ?.split(',')
      .pop()
      ?.trim()
      .replace(/^[a-z]{2}:/, '') || null;
  return {
    barcode,
    name: str(p.product_name_pt) ?? str(p.product_name),
    brand: str(p.brands)?.split(',')[0]?.trim() ?? null,
    category,
    imageUrl: str(p.image_front_url),
    ingredientsText,
    ingredients: ingredientsText ? splitIngredients(ingredientsText) : [],
    allergensDeclared: mapOffTags(p.allergens_tags),
    tracesDeclared: mapOffTags(p.traces_tags),
    source: SOURCE,
  };
}

async function fetchFromSource(barcode: string): Promise<Product | null> {
  const headers: Record<string, string> =
    Platform.OS === 'web' ? {} : { 'User-Agent': 'Allivia/0.1 (alliviafood@gmail.com)' };
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}?fields=${OFF_FIELDS}`,
    { headers },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new InvalidProductDataError();
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new InvalidProductDataError();
  }
  return normalizeOffResponse(barcode, body);
}

interface CacheRow {
  barcode: string;
  name: string | null;
  brand: string | null;
  category: string | null;
  ingredients: string[];
  allergens_declared: AllergenId[];
  traces_declared: AllergenId[] | null;
  ingredients_text: string | null;
  image_url: string | null;
  not_found: boolean | null;
  source: string;
  fetched_at: string;
}

const CACHE_COLUMNS =
  'barcode, name, brand, category, ingredients, allergens_declared, traces_declared, ingredients_text, image_url, not_found, source, fetched_at';

export function isCacheFresh(row: { not_found: boolean | null; fetched_at: string }, now: number) {
  const age = now - new Date(row.fetched_at).getTime();
  return age >= 0 && age < (row.not_found ? NOT_FOUND_TTL_MS : CACHE_TTL_MS);
}

function fromCache(row: CacheRow): Product | null {
  if (row.not_found) return null;
  return {
    barcode: row.barcode,
    name: row.name,
    brand: row.brand,
    category: row.category,
    imageUrl: row.image_url,
    ingredientsText: row.ingredients_text,
    ingredients: row.ingredients ?? [],
    allergensDeclared: row.allergens_declared ?? [],
    tracesDeclared: row.traces_declared ?? [],
    source: row.source,
  };
}

async function readCache(barcode: string): Promise<CacheRow | null> {
  try {
    const { data, error } = await withTimeout(
      getSupabase()
        .from('products_cache')
        .select(CACHE_COLUMNS)
        .eq('barcode', barcode)
        .maybeSingle<CacheRow>(),
      CACHE_READ_TIMEOUT_MS,
    );
    if (error) throw error;
    return data;
  } catch (error) {
    if (__DEV__) console.warn('[products] cache read failed', error);
    return null;
  }
}

async function writeCache(barcode: string, product: Product | null): Promise<void> {
  try {
    const { error } = await withTimeout(
      getSupabase()
        .from('products_cache')
        .upsert({
          barcode,
          name: product?.name ?? null,
          brand: product?.brand ?? null,
          category: product?.category ?? null,
          ingredients: product?.ingredients ?? [],
          allergens_declared: product?.allergensDeclared ?? [],
          traces_declared: product?.tracesDeclared ?? [],
          ingredients_text: product?.ingredientsText ?? null,
          image_url: product?.imageUrl ?? null,
          not_found: product === null,
          source: SOURCE,
          fetched_at: new Date().toISOString(),
        }),
    );
    if (error) throw error;
  } catch (error) {
    if (__DEV__) console.warn('[products] cache write failed', error);
  }
}

export function getProduct(barcode: string, now = Date.now()): Promise<ProductLookup> {
  return withTimeout(lookup(barcode, now), PRODUCT_TIMEOUT_MS);
}

async function lookup(barcode: string, now: number): Promise<ProductLookup> {
  const cached = await readCache(barcode);
  if (cached && isCacheFresh(cached, now)) {
    return { product: fromCache(cached), fromCache: true };
  }
  const product = await fetchFromSource(barcode);
  void writeCache(barcode, product);
  return { product, fromCache: false };
}

export type ScanVerdict = 'safe' | 'warning' | 'contains' | 'not_found';

export async function recordScan(
  userId: string,
  barcode: string,
  productName: string | null,
  verdict: ScanVerdict,
  matchedAllergens: AllergenId[],
): Promise<void> {
  try {
    const { error } = await withTimeout(
      getSupabase().from('scans').insert({
        user_id: userId,
        barcode,
        product_name: productName,
        verdict,
        matched_allergens: matchedAllergens,
      }),
    );
    if (error) throw error;
  } catch (error) {
    if (__DEV__) console.warn('[products] scan history failed', error);
  }
}
