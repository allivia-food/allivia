import leaflet from '../../../assets/maps/leaflet.json';

export interface MapPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface MapState {
  origin: { lat: number; lng: number };
  points: MapPoint[];
  selectedId: string | null;
}

// No user-supplied content is interpolated into HTML. Updates use JSON and textContent.
export const mapScript = String.raw`
(function () {
  var map = L.map('map', { attributionControl: false });
  var user, lastOrigin, lastSelected, lastPoints, layer = L.layerGroup().addTo(map);
  var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, minZoom: 3, updateWhenIdle: true, keepBuffer: 0,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }).addTo(map);
  L.control.attribution({ position: 'topright', prefix: false }).addTo(map);
  function send(message) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
    else window.parent.postMessage({ source: 'allivia-map', ...message }, '*');
  }
  tiles.on('tileerror', function () { send({ type: 'tile-error' }); });
  tiles.on('tileload', function () { send({ type: 'tile-loaded' }); });
  window.updateAlliviaMap = function (state) {
    var originKey = state.origin.lat + ',' + state.origin.lng;
    var originChanged = lastOrigin !== originKey;
    if (lastOrigin !== originKey) {
      lastOrigin = originKey;
      map.setView([state.origin.lat, state.origin.lng], 13);
    }
    if (user) user.remove();
    user = L.circleMarker([state.origin.lat, state.origin.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#327bc4', fillOpacity: 1 }).addTo(map);
    user.bindTooltip('Você está aqui');
    layer.clearLayers();
    state.points.forEach(function (point) {
      var selected = point.id === state.selectedId;
      var marker = L.circleMarker([point.lat, point.lng], { radius: selected ? 13 : 10, color: '#fff', weight: 2, fillColor: selected ? '#ed7037' : '#277b59', fillOpacity: 1 }).addTo(layer);
      var label = document.createElement('span'); label.textContent = point.name;
      marker.bindTooltip(label);
      marker.on('click', function () { send({ type: 'select', id: point.id }); });
      marker.on('add', function () {
        var element = marker.getElement();
        if (element) {
          element.setAttribute('role', 'button'); element.setAttribute('tabindex', '0');
          element.setAttribute('aria-label', point.name);
          element.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); send({ type: 'select', id: point.id }); }
          });
        }
      });
      // Layer is already attached; apply accessibility to the rendered SVG now.
      marker.fire('add');
    });
    var point = state.points.find(function (item) { return item.id === state.selectedId; });
    var pointsKey = JSON.stringify(state.points.map(function (item) { return [item.id, item.lat, item.lng]; }));
    map.invalidateSize();
    if (!point && state.points.length && (originChanged || pointsKey !== lastPoints)) {
      map.fitBounds(L.latLngBounds(state.points.map(function (item) { return [item.lat, item.lng]; })), { padding: [24, 24], maxZoom: 15, animate: false });
    }
    lastPoints = pointsKey;
    var selectionKey = point ? point.id + ':' + point.lat + ':' + point.lng : null;
    if (selectionKey && selectionKey !== lastSelected) {
      map.stop();
      map.setView([point.lat, point.lng], 15);
      send({ type: 'centered', id: point.id });
    }
    lastSelected = selectionKey;
    map.invalidateSize();
  };
  window.addEventListener('message', function (event) {
    if (event.source === window.parent && event.data && event.data.type === 'update-map') window.updateAlliviaMap(event.data.state);
  });
  new ResizeObserver(function () { map.invalidateSize(); }).observe(document.getElementById('map'));
  send({ type: 'ready' });
})();`;

export const MAP_DOCUMENT = `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src https://tile.openstreetmap.org data:; connect-src https://tile.openstreetmap.org">
<style>${leaflet.css}
html,body,#map{height:100%;width:100%;margin:0}body{background:#edf3eb}
.leaflet-control-attribution{font-size:10px!important;max-width:190px;text-align:right}
.leaflet-control-zoom{margin-top:8px!important}
</style></head><body><div id="map" role="region" aria-label="Mapa de restaurantes"></div>
<script>${leaflet.js.replace(/<\/script/gi, '<\\/script')}</script>
<script>${mapScript}</script></body></html>`;

export function mapUpdateScript(state: MapState): string {
  const json = JSON.stringify(state)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return `window.updateAlliviaMap && window.updateAlliviaMap(${json}); true;`;
}

export type MapMessage =
  { type: 'ready' | 'tile-error' | 'tile-loaded' } | { type: 'select' | 'centered'; id: string };

export function parseMapMessage(raw: string): MapMessage | null {
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    if (['ready', 'tile-error', 'tile-loaded'].includes(value.type)) return { type: value.type };
    if (['select', 'centered'].includes(value.type) && typeof value.id === 'string')
      return { type: value.type, id: value.id };
  } catch {
    /* Ignore messages that do not match the map protocol. */
  }
  return null;
}
