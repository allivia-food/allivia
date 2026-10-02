import { readFileSync } from 'fs';
import { join } from 'path';

import { ALLERGENS } from '@/constants/allergens';

describe('allergen catalog', () => {
  const sql = readFileSync(join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8');
  const seedRows = [...sql.matchAll(/\('([a-z_]+)',\s*'([^']+)',\s*array\[([^\]]*)\]\)/g)].map(
    (m) => ({
      id: m[1],
      label: m[2],
      synonyms: [...m[3].matchAll(/'([^']+)'/g)].map((s) => s[1]),
    }),
  );

  it('has the same ids, labels and synonyms as the database seed', () => {
    expect(seedRows).toEqual(
      ALLERGENS.map((a) => ({ id: a.id, label: a.label, synonyms: [...a.synonyms] })),
    );
  });

  it('uses "Glúten" (never "Trigo") as label', () => {
    expect(ALLERGENS.map((a) => a.label)).not.toContain('Trigo');
  });
});
