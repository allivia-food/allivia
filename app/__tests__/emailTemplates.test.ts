/** @jest-environment node */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let directory: string;

beforeAll(() => {
  directory = mkdtempSync(join(tmpdir(), 'allivia-emails-'));
  execFileSync(process.execPath, [join(process.cwd(), 'scripts/gerar-emails.mjs'), directory]);
});

afterAll(() => {
  if (directory) rmSync(directory, { recursive: true, force: true });
});
it.each(['confirm-signup', 'reset-password', 'magic-link'])(
  '%s keeps the real Supabase token and does not depend on external images or scripts',
  (name) => {
    const { JSDOM } = jest.requireActual('jsdom');
    const html = readFileSync(join(directory, `${name}.html`), 'utf8');
    const dom = new JSDOM(html);
    try {
      expect(dom.window.document.documentElement.lang).toBe('pt-BR');
      expect(dom.window.document.body.textContent).toContain('{{ .Token }}');
      expect(html).not.toContain('012345');
      expect(dom.window.document.querySelectorAll('script,img').length).toBe(0);
      expect(dom.window.document.querySelector('meta[name="viewport"]')).not.toBeNull();
      expect(html.toLowerCase()).toContain('#4c532f');
      expect(html.toLowerCase()).toContain('#f68424');
    } finally {
      dom.window.close();
    }
  },
);
