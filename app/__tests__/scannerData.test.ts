import {
  expandUpcE,
  hasValidGtinCheckDigit,
  isDuplicateRead,
  isValidScannedBarcode,
  normalizeManualBarcode,
} from '@/features/scanner/barcode';

const mockFrom = jest.fn();
jest.mock('@/services/supabase', () => ({
  getSupabase: () => ({ from: mockFrom }),
  isSupabaseConfigured: true,
}));

import {
  getProduct,
  isCacheFresh,
  mapOffTags,
  normalizeOffResponse,
  PRODUCT_TIMEOUT_MS,
  splitIngredients,
} from '@/services/products';
import { TimeoutError } from '@/utils/withTimeout';

describe('check digit', () => {
  it.each([
    ['7891000100103', true],
    ['7891000100104', false],
    ['96385074', true],
    ['96385075', false],
    ['036000291452', true],
    ['036000291453', false],
    ['12345', false],
    ['78910001001A3', false],
  ])('%s → %s', (code, valid) => {
    expect(hasValidGtinCheckDigit(code)).toBe(valid);
  });

  it('UPC-E is validated through its UPC-A expansion', () => {
    expect(expandUpcE('04252614')).toBe('042100005264');
    expect(isValidScannedBarcode('04252614', 'upc_e')).toBe(true);
    expect(isValidScannedBarcode('04252615', 'upc_e')).toBe(false);
  });

  it('manual entry: 8 to 14 digits with a valid check digit, spaces ignored', () => {
    expect(normalizeManualBarcode('789 1000 100103')).toBe('7891000100103');
    expect(normalizeManualBarcode('7891000100104')).toBeNull();
    expect(normalizeManualBarcode('1234567')).toBeNull();
    expect(normalizeManualBarcode('123456789012345')).toBeNull();
  });

  it('the same code within 3 s counts once', () => {
    expect(isDuplicateRead('1', 1000, null)).toBe(false);
    expect(isDuplicateRead('1', 3999, { code: '1', at: 1000 })).toBe(true);
    expect(isDuplicateRead('1', 4000, { code: '1', at: 1000 })).toBe(false);
    expect(isDuplicateRead('2', 1500, { code: '1', at: 1000 })).toBe(false);
  });
});

describe('Open Food Facts normalizer', () => {
  it('maps tags to catalog ids', () => {
    expect(mapOffTags(['en:milk', 'en:gluten', 'en:celery'])).toEqual(['milk', 'gluten']);
    expect(mapOffTags(undefined)).toEqual([]);
  });

  it('splits ingredients at top-level commas only', () => {
    expect(
      splitIngredients('farinha de trigo (enriquecida com ferro, ácido fólico), açúcar, sal.'),
    ).toEqual(['farinha de trigo (enriquecida com ferro, ácido fólico)', 'açúcar', 'sal']);
  });

  it('normalizes a found product (Portuguese text first)', () => {
    const p = normalizeOffResponse('7891000100103', {
      status: 1,
      product: {
        product_name: 'Leite Condensado',
        brands: 'Marca, Outra',
        categories: 'Laticínios, Doces',
        ingredients_text: 'whole milk, sugar',
        ingredients_text_pt: 'LEITE INTEGRAL, AÇÚCAR E LACTOSE.',
        allergens_tags: ['en:milk'],
        traces_tags: [],
        image_front_url: 'https://img/x.jpg',
      },
    });
    expect(p).toMatchObject({
      name: 'Leite Condensado',
      brand: 'Marca',
      category: 'Doces',
      ingredientsText: 'LEITE INTEGRAL, AÇÚCAR E LACTOSE.',
      ingredients: ['LEITE INTEGRAL', 'AÇÚCAR E LACTOSE'],
      allergensDeclared: ['milk'],
    });
  });

  it('drops the language prefix of the category', () => {
    const p = normalizeOffResponse('1', {
      status: 1,
      product: { product_name: 'Refrigerante', categories: 'Bebidas, pt:Bebida' },
    });
    expect(p?.category).toBe('Bebida');
  });

  it('returns null when the source says not found and throws on unreadable data', () => {
    expect(
      normalizeOffResponse('1', { status: 0, status_verbose: 'product not found' }),
    ).toBeNull();
    expect(() => normalizeOffResponse('1', 'html')).toThrow();
  });
});

describe('cache', () => {
  const now = Date.parse('2026-10-01T12:00:00Z');
  const ago = (ms: number) => new Date(now - ms).toISOString();
  const day = 24 * 60 * 60 * 1000;

  it('products are fresh for 30 days, "not found" for 24 h', () => {
    expect(isCacheFresh({ not_found: false, fetched_at: ago(29 * day) }, now)).toBe(true);
    expect(isCacheFresh({ not_found: false, fetched_at: ago(31 * day) }, now)).toBe(false);
    expect(isCacheFresh({ not_found: true, fetched_at: ago(23 * 60 * 60 * 1000) }, now)).toBe(true);
    expect(isCacheFresh({ not_found: true, fetched_at: ago(25 * 60 * 60 * 1000) }, now)).toBe(
      false,
    );
  });

  it('a fresh cached product is returned without calling the source', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              barcode: '7891000100103',
              name: 'Leite',
              brand: null,
              category: null,
              ingredients: ['leite', 'açúcar', 'sal'],
              allergens_declared: ['milk'],
              traces_declared: [],
              ingredients_text: 'leite, açúcar, sal',
              image_url: null,
              not_found: false,
              source: 'openfoodfacts',
              fetched_at: new Date(now - day).toISOString(),
            },
            error: null,
          }),
        }),
      }),
    });
    const result = await getProduct('7891000100103', now);
    expect(result.fromCache).toBe(true);
    expect(result.product?.allergensDeclared).toEqual(['milk']);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('the whole lookup gives up after 10 s even if cache and source hang', async () => {
    jest.useFakeTimers();
    const never = new Promise<never>(() => {});
    const fetchSpy = jest.spyOn(global, 'fetch').mockReturnValue(never);
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ maybeSingle: () => never }) }),
    });
    const result = getProduct('7891000100103', now);
    const assertion = expect(result).rejects.toBeInstanceOf(TimeoutError);
    await jest.advanceTimersByTimeAsync(PRODUCT_TIMEOUT_MS);
    await assertion;
    fetchSpy.mockRestore();
    jest.useRealTimers();
  });
});
