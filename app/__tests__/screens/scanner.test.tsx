import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import type { Product } from '@/features/scanner/analyzeProduct';
import type { Profile } from '@/services/profile';
import { useProfileStore } from '@/store/profile';

let mockParams: Record<string, string> = {};
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
    useLocalSearchParams: () => mockParams,
    useFocusEffect: (cb: () => void | (() => void)) => useEffect(cb, [cb]),
  };
});
const mockRouter = jest.requireMock('expo-router').router as Record<string, jest.Mock>;

let mockScan: ((r: { data: string; type: string }) => void) | undefined;
let mockPermission: { granted: boolean; canAskAgain: boolean } | null = {
  granted: true,
  canAskAgain: true,
};
jest.mock('expo-camera', () => {
  const { View } = jest.requireActual('react-native');
  return {
    CameraView: (props: { onBarcodeScanned?: (r: { data: string; type: string }) => void }) => {
      mockScan = props.onBarcodeScanned;
      return <View testID="camera" />;
    },
    useCameraPermissions: () => [mockPermission, jest.fn()],
  };
});
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const mockGetProduct = jest.fn();
const mockRecordScan = jest.fn();
jest.mock('@/services/products', () => ({
  ...jest.requireActual('@/services/products'),
  getProduct: (...a: unknown[]) => mockGetProduct(...a),
  recordScan: (...a: unknown[]) => mockRecordScan(...a),
}));

import ScannerScreen from '@/app/(tabs)/scanner';
import ScannerResultScreen from '@/app/scanner-result';

const profile: Profile = {
  id: 'u1',
  email: 'ana@exemplo.com',
  displayName: 'Ana',
  allergies: ['milk', 'gluten'],
  customAllergies: [],
  preferences: [],
  onboardingCompleted: true,
  onboardingStep: 3,
  isPremium: true,
};

const product = (over: Partial<Product> = {}): Product => ({
  barcode: '7891000100103',
  name: 'Biscoito',
  brand: 'Marca',
  category: null,
  imageUrl: null,
  ingredientsText: 'farinha de trigo, açúcar, leite em pó, sal',
  ingredients: ['farinha de trigo', 'açúcar', 'leite em pó', 'sal'],
  allergensDeclared: [],
  tracesDeclared: [],
  source: 'test',
  ...over,
});

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockPermission = { granted: true, canAskAgain: true };
  useProfileStore.getState().setProfile(profile);
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('Scanner — câmera', () => {
  it('ignores an invalid check digit and reads a valid code once (3 s window)', async () => {
    mockGetProduct.mockResolvedValue({ product: product(), fromCache: false });
    await renderWithClient(<ScannerScreen />);
    await fireEvent(screen.getByTestId('camera'), 'layout');
    mockScan?.({ data: '7891000100104', type: 'ean13' });
    expect(mockGetProduct).not.toHaveBeenCalled();
    await screen.findByTestId('camera');
    mockScan?.({ data: '7891000100103', type: 'ean13' });
    mockScan?.({ data: '7891000100103', type: 'ean13' });
    await screen.findByTestId('camera');
    expect(mockGetProduct).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/scanner-result',
      params: { barcode: '7891000100103' },
    });
    expect(mockRecordScan).toHaveBeenCalledTimes(1);
    expect(mockRecordScan).toHaveBeenCalledWith('u1', '7891000100103', 'Biscoito', 'contains', [
      'milk',
      'gluten',
    ]);
  });

  it('manual entry rejects an invalid code with the message', async () => {
    await renderWithClient(<ScannerScreen />);
    await fireEvent.press(screen.getByTestId('scanner-manual'));
    await fireEvent.changeText(screen.getByTestId('scanner-manual-input'), '7891000100104');
    await fireEvent.press(screen.getByTestId('scanner-manual-confirm'));
    expect(screen.getByText('Código inválido. Confira os números e tente de novo.')).toBeTruthy();
    expect(mockGetProduct).not.toHaveBeenCalled();
  });

  it('not found: message, the code and "not_found" in the history; nothing is invented', async () => {
    mockGetProduct.mockResolvedValue({ product: null, fromCache: false });
    await renderWithClient(<ScannerScreen />);
    await fireEvent.press(screen.getByTestId('scanner-manual'));
    await fireEvent.changeText(screen.getByTestId('scanner-manual-input'), '7891000100103');
    await fireEvent.press(screen.getByTestId('scanner-manual-confirm'));
    expect(await screen.findByText('Não encontramos este produto na nossa base.')).toBeTruthy();
    expect(screen.getByText('Código lido: 7891000100103')).toBeTruthy();
    expect(mockRecordScan).toHaveBeenCalledWith('u1', '7891000100103', null, 'not_found', []);
    await fireEvent.press(screen.getByTestId('scanner-again'));
    expect(screen.queryByTestId('scanner-notFound')).toBeNull();
  });

  it('network error offers "Tentar novamente"', async () => {
    mockGetProduct.mockRejectedValueOnce(new TypeError('Network request failed'));
    await renderWithClient(<ScannerScreen />);
    await fireEvent.press(screen.getByTestId('scanner-manual'));
    await fireEvent.changeText(screen.getByTestId('scanner-manual-input'), '7891000100103');
    await fireEvent.press(screen.getByTestId('scanner-manual-confirm'));
    expect(
      await screen.findByText(
        'Não foi possível conectar. Verifique sua internet e tente novamente.',
      ),
    ).toBeTruthy();
    mockGetProduct.mockResolvedValue({ product: product(), fromCache: false });
    await fireEvent.press(screen.getByTestId('scanner-retry'));
    await screen.findByTestId('camera');
    expect(mockRouter.push).toHaveBeenCalled();
  });

  it('asks for the camera permission with an explanation', async () => {
    mockPermission = { granted: false, canAskAgain: true };
    await renderWithClient(<ScannerScreen />);
    expect(
      screen.getByText('Precisamos da câmera para ler o código de barras dos produtos'),
    ).toBeTruthy();
    expect(screen.getByTestId('scanner-allow')).toBeTruthy();
  });

  it('permission denied for good offers the settings and manual entry', async () => {
    mockPermission = { granted: false, canAskAgain: false };
    await renderWithClient(<ScannerScreen />);
    expect(screen.getByText(/Sem acesso à câmera/)).toBeTruthy();
    expect(screen.getByTestId('scanner-settings')).toBeTruthy();
  });
});

