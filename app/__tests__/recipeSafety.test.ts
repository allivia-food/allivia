import { computeSafety, type SafetyInput, type SafetyProfile } from '@/utils/recipeSafety';

const recipe = (over: Partial<SafetyInput> = {}): SafetyInput => ({
  allergens: [],
  ingredients: ['400 g de peito de frango', '1 cenoura', 'sal a gosto'],
  allergensReviewed: true,
  ...over,
});
const profile = (over: Partial<SafetyProfile> = {}): SafetyProfile => ({
  allergies: ['milk', 'gluten'],
  customAllergies: [],
  ...over,
});

describe('computeSafety', () => {
  it('1. reviewed recipe without the profile allergens is safe', () => {
    const s = computeSafety(recipe(), profile());
    expect(s.level).toBe('safe');
    expect(s.labels).toEqual([]);
  });

  it('2. tagged allergen of the profile is danger', () => {
    const s = computeSafety(recipe({ allergens: ['milk'] }), profile());
    expect(s.level).toBe('danger');
    expect(s.contains).toEqual(['milk']);
    expect(s.labels).toEqual(['Leite']);
  });

  it('3. synonym in an ingredient is danger even when not tagged (manteiga = leite)', () => {
    const s = computeSafety(recipe({ ingredients: ['2 colheres de manteiga'] }), profile());
    expect(s.level).toBe('danger');
    expect(s.synonymHits).toEqual(['milk']);
  });

  it('4. synonym match ignores accents and case (CASEÍNA)', () => {
    const s = computeSafety(recipe({ ingredients: ['Proteína com CASEINA'] }), profile());
    expect(s.level).toBe('danger');
  });

  it('5. "farinha de trigo" is gluten through the synonym "trigo"', () => {
    const s = computeSafety(recipe({ ingredients: ['2 xícaras de farinha de trigo'] }), profile());
    expect(s.level).toBe('danger');
    expect(s.synonymHits).toEqual(['gluten']);
  });

  it('6. custom allergy found in an ingredient is danger', () => {
    const s = computeSafety(
      recipe({ ingredients: ['1 colher de mostarda dijon'] }),
      profile({ allergies: [], customAllergies: ['Mostarda'] }),
    );
    expect(s.level).toBe('danger');
    expect(s.customHits).toEqual(['Mostarda']);
    expect(s.labels).toEqual(['Mostarda']);
  });

  it('7. custom allergy not found is still warning (text search never guarantees absence)', () => {
    const s = computeSafety(recipe(), profile({ allergies: [], customAllergies: ['Kiwi'] }));
    expect(s.level).toBe('warning');
    expect(s.labels).toEqual(['Kiwi']);
  });

  it('8. recipe not reviewed is warning with all profile allergies', () => {
    const s = computeSafety(recipe({ allergensReviewed: false }), profile());
    expect(s.level).toBe('warning');
    expect(s.labels).toEqual(['Leite', 'Glúten']);
  });

  it('9. danger wins over warning (unreviewed recipe with butter)', () => {
    const s = computeSafety(
      recipe({ allergensReviewed: false, ingredients: ['manteiga'] }),
      profile(),
    );
    expect(s.level).toBe('danger');
  });

  it('10. allergens outside the profile do not matter', () => {
    const s = computeSafety(recipe({ allergens: ['egg', 'soy'] }), profile());
    expect(s.level).toBe('safe');
  });

  it('11. tag and synonym of the same allergen are listed once', () => {
    const s = computeSafety(
      recipe({ allergens: ['milk'], ingredients: ['1 xícara de leite'] }),
      profile(),
    );
    expect(s.labels).toEqual(['Leite']);
  });

  it('12. profile without any allergy is safe on a reviewed recipe', () => {
    const s = computeSafety(recipe({ allergens: ['milk'] }), profile({ allergies: [] }));
    expect(s.level).toBe('safe');
  });

  it('13. several hits are all listed (egg via maionese and fish via atum)', () => {
    const s = computeSafety(
      recipe({ ingredients: ['2 colheres de maionese', '1 lata de atum'] }),
      profile({ allergies: ['egg', 'fish'] }),
    );
    expect(s.level).toBe('danger');
    expect(s.labels).toEqual(['Ovo', 'Peixes']);
  });
});
