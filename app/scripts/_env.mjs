import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = join(dirname(fileURLToPath(import.meta.url)), '..');

export function loadEnv() {
  const file = join(appDir, '.env');
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => [
        l.slice(0, l.indexOf('=')).trim(),
        l
          .slice(l.indexOf('=') + 1)
          .trim()
          .replace(/^(['"])(.*)\1$/, '$2'),
      ]),
  );
}

export const resultsDir = join(appDir, 'scripts', 'poc', 'resultados');
