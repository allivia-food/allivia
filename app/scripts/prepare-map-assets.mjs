import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const target = new URL('assets/maps/', root);
mkdirSync(target, { recursive: true });
const read = (path) => readFileSync(new URL(path, root), 'utf8');
writeFileSync(
  new URL('leaflet.json', target),
  JSON.stringify(
    {
      version: '1.9.4',
      js: read('node_modules/leaflet/dist/leaflet.js'),
      css: read('node_modules/leaflet/dist/leaflet.css'),
    },
    null,
    2,
  ) + '\n',
);
writeFileSync(new URL('leaflet-LICENSE.txt', target), read('node_modules/leaflet/LICENSE'));
console.log('Leaflet 1.9.4 bundled for the restaurant map.');
