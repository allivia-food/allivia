import {
  allergenFreeText,
  distanceMeters,
  filterRestaurants,
  formatDistance,
  rankRestaurants,
  routeUrl,
  type Restaurant,
} from '@/features/restaurants/rules';

const ONE_DEGREE_M = 111_195;

describe('Haversine', () => {
  it.each([
    ['same point', { lat: -23.6, lng: -46.75 }, { lat: -23.6, lng: -46.75 }, 0, 0.001],
    ['1° of latitude', { lat: 0, lng: 0 }, { lat: 1, lng: 0 }, ONE_DEGREE_M, 1],
    ['1° of longitude at the equator', { lat: 0, lng: 0 }, { lat: 0, lng: 1 }, ONE_DEGREE_M, 1],
    [
      '1° of longitude at 60°S is half',
      { lat: -60, lng: 0 },
      { lat: -60, lng: 1 },
      ONE_DEGREE_M / 2,
      30,
    ],
    [
      '0,01° of latitude (~1,1 km)',
      { lat: -23.6, lng: -46.75 },
      { lat: -23.61, lng: -46.75 },
      1112,
      1,
    ],
    ['London → Paris', { lat: 51.5074, lng: -0.1278 }, { lat: 48.8566, lng: 2.3522 }, 343_556, 500],
    ['crosses the antimeridian', { lat: 0, lng: 179.5 }, { lat: 0, lng: -179.5 }, ONE_DEGREE_M, 1],
    [
      'antipodes = half the circumference',
      { lat: 0, lng: 0 },
      { lat: 0, lng: 180 },
      Math.PI * 6_371_000,
      1,
    ],
  ])('%s', (_label, a, b, expected, tolerance) => {
    expect(Math.abs(distanceMeters(a, b) - expected)).toBeLessThanOrEqual(tolerance);
  });

  it('is symmetric', () => {
    const a = { lat: -23.6, lng: -46.75 };
    const b = { lat: -23.55, lng: -46.63 };
    expect(distanceMeters(a, b)).toBeCloseTo(distanceMeters(b, a), 6);
  });
});

describe('distance format', () => {
  it.each([
    [0, '0 m'],
    [849, '850 m'],
    [994, '990 m'],
    [996, '1,0 km'],
    [1200, '1,2 km'],
    [1249, '1,2 km'],
    [15_000, '15,0 km'],
  ])('%d m → %s', (m, text) => {
    expect(formatDistance(m)).toBe(text);
  });
});

const origin = { lat: -23.6, lng: -46.75 };
const at = (km: number) => ({ lat: origin.lat + km / 111.195, lng: origin.lng });
const make = (
  id: string,
  km: number,
  allergenFriendly: Restaurant['allergenFriendly'],
  cuisine: Restaurant['cuisine'] = 'other',
  name = id,
): Restaurant => ({
  id,
  name,
  address: 'Rua X, 1',
  ...at(km),
  cuisine,
  allergenFriendly,
  rating: null,
  image: null,
});

describe('coverage and order (rule 3.3)', () => {
  const list = [
    make('far-full', 5, ['gluten', 'milk']),
    make('near-full', 1, ['gluten', 'milk', 'egg']),
    make('near-gluten', 0.5, ['gluten']),
    make('nothing', 0.2, []),
    make('outside', 20, ['gluten', 'milk']),
  ];

  it('Glúten + Leite: only restaurants covering both, by distance; outside 15 km is hidden', () => {
    const { items, approximate } = rankRestaurants(list, ['gluten', 'milk'], origin);
    expect(approximate).toBe(false);
    expect(items.map((i) => i.restaurant.id)).toEqual(['near-full', 'far-full']);
    expect(items[0]?.covered).toEqual(['gluten', 'milk']);
  });

  it('no restaurant covers everything: most covered first, then distance, with the notice', () => {
    const { items, approximate } = rankRestaurants(list, ['gluten', 'milk', 'peanut'], origin);
    expect(approximate).toBe(true);
    expect(items.map((i) => i.restaurant.id)).toEqual([
      'near-full',
      'far-full',
      'near-gluten',
      'nothing',
    ]);
    expect(items[0]?.missing).toEqual(['peanut']);
  });

  it('changing the address recalculates distances and order', () => {
    const farOrigin = at(6);
    const { items } = rankRestaurants(list, ['gluten', 'milk'], farOrigin);
    expect(items.map((i) => i.restaurant.id)).toEqual(['far-full', 'near-full', 'outside']);
    expect(Math.round((items[0]?.distance ?? 0) / 100)).toBe(10);
  });

  it('profile without allergies: everything inside the radius, by distance', () => {
    const { items, approximate } = rankRestaurants(list, [], origin);
    expect(approximate).toBe(false);
    expect(items.map((i) => i.restaurant.id)).toEqual([
      'nothing',
      'near-gluten',
      'near-full',
      'far-full',
    ]);
  });

  it('no restaurant inside the radius: empty, without the notice', () => {
    expect(rankRestaurants(list, ['gluten'], { lat: 10, lng: 10 })).toEqual({
      items: [],
      approximate: false,
    });
  });

  it('without a location there is no radius and no distance (sorted by name)', () => {
    const { items } = rankRestaurants(
      [make('b', 30, ['milk'], 'other', 'Bistrô'), make('a', 1, ['milk'], 'other', 'Açaí')],
      ['milk'],
      null,
    );
    expect(items.map((i) => i.restaurant.name)).toEqual(['Açaí', 'Bistrô']);
    expect(items[0]?.distance).toBeNull();
  });
});

describe('search and category', () => {
  const labels = {
    healthy: 'Saudáveis',
    vegetarian: 'Vegetariano',
    snacks: 'Lanches',
    other: 'Outros',
  } as const;
  const { items } = rankRestaurants(
    [
      make('1', 1, [], 'vegetarian', 'Cantinho Natural'),
      make('2', 2, [], 'snacks', 'Lanchonete do Zé'),
      make('3', 3, [], 'healthy', 'Açaí Saudável'),
    ],
    [],
    origin,
  );
  const ids = (q: string, c: Parameters<typeof filterRestaurants>[2]) =>
    filterRestaurants(items, q, c, labels).map((i) => i.restaurant.id);

  it('by name or cuisine, without accents or case', () => {
    expect(ids('ACAI', 'all')).toEqual(['3']);
    expect(ids('vegetariano', 'all')).toEqual(['1']);
    expect(ids('lanche', 'all')).toEqual(['2']);
    expect(ids('  ', 'all')).toEqual(['1', '2', '3']);
  });

  it('category alone and combined with the search', () => {
    expect(ids('', 'healthy')).toEqual(['3']);
    expect(ids('natural', 'healthy')).toEqual([]);
    expect(ids('natural', 'vegetarian')).toEqual(['1']);
  });
});

describe('card text and route', () => {
  it('cites at most 2 allergens + "e mais N"', () => {
    expect(allergenFreeText([])).toBe('');
    expect(allergenFreeText(['gluten'])).toBe('Opções sem glúten');
    expect(allergenFreeText(['gluten', 'milk'])).toBe('Opções sem glúten e sem leite');
    expect(allergenFreeText(['gluten', 'milk', 'egg', 'soy'])).toBe(
      'Opções sem glúten, sem leite e mais 2',
    );
  });

  it('Google Maps directions to the restaurant coordinates', () => {
    expect(routeUrl({ lat: -23.6012, lng: -46.7589 })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=-23.6012,-46.7589&travelmode=driving',
    );
  });
});
