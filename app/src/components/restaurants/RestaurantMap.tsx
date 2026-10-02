import { useEffect, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { strings } from '@/constants/strings';
import type { LatLng, RankedRestaurant } from '@/features/restaurants/rules';
import { colors, layout } from '@/theme';

export interface RestaurantMapProps {
  origin: LatLng;
  items: readonly RankedRestaurant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const delta = layout.restaurants.mapDelta;

export function RestaurantMap({ origin, items, selectedId, onSelect }: RestaurantMapProps) {
  const map = useRef<MapView>(null);

  useEffect(() => {
    map.current?.animateToRegion(
      { latitude: origin.lat, longitude: origin.lng, latitudeDelta: delta, longitudeDelta: delta },
      300,
    );
  }, [origin.lat, origin.lng]);

  useEffect(() => {
    const selected = items.find((i) => i.restaurant.id === selectedId)?.restaurant;
    if (selected) {
      map.current?.animateCamera({ center: { latitude: selected.lat, longitude: selected.lng } });
    }
  }, [selectedId, items]);

  return (
    <MapView
      ref={map}
      style={StyleSheet.absoluteFill}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={{
        latitude: origin.lat,
        longitude: origin.lng,
        latitudeDelta: delta,
        longitudeDelta: delta,
      }}
      accessibilityLabel={strings.restaurants.mapLabel}
      toolbarEnabled={false}
    >
      <Marker
        coordinate={{ latitude: origin.lat, longitude: origin.lng }}
        title={strings.restaurants.youAreHere}
        pinColor={colors.mapUser}
      />
      {items.map(({ restaurant }) => (
        <Marker
          key={restaurant.id}
          identifier={restaurant.id}
          coordinate={{ latitude: restaurant.lat, longitude: restaurant.lng }}
          title={restaurant.name}
          pinColor={restaurant.id === selectedId ? colors.primary : colors.secondary}
          onPress={() => onSelect(restaurant.id)}
          testID={`marker-${restaurant.id}`}
        />
      ))}
    </MapView>
  );
}
