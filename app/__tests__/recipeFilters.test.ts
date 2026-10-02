import {
  buildSearchParams,
  countActiveFilters,
  defaultFilters,
  isInTimeRange,
  profileKey,
  toggleDiet,
  validateIngredient,
  type RecipeFilters,
} from '@/features/recipes/filters';

const base: RecipeFilters = defaultFilters([]);

describe('buildSearchParams (table 3.3)', () => {
  it('defaults: no manual filter, page 0, 10 per page', () => {
    expect(buildSearchParams(base, 0)).toEqual({
      p_meal_type: null,
      p_min_minutes: null,
      p_max_minutes: null,
      p_diets: [],
      p_include: [],
      p_exclude: [],
      p_limit: 10,
      p_offset: 0,
    });
  });

  it.each([['breakfast'], ['lunch'], ['dinner'], ['snack'], ['dessert']] as const)(
    'meal type %s',
    (meal) => {
      expect(buildSearchParams({ ...base, mealType: meal }, 0).p_meal_type).toBe(meal);
    },
  );

  it('"Todas" sends null', () => {
    expect(buildSearchParams({ ...base, mealType: null }, 0).p_meal_type).toBeNull();
  });

  it('time ranges', () => {
    const p = (time: RecipeFilters['time']) => buildSearchParams({ ...base, time }, 0);
    expect(p('upTo15')).toMatchObject({ p_min_minutes: null, p_max_minutes: 15 });
    expect(p('from15to30')).toMatchObject({ p_min_minutes: 15, p_max_minutes: 30 });
    expect(p('over30')).toMatchObject({ p_min_minutes: 30, p_max_minutes: null });
  });

  it('diets are all required (sent as a list)', () => {
    expect(buildSearchParams({ ...base, diets: ['vegan', 'gluten_free'] }, 0).p_diets).toEqual([
      'vegan',
      'gluten_free',
    ]);
  });

  it('ingredients are sent lowercase and without accents', () => {
    const params = buildSearchParams({ ...base, include: ['Cebola'], exclude: ['Pimentão '] }, 0);
    expect(params.p_include).toEqual(['cebola']);
    expect(params.p_exclude).toEqual(['pimentao']);
  });

  it('pagination offset', () => {
    expect(buildSearchParams(base, 2).p_offset).toBe(20);
  });

  it('never sends the profile allergies (applied in the database)', () => {
    expect(Object.keys(buildSearchParams(base, 0))).not.toContain('p_allergies');
  });
});

describe('isInTimeRange (same rule as the database)', () => {
  it('15-30 min excludes 15 and includes 30', () => {
    expect(isInTimeRange(15, 'from15to30')).toBe(false);
    expect(isInTimeRange(16, 'from15to30')).toBe(true);
    expect(isInTimeRange(30, 'from15to30')).toBe(true);
    expect(isInTimeRange(31, 'from15to30')).toBe(false);
  });

  it('Mais de 30 min excludes 30', () => {
    expect(isInTimeRange(30, 'over30')).toBe(false);
    expect(isInTimeRange(31, 'over30')).toBe(true);
  });

  it('Até 15 min includes 15', () => {
    expect(isInTimeRange(15, 'upTo15')).toBe(true);
    expect(isInTimeRange(16, 'upTo15')).toBe(false);
  });
});

describe('filter counter', () => {
  it('profile preferences pre-checked are not counted', () => {
    expect(countActiveFilters(defaultFilters(['vegan']), ['vegan'])).toBe(0);
  });

  it('counts meal, time, changed diets and each ingredient', () => {
    const f: RecipeFilters = {
      mealType: 'lunch',
      time: 'upTo15',
      diets: ['gluten_free'],
      include: ['cebola', 'alho'],
      exclude: ['pimenta'],
    };
    expect(countActiveFilters(f, [])).toBe(6);
  });
});

describe('diet chips', () => {
  it('Vegano unchecks Vegetariano and vice versa', () => {
    expect(toggleDiet(['vegetarian', 'lactose_free'], 'vegan')).toEqual(['lactose_free', 'vegan']);
    expect(toggleDiet(['vegan'], 'vegetarian')).toEqual(['vegetarian']);
    expect(toggleDiet(['vegan'], 'vegan')).toEqual([]);
  });
});

describe('ingredient chips', () => {
  it('validates length, duplicates and the limit of 5', () => {
    expect(validateIngredient('a', [])).toBe('tooShort');
    expect(validateIngredient('x'.repeat(31), [])).toBe('tooLong');
    expect(validateIngredient('Cebola', ['cebola'])).toBe('duplicate');
    expect(validateIngredient('Pimentão', ['pimentao'])).toBe('duplicate');
    expect(validateIngredient('alho', ['a1', 'a2', 'a3', 'a4', 'a5'])).toBe('limit');
    expect(validateIngredient('alho', ['cebola'])).toBeNull();
  });
});

describe('profileKey', () => {
  it('changes when allergies change and ignores order', () => {
    const a = profileKey({ allergies: ['milk', 'egg'], customAllergies: [], preferences: [] });
    const b = profileKey({ allergies: ['egg', 'milk'], customAllergies: [], preferences: [] });
    const c = profileKey({ allergies: ['milk'], customAllergies: [], preferences: [] });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
