import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { withTimeout } from '@/utils/withTimeout';

import type { LatLng } from './rules';

export interface ChosenLocation extends LatLng {
  label: string;
  detail: string;
  source: 'device' | 'address';
}

export type LocationErrorKind = 'denied' | 'unavailable' | 'unsupported';

export class LocationError extends Error {
  constructor(public kind: LocationErrorKind) {
    super(`location ${kind}`);
    this.name = 'LocationError';
  }
}

const POSITION_TIMEOUT_MS = 15_000;

export const canSearchAddress = Platform.OS !== 'web';

function labels(address: Location.LocationGeocodedAddress | undefined, fallback: string) {
  if (!address) return { label: fallback, detail: fallback };
  const street = [address.street ?? address.name, address.streetNumber].filter(Boolean).join(', ');
  const label = street || address.district || address.city || fallback;
  const detail = [label, address.city ?? address.subregion].filter(Boolean).join(' — ');
  return { label, detail };
}

async function describe(point: LatLng, fallback: string) {
  if (!canSearchAddress) return { label: fallback, detail: fallback };
  try {
    const [address] = await Location.reverseGeocodeAsync({
      latitude: point.lat,
      longitude: point.lng,
    });
    return labels(address, fallback);
  } catch {
    return { label: fallback, detail: fallback };
  }
}

export async function getDeviceLocation(fallbackLabel: string): Promise<ChosenLocation> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new LocationError('denied');
  if (!(await Location.hasServicesEnabledAsync())) throw new LocationError('unavailable');
  let position: Location.LocationObject;
  try {
    position = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      POSITION_TIMEOUT_MS,
    );
  } catch {
    throw new LocationError('unavailable');
  }
  const point = { lat: position.coords.latitude, lng: position.coords.longitude };
  return { ...point, ...(await describe(point, fallbackLabel)), source: 'device' };
}

export async function hasLocationPermission(): Promise<boolean> {
  try {
    return (await Location.getForegroundPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function findAddress(text: string): Promise<ChosenLocation | null> {
  if (!canSearchAddress) throw new LocationError('unsupported');
  const query = text.trim();
  if (!query) return null;
  let results: Location.LocationGeocodedLocation[];
  try {
    results = await withTimeout(Location.geocodeAsync(query), POSITION_TIMEOUT_MS);
  } catch {
    return null;
  }
  const first = results[0];
  if (!first) return null;
  const point = { lat: first.latitude, lng: first.longitude };
  return { ...point, ...(await describe(point, query)), source: 'address' };
}
