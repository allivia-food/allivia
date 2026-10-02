import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Linking, StyleSheet } from 'react-native';

import type { Restaurant } from '@/features/restaurants/rules';
import type { Profile } from '@/services/profile';
import { useLocationStore } from '@/store/location';
import { useProfileStore } from '@/store/profile';

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    router: {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      navigate: jest.fn(),
      canGoBack: jest.fn(() => true),
    },
    useLocalSearchParams: () => ({}),
    useFocusEffect: (cb: () => void | (() => void)) => useEffect(cb, [cb]),
  };
});
const mockRouter = jest.requireMock('expo-router').router as Record<string, jest.Mock>;

jest.mock('react-native-maps', () => {
  const { Pressable, View } = jest.requireActual('react-native');
  const { forwardRef, useImperativeHandle } = jest.requireActual('react');
  const MapView = forwardRef((props: { children?: unknown }, ref: unknown) => {
    useImperativeHandle(ref, () => ({ animateToRegion: jest.fn(), animateCamera: jest.fn() }));
    return <View testID="map">{props.children as never}</View>;
  });
  const Marker = (props: { onPress?: () => void; testID?: string; title?: string }) => (
    <Pressable
      onPress={props.onPress}
      testID={props.testID ?? 'marker-user'}
      accessibilityLabel={props.title}
    />
  );
  return { __esModule: true, default: MapView, Marker, PROVIDER_GOOGLE: 'google' };
});

const mockOpenURL = jest.fn(async (_url: string) => undefined);

const mockDevice = jest.fn();
const mockFind = jest.fn();
jest.mock('@/features/restaurants/location', () => ({
  ...jest.requireActual('@/features/restaurants/location'),
  getDeviceLocation: (...a: unknown[]) => mockDevice(...a),
  findAddress: (...a: unknown[]) => mockFind(...a),
}));
const { LocationError } = jest.requireActual('@/features/restaurants/location');

const mockGet = jest.fn();
const mockSaved = jest.fn();
const mockSave = jest.fn();
const mockUnsave = jest.fn();
jest.mock('@/services/restaurants', () => ({
  ...jest.requireActual('@/services/restaurants'),
  getRestaurants: (...a: unknown[]) => mockGet(...a),
  getSavedRestaurants: (...a: unknown[]) => mockSaved(...a),
  saveRestaurant: (...a: unknown[]) => mockSave(...a),
  unsaveRestaurant: (...a: unknown[]) => mockUnsave(...a),
}));

import HomeScreen from '@/app/(tabs)/home';
import RestaurantsScreen from '@/app/(tabs)/restaurants';
import SavedScreen from '@/app/saved';

jest.mock('@/hooks/useRecipes', () => ({
  ...jest.requireActual('@/hooks/useRecipes'),
  useHomeRecipe: () => ({ isPending: false, isError: false, data: null }),
  useSavedRecipes: () => ({ isPending: false, isError: false, data: [] }),
}));

const profile: Profile = {
  id: 'u1',
  email: 'ana@exemplo.com',
  displayName: 'Ana',
  allergies: ['gluten', 'milk'],
  customAllergies: ['Mostarda'],
  preferences: [],
  onboardingCompleted: true,
  onboardingStep: 3,
  isPremium: true,
  subscription: null,
};

