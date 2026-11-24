import { runInNewContext } from 'node:vm';
import {
  MAP_DOCUMENT,
  mapScript,
  mapUpdateScript,
  parseMapMessage,
  type MapState,
} from '@/features/restaurants/mapDocument';

it('uses bundled Leaflet and attributed HTTPS OpenStreetMap tiles', () => {
  expect(MAP_DOCUMENT).toContain('Leaflet 1.9.4');
  expect(MAP_DOCUMENT).toContain('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
  expect(MAP_DOCUMENT).toContain('OpenStreetMap contributors');
  expect(MAP_DOCUMENT).not.toMatch(/maps\.googleapis|unpkg\.com|cdn\.jsdelivr/);
  expect(() => new Function(mapScript)).not.toThrow();
});

it('transfers names as data, preserving quotes and hostile HTML without running it', () => {
  const state: MapState = {
    origin: { lat: -23.6, lng: -46.7 },
    selectedId: null,
    points: [
      { id: 'r1', name: '</script><script>alert("x")</script>\u2028', lat: -23.5, lng: -46.6 },
    ],
  };
  const receive = jest.fn();
  const script = mapUpdateScript(state);
  expect(script).not.toContain('</script>');
  runInNewContext(script, { window: { updateAlliviaMap: receive } });
  expect(receive).toHaveBeenCalledWith(state);
});

it.each(['bad JSON', 'null', '{}', '{"type":"select","id":23}', '{"type":"unknown"}'])(
  'ignores malformed map messages: %s',
  (raw) => {
    expect(parseMapMessage(raw)).toBeNull();
  },
);

it('accepts marker selection and centering messages', () => {
  expect(parseMapMessage('{"type":"select","id":"r1"}')).toEqual({ type: 'select', id: 'r1' });
  expect(parseMapMessage('{"type":"centered","id":"r1"}')).toEqual({ type: 'centered', id: 'r1' });
});
