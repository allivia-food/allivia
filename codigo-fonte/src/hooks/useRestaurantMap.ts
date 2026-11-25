import { useEffect, useMemo, useRef, useState } from 'react';
import { canSearchAddress, findAddress } from '@/features/restaurants/location';
import { hasCoordinates, type LatLng, type RankedRestaurant } from '@/features/restaurants/rules';
import type { MapState } from '@/features/restaurants/mapDocument';

export interface RestaurantMapProps {
  origin: LatLng;
  items: readonly RankedRestaurant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCentered?: (id: string) => void;
}

export function useRestaurantMap({
  origin,
  items,
  selectedId,
  onCentered,
}: RestaurantMapProps): MapState {
  const [locations, setLocations] = useState<Record<string, LatLng | null>>({});
  const requests = useRef(new Map<string, Promise<LatLng | null>>());
  useEffect(() => {
    if (!canSearchAddress) return;
    let canceled = false;
    void (async () => {
      for (const { restaurant } of items) {
        if (canceled) return;
        if (hasCoordinates(restaurant) || !restaurant.address.trim()) continue;
        let request = requests.current.get(restaurant.address);
        if (!request) {
          request = findAddress(restaurant.address).catch(() => null);
          requests.current.set(restaurant.address, request);
        }
        const point = await request;
        if (canceled) return;
        setLocations((current) =>
          current[restaurant.address] === point
            ? current
            : { ...current, [restaurant.address]: point },
        );
      }
    })();
    return () => {
      canceled = true;
    };
  }, [items]);
  const state = useMemo<MapState>(
    () => ({
      origin: { lat: origin.lat, lng: origin.lng },
      selectedId,
      points: items.flatMap(({ restaurant }) => {
        const point = hasCoordinates(restaurant) ? restaurant : locations[restaurant.address];
        return point
          ? [{ id: restaurant.id, name: restaurant.name, lat: point.lat, lng: point.lng }]
          : [];
      }),
    }),
    [origin, selectedId, items, locations],
  );
  useEffect(() => {
    const selected = items.find(({ restaurant }) => restaurant.id === selectedId)?.restaurant;
    if (!selected || state.points.some((point) => point.id === selectedId)) return;
    if (!canSearchAddress || !selected.address.trim() || selected.address in locations)
      onCentered?.(selected.id);
  }, [selectedId, items, locations, state.points, onCentered]);
  return state;
}