const origin = { lat: -23.6, lng: -46.75 };
const at = (km: number) => ({ lat: origin.lat + km / 111.195, lng: origin.lng });
const make = (id: string, name: string, km: number, extra: Partial<Restaurant>): Restaurant => ({
  id,
  name,
  address: `Rua ${name}, 10`,
  ...at(km),
  cuisine: 'other',
  allergenFriendly: [],
  rating: 4.8,
  image: null,
  ...extra,
});
const NATURAL = make('r1', 'Cantinho Natural', 1.2, {
  cuisine: 'vegetarian',
  allergenFriendly: ['gluten', 'milk', 'egg'],
});
const FAR = make('r2', 'Sabor Livre', 3, {
  cuisine: 'healthy',
  allergenFriendly: ['gluten', 'milk'],
});
const ONLY_GLUTEN = make('r3', 'Lanches da Praça', 0.5, {
  cuisine: 'snacks',
  allergenFriendly: ['gluten'],
});
const DATA = [FAR, ONLY_GLUTEN, NATURAL];
const HERE = {
  ...origin,
  label: 'Av. Taboão, 305',
  detail: 'Avenida Taboão, 305 — Taboão da Serra',
  source: 'device' as const,
};

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const cardIds = () =>
  screen.queryAllByTestId(/^restaurant-r\d$/).map((e) => e.props.testID as string);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Linking, 'openURL').mockImplementation(mockOpenURL);
  useProfileStore.getState().setProfile(profile);
  useLocationStore.getState().setLocation(null);
  mockGet.mockResolvedValue(DATA);
  mockSaved.mockResolvedValue([]);
  mockSave.mockResolvedValue(undefined);
  mockUnsave.mockResolvedValue(undefined);
  mockDevice.mockResolvedValue(HERE);
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('Restaurantes', () => {
  it('uses the device location: only restaurants covering Glúten + Leite, by distance', async () => {
    await renderWithClient(<RestaurantsScreen />);
    expect(await screen.findByTestId('restaurant-r1')).toBeTruthy();
    expect(screen.getByText('Av. Taboão, 305')).toBeTruthy();
    expect(cardIds()).toEqual(['restaurant-r1', 'restaurant-r2']);
    expect(screen.getByText('Vegetariano • 1,2 km')).toBeTruthy();
    expect(screen.getAllByText('Opções sem glúten e sem leite')).toHaveLength(2);
    expect(screen.queryByTestId('restaurants-approximate')).toBeNull();
  });

  it('no restaurant covers the profile: shows the closest matches with the notice', async () => {
    useProfileStore.getState().setProfile({ ...profile, allergies: ['gluten', 'milk', 'peanut'] });
    await renderWithClient(<RestaurantsScreen />);
    expect(await screen.findByTestId('restaurants-approximate')).toBeTruthy();
    expect(cardIds()).toEqual(['restaurant-r1', 'restaurant-r2', 'restaurant-r3']);
  });

  it('permission denied: the sheet explains and a typed address works', async () => {
    mockDevice.mockRejectedValue(new LocationError('denied'));
    mockFind.mockResolvedValue({
      ...at(2.9),
      label: 'Rua B, 1',
      detail: 'Rua B, 1 — Taboão da Serra',
      source: 'address',
    });
    await renderWithClient(<RestaurantsScreen />);
    expect(
      await screen.findByText(
        'Sem acesso à localização. Digite um endereço para ver restaurantes por perto.',
        {},
        { timeout: 3000 },
      ),
    ).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('location-input'), 'Rua B, 1');
    await fireEvent(screen.getByTestId('location-input'), 'submitEditing');
    await fireEvent.press(await screen.findByTestId('location-result'));
    expect(await screen.findByText('Rua B, 1')).toBeTruthy();
    await waitFor(() => expect(cardIds()).toEqual(['restaurant-r2', 'restaurant-r1']));
  });

  it('address not found shows the message', async () => {
    mockDevice.mockRejectedValue(new LocationError('unavailable'));
    mockFind.mockResolvedValue(null);
    await renderWithClient(<RestaurantsScreen />);
    expect(
      await screen.findByText('Não foi possível obter sua localização. Digite um endereço.'),
    ).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('location-input'), 'Rua Inexistente, 999');
    await fireEvent(screen.getByTestId('location-input'), 'submitEditing');
    expect(
      await screen.findByText('Endereço não encontrado. Confira o nome da rua e o número.'),
    ).toBeTruthy();
  });

  it('search and category filter and combine', async () => {
    useProfileStore.getState().setProfile({ ...profile, allergies: [] });
    await renderWithClient(<RestaurantsScreen />);
    await screen.findByTestId('restaurant-r3');
    await fireEvent.press(screen.getByTestId('category-healthy'));
    expect(cardIds()).toEqual(['restaurant-r2']);
    await fireEvent.press(screen.getByTestId('category-all'));
    await fireEvent.changeText(screen.getByTestId('restaurants-search'), 'CANTINHO');
    await waitFor(() => expect(cardIds()).toEqual(['restaurant-r1']));
    await fireEvent.press(screen.getByTestId('category-snacks'));
    expect(screen.getByText('Nenhum restaurante encontrado com essa busca.')).toBeTruthy();
  });

  it('tapping a marker highlights its card', async () => {
    await renderWithClient(<RestaurantsScreen />);
    await screen.findByTestId('restaurant-r2');
    await fireEvent.press(screen.getByTestId('marker-r2'));
    const style = StyleSheet.flatten(screen.getByTestId('restaurant-r2').props.style);
    expect(style.borderWidth).toBe(2);
  });

  it('detail: notice, custom allergy and the Google Maps route', async () => {
    await renderWithClient(<RestaurantsScreen />);
    await fireEvent.press(await screen.findByTestId('restaurant-r1'));
    expect(
      screen.getByText(
        'Informações sobre alergênicos devem ser confirmadas diretamente com o restaurante antes de consumir.',
        { includeHiddenElements: true },
      ),
    ).toBeTruthy();
    expect(
      screen.getByText('Confirme com o restaurante: Mostarda', { includeHiddenElements: true }),
    ).toBeTruthy();
    await fireEvent.press(screen.getByTestId('restaurant-route', { includeHiddenElements: true }));
    expect(mockOpenURL).toHaveBeenCalledWith(
      `https://www.google.com/maps/dir/?api=1&destination=${NATURAL.lat},${NATURAL.lng}&travelmode=driving`,
    );
  });

  it('save sends only the user and the restaurant (never a location)', async () => {
    mockSave.mockImplementation(async () => {
      mockSaved.mockResolvedValue([{ restaurant: NATURAL, savedAt: '2026-10-01T10:00:00Z' }]);
    });
    await renderWithClient(<RestaurantsScreen />);
    await fireEvent.press(await screen.findByTestId('save-restaurant-r1'));
    expect(mockSave).toHaveBeenCalledWith('u1', 'r1');
    expect(await screen.findByLabelText('Remover dos salvos')).toBeTruthy();
  });

  it('loading error offers "Tentar novamente"', async () => {
    mockGet.mockRejectedValueOnce(new Error('boom'));
    await renderWithClient(<RestaurantsScreen />);
    expect(await screen.findByTestId('state-error')).toBeTruthy();
  });

  it('no restaurant inside 15 km shows the empty message', async () => {
    mockDevice.mockResolvedValue({ ...HERE, lat: 10, lng: 10 });
    await renderWithClient(<RestaurantsScreen />);
    expect(
      await screen.findByText('Ainda não temos restaurantes cadastrados perto deste endereço.'),
    ).toBeTruthy();
  });
});

