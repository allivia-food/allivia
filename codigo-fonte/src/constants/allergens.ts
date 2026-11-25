export type AllergenId =
  'milk' | 'egg' | 'peanut' | 'tree_nuts' | 'gluten' | 'soy' | 'fish' | 'shellfish';

export interface Allergen {
  id: AllergenId;
  label: string;
  synonyms: readonly string[];
  synonymsEn: readonly string[];
  offTags: readonly string[];
}

export const ALLERGENS: readonly Allergen[] = [
  {
    id: 'milk',
    label: 'Leite',
    synonyms: [
      'leite',
      'lactose',
      'soro de leite',
      'caseína',
      'caseinato',
      'manteiga',
      'queijo',
      'creme de leite',
      'iogurte',
      'whey',
    ],
    synonymsEn: [
      'milk',
      'lactose',
      'whey',
      'casein',
      'caseinate',
      'butter',
      'cheese',
      'cream',
      'yogurt',
      'yoghurt',
      'ghee',
      'buttermilk',
    ],
    offTags: ['en:milk'],
  },
  {
    id: 'egg',
    label: 'Ovo',
    synonyms: ['ovo', 'ovos', 'albumina', 'clara', 'gema', 'lisozima', 'maionese'],
    synonymsEn: ['egg', 'eggs', 'albumin', 'yolk', 'egg white', 'lysozyme', 'mayonnaise'],
    offTags: ['en:eggs'],
  },
  {
    id: 'peanut',
    label: 'Amendoim',
    synonyms: ['amendoim', 'pasta de amendoim'],
    synonymsEn: ['peanut', 'peanuts', 'groundnut'],
    offTags: ['en:peanuts'],
  },
  {
    id: 'tree_nuts',
    label: 'Castanhas',
    synonyms: [
      'castanha',
      'castanha-do-pará',
      'caju',
      'amêndoa',
      'avelã',
      'noz',
      'nozes',
      'pistache',
      'macadâmia',
    ],
    synonymsEn: [
      'almond',
      'cashew',
      'hazelnut',
      'walnut',
      'pecan',
      'pistachio',
      'macadamia',
      'brazil nut',
      'tree nut',
    ],
    offTags: ['en:nuts'],
  },
  {
    id: 'gluten',
    label: 'Glúten',
    synonyms: [
      'glúten',
      'trigo',
      'centeio',
      'cevada',
      'malte',
      'farinha de trigo',
      'semolina',
      'aveia',
    ],
    synonymsEn: ['gluten', 'wheat', 'rye', 'barley', 'malt', 'flour', 'semolina', 'spelt', 'oats'],
    offTags: ['en:gluten'],
  },
  {
    id: 'soy',
    label: 'Soja',
    synonyms: ['soja', 'lecitina de soja', 'proteína de soja', 'shoyu'],
    synonymsEn: ['soy', 'soya', 'soybean', 'tofu', 'tempeh', 'miso', 'edamame', 'soy sauce'],
    offTags: ['en:soybeans'],
  },
  {
    id: 'fish',
    label: 'Peixes',
    synonyms: ['peixe', 'bacalhau', 'atum', 'salmão', 'sardinha', 'anchova'],
    synonymsEn: ['fish', 'cod', 'tuna', 'salmon', 'sardine', 'anchovy', 'tilapia'],
    offTags: ['en:fish'],
  },
  {
    id: 'shellfish',
    label: 'Frutos do mar',
    synonyms: [
      'camarão',
      'lagosta',
      'caranguejo',
      'siri',
      'marisco',
      'mexilhão',
      'ostra',
      'lula',
      'polvo',
    ],
    synonymsEn: [
      'shrimp',
      'prawn',
      'lobster',
      'crab',
      'clam',
      'mussel',
      'oyster',
      'squid',
      'octopus',
      'scallop',
    ],
    offTags: ['en:crustaceans', 'en:molluscs'],
  },
];
