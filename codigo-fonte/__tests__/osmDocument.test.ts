/** @jest-environment node */
import { MAP_DOCUMENT, mapUpdateScript } from '@/features/restaurants/mapDocument';

it('runs the actual bundled Leaflet document and bridges restaurant marker clicks', () => {
  const { JSDOM } = jest.requireActual('jsdom');
  const messages: { type: string; id?: string }[] = [];
  const dom = new JSDOM(MAP_DOCUMENT, {
    runScripts: 'dangerously',
    beforeParse(window: Window & typeof globalThis) {
      Object.defineProperty(window.SVGSVGElement.prototype, 'createSVGRect', { value: () => ({}) });
      Object.assign(window, {
        ResizeObserver: class {
          observe() {}
          disconnect() {}
          unobserve() {}
        },
        ReactNativeWebView: { postMessage: (raw: string) => messages.push(JSON.parse(raw)) },
      });
    },
  });
  try {
    expect(messages).toContainEqual({ type: 'ready' });
    const fitBounds = jest.spyOn(dom.window.L.Map.prototype, 'fitBounds');
    const initialState = {
      origin: { lat: -23.6, lng: -46.7 },
      selectedId: null,
      points: [{ id: 'distant', name: 'Restaurante distante', lat: -22.9, lng: -43.2 }],
    };
    dom.window.eval(mapUpdateScript(initialState));
    expect(fitBounds).toHaveBeenCalledTimes(1);
    const bounds = fitBounds.mock.calls[0][0] as { contains(point: number[]): boolean };
    expect(bounds.contains([-22.9, -43.2])).toBe(true);
    // Repeated updates must preserve the user's current pan and zoom.
    dom.window.eval(mapUpdateScript(initialState));
    expect(fitBounds).toHaveBeenCalledTimes(1);
    fitBounds.mockRestore();
    const name = '<img src=x onerror=alert(1)> Restaurante';
    dom.window.eval(
      mapUpdateScript({
        origin: { lat: -23.6, lng: -46.7 },
        selectedId: 'r1',
        points: [{ id: 'r1', name, lat: -23.61, lng: -46.71 }],
      }),
    );
    const document = dom.window.document as Document;
    const marker = document.querySelector('path[role="button"]');
    expect(marker?.getAttribute('aria-label')).toBe(name);
    expect(document.querySelector('img[src="x"]')).toBeNull();
    expect(document.querySelector('.leaflet-control-attribution')?.textContent).toContain(
      'OpenStreetMap contributors',
    );
    expect(messages).toContainEqual({ type: 'centered', id: 'r1' });
    marker?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    expect(messages).toContainEqual({ type: 'select', id: 'r1' });
  } finally {
    dom.window.close();
  }
});
