import type { AllergenId } from '@/constants/allergens';
import {
  analyzeProduct,
  containsWord,
  normalizeText,
  type AnalysisProfile,
  type Product,
} from '@/features/scanner/analyzeProduct';

const product = (over: Partial<Product> = {}): Product => ({
  barcode: '7891000100103',
  name: 'Produto',
  brand: 'Marca',
  category: 'Biscoitos',
  imageUrl: null,
  ingredientsText: 'açúcar, óleo vegetal, sal, fermento químico',
  ingredients: ['açúcar', 'óleo vegetal', 'sal', 'fermento químico'],
  allergensDeclared: [],
  tracesDeclared: [],
  source: 'test',
  ...over,
});
const profile = (
  allergies: AllergenId[],
  over: Partial<AnalysisProfile> = {},
): AnalysisProfile => ({
  allergies,
  customAllergies: [],
  preferences: [],
  ...over,
});
const verdictOf = (text: string, allergies: AllergenId[]) =>
  analyzeProduct(
    product({ ingredientsText: text, ingredients: text.split(',').map((s) => s.trim()) }),
    profile(allergies),
  ).verdict;

describe('normalizeText', () => {
  it('lowercases, removes accents and punctuation, collapses spaces', () => {
    expect(normalizeText('  Farinha de TRIGO, Açúcar;  Leite-em-pó ')).toBe(
      'farinha de trigo acucar leite em po',
    );
  });
});

describe('whole-word matching (table)', () => {
  it.each([
    ['açúcar, ovo, farinha de arroz, sal', ['egg'], 'contains'],
    ['açúcar, ovos, farinha de arroz, sal', ['egg'], 'contains'],
    ['açúcar, OVO pasteurizado, sal', ['egg'], 'contains'],
    ['queijo provolone, sal, orégano', ['egg'], 'safe'],
    ['produto novo, açúcar, sal, amido', ['egg'], 'safe'],
    ['maionese, sal, vinagre', ['egg'], 'contains'],
    ['albumina, açúcar, sal', ['egg'], 'contains'],
    ['leite integral, açúcar, cacau', ['milk'], 'contains'],
    ['soro de leite, açúcar, sal', ['milk'], 'contains'],
    ['manteiga, farinha de arroz, sal', ['milk'], 'contains'],
    ['CASEÍNA, açúcar, sal', ['milk'], 'contains'],
    ['leite de coco, açúcar, sal', ['milk'], 'contains'],
    ['lactobacilos vivos, açúcar, sal, água', ['milk'], 'safe'],
    ['farinha de trigo enriquecida, açúcar, sal', ['gluten'], 'contains'],
    ['aveia em flocos, mel, sal', ['gluten'], 'contains'],
    ['extrato de malte, açúcar, sal', ['gluten'], 'contains'],
    ['trigueiro, açúcar, sal, água', ['gluten'], 'safe'],
    ['wheat flour, sugar, salt', ['gluten'], 'contains'],
    ['lecitina de soja, açúcar, cacau', ['soy'], 'contains'],
    ['shoyu, açúcar, sal', ['soy'], 'contains'],
    ['sojaria, açúcar, sal, água', ['soy'], 'safe'],
    ['amendoim torrado, sal, óleo', ['peanut'], 'contains'],
    ['atum em pedaços, óleo, sal', ['fish'], 'contains'],
    ['camarão, alho, sal', ['shellfish'], 'contains'],
    ['açúcar, sal, amido. Pode conter amendoim', ['peanut'], 'warning'],
    ['açúcar, sal, amido. Contém traços de leite', ['milk'], 'warning'],
    ['sugar, salt, starch. May contain eggs', ['egg'], 'warning'],
    ['açúcar, sal, amido. Não contém glúten', ['gluten'], 'safe'],
    ['açúcar, sal, amido, pão sem lactose com leite', ['milk'], 'contains'],
    ['açúcar, sal, amido, castanha de caju', ['tree_nuts'], 'contains'],
  ] as const)('%s → %s', (text, allergies, expected) => {
    expect(verdictOf(text, [...allergies])).toBe(expected);
  });

  it('containsWord matches phrases as a whole', () => {
    expect(containsWord('farinha de trigo integral', 'farinha de trigo')).toBe(true);
    expect(containsWord('farinha de trigoso', 'farinha de trigo')).toBe(false);
  });
});

describe('verdict rules (section 4.4)', () => {
  it('declared by the manufacturer is contains, with that evidence', () => {
    const r = analyzeProduct(product({ allergensDeclared: ['milk'] }), profile(['milk']));
    expect(r.verdict).toBe('contains');
    expect(r.matches).toContainEqual({
      allergenId: 'milk',
      kind: 'declared',
      evidence: 'declarado pelo fabricante',
    });
  });

  it('declared trace is warning', () => {
    const r = analyzeProduct(product({ tracesDeclared: ['peanut'] }), profile(['peanut']));
    expect(r.verdict).toBe('warning');
    expect(r.matches[0].kind).toBe('trace');
  });

  it('product without ingredients is never safe', () => {
    const r = analyzeProduct(product({ ingredientsText: null, ingredients: [] }), profile([]));
    expect(r.verdict).toBe('warning');
    expect(r.missingData).toBe(true);
  });

  it('too short list without declared allergens is warning (incomplete data)', () => {
    const r = analyzeProduct(
      product({ ingredientsText: 'açúcar, sal', ingredients: ['açúcar', 'sal'] }),
      profile(['milk']),
    );
    expect(r.verdict).toBe('warning');
    expect(r.missingData).toBe(true);
  });

  it('custom allergy is never safe: found or not, at least warning', () => {
    const notFound = analyzeProduct(product(), profile([], { customAllergies: ['Mostarda'] }));
    expect(notFound.verdict).toBe('warning');
    expect(notFound.matches).toContainEqual({
      term: 'Mostarda',
      kind: 'custom',
      evidence: '',
      found: false,
    });
    const found = analyzeProduct(
      product({ ingredientsText: 'açúcar, mostarda em pó, sal, vinagre' }),
      profile([], { customAllergies: ['mostarda'] }),
    );
    expect(found.verdict).toBe('warning');
    expect(found.matches[0].found).toBe(true);
  });

  it('safe only with a complete list, no match and no custom allergy', () => {
    expect(analyzeProduct(product(), profile(['milk', 'gluten'])).verdict).toBe('safe');
  });

  it('contains wins over warning', () => {
    const r = analyzeProduct(
      product({ ingredientsText: 'leite, açúcar, sal. Pode conter amendoim' }),
      profile(['milk', 'peanut']),
    );
    expect(r.verdict).toBe('contains');
    expect(r.matches.map((m) => m.kind)).toEqual(['ingredient', 'trace']);
  });

  it('remaining ingredients exclude the ones that triggered alerts', () => {
    const r = analyzeProduct(
      product({
        ingredientsText: 'farinha de trigo, açúcar, leite em pó, sal',
        ingredients: ['farinha de trigo', 'açúcar', 'leite em pó', 'sal'],
      }),
      profile(['milk', 'gluten']),
    );
    expect(r.remainingIngredients).toEqual(['açúcar', 'sal']);
  });

  it('diet notes are informative and do not change the verdict', () => {
    const r = analyzeProduct(
      product({ ingredientsText: 'açúcar, gelatina, sal, aroma' }),
      profile([], { preferences: ['vegetarian'] }),
    );
    expect(r.verdict).toBe('safe');
    expect(r.dietNotes[0]).toMatch(/gelatina/);
  });
});