describe('Resultado da análise', () => {
  async function renderResult(p: Product | null, over: Partial<Profile> = {}) {
    mockParams = { barcode: p?.barcode ?? '1' };
    useProfileStore.getState().setProfile({ ...profile, ...over });
    mockGetProduct.mockResolvedValue({ product: p, fromCache: true });
    await renderWithClient(<ScannerResultScreen />);
  }

  it('contains: allergens, other ingredients without them, info and the legal notice', async () => {
    await renderResult(product());
    expect(await screen.findByTestId('verdict-contains')).toBeTruthy();
    expect(screen.getByText('Atenção! Possíveis alergênicos para você:')).toBeTruthy();
    expect(screen.getByText('Leite')).toBeTruthy();
    expect(screen.getByText('Glúten')).toBeTruthy();
    expect(screen.getByText('açúcar')).toBeTruthy();
    expect(screen.queryByText('leite em pó')).toBeNull();
    expect(screen.getByText('Não informado')).toBeTruthy();
    expect(screen.getByTestId('result-disclaimer')).toBeTruthy();
  });

  it('product without ingredients is warning with "dados incompletos"', async () => {
    await renderResult(product({ ingredientsText: null, ingredients: [] }));
    expect(await screen.findByTestId('verdict-warning')).toBeTruthy();
    expect(screen.getByText('• dados incompletos do produto')).toBeTruthy();
    expect(screen.getByText('Ingredientes não informados para este produto.')).toBeTruthy();
    expect(screen.getByTestId('result-disclaimer')).toBeTruthy();
  });

  it('custom allergy is never safe', async () => {
    await renderResult(
      product({
        ingredientsText: 'açúcar, sal, amido, água',
        ingredients: ['açúcar', 'sal', 'amido', 'água'],
      }),
      {
        allergies: [],
        customAllergies: ['Mostarda'],
      },
    );
    expect(await screen.findByTestId('verdict-warning')).toBeTruthy();
    expect(screen.getByText('• Confira manualmente: Mostarda')).toBeTruthy();
  });

  it('safe only with complete data and no match, still with the legal notice', async () => {
    await renderResult(
      product({
        ingredientsText: 'açúcar, sal, amido, água',
        ingredients: ['açúcar', 'sal', 'amido', 'água'],
      }),
    );
    expect(await screen.findByTestId('verdict-safe')).toBeTruthy();
    expect(screen.getByTestId('result-disclaimer')).toBeTruthy();
  });

  it('shows 8 ingredients and "Ver todos"', async () => {
    const many = Array.from({ length: 11 }, (_, i) => `ingrediente ${i + 1}`);
    await renderResult(product({ ingredientsText: many.join(', '), ingredients: many }));
    expect(await screen.findByText('ingrediente 8')).toBeTruthy();
    expect(screen.queryByText('ingrediente 9')).toBeNull();
    await fireEvent.press(screen.getByText('Ver todos (3)'));
    expect(screen.getByText('ingrediente 11')).toBeTruthy();
  });

  it('"Escanear novamente" goes back to the camera; "Concluído" and "Voltar para Home" go home', async () => {
    await renderResult(product());
    await screen.findByTestId('verdict-contains');
    await fireEvent.press(screen.getByTestId('result-again'));
    expect(mockRouter.back).toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('result-done'));
    await fireEvent.press(screen.getByTestId('result-home'));
    expect(mockRouter.navigate).toHaveBeenCalledTimes(2);
    expect(mockRouter.navigate).toHaveBeenCalledWith('/home');
  });
});