describe('Salvos e Home', () => {
  it('saved restaurants are listed and removal offers "Desfazer"', async () => {
    mockSaved.mockResolvedValue([{ restaurant: NATURAL, savedAt: '2026-10-01T10:00:00Z' }]);
    useLocationStore.getState().setLocation(HERE);
    await renderWithClient(<SavedScreen />);
    await fireEvent.press(screen.getByTestId('saved-tab-restaurants'));
    expect(await screen.findByText('Cantinho Natural')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('save-restaurant-r1'));
    expect(mockUnsave).toHaveBeenCalledWith('u1', 'r1');
    expect(await screen.findByText('Restaurante removido')).toBeTruthy();
  });

  it('empty saved list message', async () => {
    await renderWithClient(<SavedScreen />);
    await fireEvent.press(screen.getByTestId('saved-tab-restaurants'));
    expect(await screen.findByText('Todos os restaurantes salvos aparecerão aqui.')).toBeTruthy();
  });

  it('Home hides the block without a location and shows the best one with it', async () => {
    const view = await renderWithClient(<HomeScreen />);
    expect(screen.queryByTestId('home-restaurants')).toBeNull();
    useLocationStore.getState().setLocation(HERE);
    view.rerender(
      <QueryClientProvider client={new QueryClient()}>
        <HomeScreen />
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId('home-restaurants')).toBeTruthy();
    expect(screen.getByText('Cantinho Natural')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('restaurant-r1'));
    expect(mockRouter.navigate).toHaveBeenCalledWith('/restaurants');
  });
});
