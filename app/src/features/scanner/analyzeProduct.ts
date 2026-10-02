import { ALLERGENS, type AllergenId } from '@/constants/allergens';
import type { PreferenceId } from '@/constants/preferences';

export interface Product {
  barcode: string;
  name: string | null;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  ingredientsText: string | null;
  ingredients: string[];
  allergensDeclared: AllergenId[];
  tracesDeclared: AllergenId[];
  source: string;
}

export interface AnalysisProfile {
  allergies: readonly AllergenId[];
  customAllergies: readonly string[];
  preferences: readonly PreferenceId[];
}

export type Verdict = 'safe' | 'warning' | 'contains';
export type MatchKind = 'declared' | 'ingredient' | 'trace' | 'custom';

export interface Match {
  allergenId?: AllergenId;
  term?: string;
  kind: MatchKind;
  evidence: string;
  found?: boolean;
}

export interface AnalysisResult {
  verdict: Verdict;
  matches: Match[];
  remainingIngredients: string[];
  missingData: boolean;
  dietNotes: string[];
}

export const MIN_COMPLETE_INGREDIENTS = 3;
export const DECLARED_EVIDENCE = 'declarado pelo fabricante';

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function containsWord(normalizedText: string, term: string): boolean {
  const t = normalizeText(term);
  return t.length > 0 && ` ${normalizedText} `.includes(` ${t} `);
}

const TRACE_PHRASES = [
  'pode conter',
  'podem conter',
  'contem tracos de',
  'tracos de',
  'pode conter tracos de',
  'may contain',
  'traces of',
  'may contain traces of',
];

const ABSENCE_PHRASES = ['nao contem', 'sem', 'isento de', 'livre de', 'contains no', 'free from'];

const MEAT_TERMS = [
  'carne',
  'frango',
  'bacon',
  'presunto',
  'peixe',
  'atum',
  'camarao',
  'gelatina',
  'banha',
];
const ANIMAL_TERMS = [
  ...MEAT_TERMS,
  'leite',
  'manteiga',
  'queijo',
  'soro de leite',
  'ovo',
  'ovos',
  'mel',
  'caseina',
  'lactose',
];

interface Clauses {
  main: string;
  traces: string[];
}

function splitClauses(text: string): Clauses {
  const traces: string[] = [];
  const main: string[] = [];
  for (const sentence of text.split(/[.;:\n]+/)) {
    const n = normalizeText(sentence);
    if (!n) continue;
    const trace = TRACE_PHRASES.map((p) => ({ p, i: ` ${n} `.indexOf(` ${p} `) }))
      .filter((x) => x.i >= 0)
      .sort((a, b) => a.i - b.i)[0];
    if (trace) {
      main.push(n.slice(0, trace.i).trim());
      traces.push(n.slice(trace.i + trace.p.length).trim());
      continue;
    }
    main.push(removeAbsenceStatements(n));
  }
  return { main: main.filter(Boolean).join(' '), traces };
}

const ALL_TERMS = ALLERGENS.flatMap((a) => [a.label, ...a.synonyms, ...a.synonymsEn])
  .map(normalizeText)
  .sort((a, b) => b.length - a.length);

function removeAbsenceStatements(normalizedSentence: string): string {
  let text = ` ${normalizedSentence} `;
  for (const phrase of ABSENCE_PHRASES) {
    for (const term of ALL_TERMS) {
      text = text.split(` ${phrase} ${term} `).join(' ');
    }
  }
  return text.trim();
}

function synonymsOf(id: AllergenId): string[] {
  const allergen = ALLERGENS.find((a) => a.id === id);
  return allergen ? [allergen.label, ...allergen.synonyms, ...allergen.synonymsEn] : [];
}

export function analyzeProduct(product: Product, profile: AnalysisProfile): AnalysisResult {
  const text = product.ingredientsText?.trim() ?? '';
  const { main, traces } = splitClauses(text);
  const matches: Match[] = [];
  const alertTerms: string[] = [];

  for (const id of profile.allergies) {
    if (product.allergensDeclared.includes(id)) {
      matches.push({ allergenId: id, kind: 'declared', evidence: DECLARED_EVIDENCE });
    }
    const hit = synonymsOf(id).find((s) => containsWord(main, s));
    if (hit) {
      matches.push({ allergenId: id, kind: 'ingredient', evidence: hit });
      alertTerms.push(hit);
    }
    if (!product.allergensDeclared.includes(id) && !hit) {
      const traceHit = synonymsOf(id).find((s) => traces.some((t) => containsWord(t, s)));
      if (product.tracesDeclared.includes(id) || traceHit) {
        matches.push({ allergenId: id, kind: 'trace', evidence: traceHit ?? DECLARED_EVIDENCE });
      }
    }
  }

  const fullText = normalizeText(text);
  for (const term of profile.customAllergies) {
    const found = containsWord(fullText, term);
    matches.push({ term, kind: 'custom', evidence: found ? term : '', found });
    if (found) alertTerms.push(term);
  }

  const missingData =
    text.length === 0 ||
    (product.allergensDeclared.length === 0 &&
      product.ingredients.length < MIN_COMPLETE_INGREDIENTS);

  let verdict: Verdict = 'safe';
  if (matches.some((m) => m.kind === 'declared' || m.kind === 'ingredient')) {
    verdict = 'contains';
  } else if (matches.length > 0 || missingData) {
    verdict = 'warning';
  }

  const remainingIngredients = product.ingredients.filter((ing) => {
    const n = normalizeText(ing);
    return !alertTerms.some((t) => containsWord(n, t));
  });

  const dietNotes: string[] = [];
  const animalFound = (list: string[]) => list.filter((t) => containsWord(fullText, t));
  if (profile.preferences.includes('vegan')) {
    const found = animalFound(ANIMAL_TERMS);
    if (found.length)
      dietNotes.push(`Pode ter ingredientes de origem animal: ${found.join(', ')}.`);
  } else if (profile.preferences.includes('vegetarian')) {
    const found = animalFound(MEAT_TERMS);
    if (found.length) dietNotes.push(`Pode ter carne, peixe ou derivados: ${found.join(', ')}.`);
  }

  return { verdict, matches, remainingIngredients, missingData, dietNotes };
}
