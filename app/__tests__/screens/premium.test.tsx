import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

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
      dismissTo: jest.fn(),
      canGoBack: jest.fn(() => true),
    },
    useLocalSearchParams: () => mockParams,
    useFocusEffect: (cb: () => void | (() => void)) => useEffect(cb, [cb]),
  };
});
const mockRouter = jest.requireMock('expo-router').router as Record<string, jest.Mock>;

jest.mock('expo-camera', () => {
  const { View } = jest.requireActual('react-native');
  return {
    CameraView: () => <View testID="camera" />,
    useCameraPermissions: () => [{ granted: true, canAskAgain: true }, jest.fn()],
  };
});
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: {} }));

const mockUpdate = jest.fn();
let mockFail = false;
jest.mock('@/services/supabase', () => ({
  isSupabaseConfigured: true,
  getSupabase: () => ({
    from: (table: string) => ({
      update: (values: Record<string, unknown>) => {
        mockUpdate(table, values);
        const result = {
          eq: () => result,
          select: () => result,
          single: async () =>
            mockFail
              ? { data: null, error: { message: 'boom', code: '500' } }
              : {
                  data: {
                    id: 'u1',
                    email: 'ana@exemplo.com',
                    display_name: 'Ana',
                    allergies: [],
                    custom_allergies: [],
                    preferences: [],
                    onboarding_completed: true,
                    onboarding_step: 3,
                    ...values,
                  },
                  error: null,
                },
        };
        return result;
      },
    }),
  }),
}));

import CheckoutScreen from '@/app/checkout';
import PremiumUnlockedScreen from '@/app/premium-unlocked';
import ScannerScreen from '@/app/(tabs)/scanner';

const base: Profile = {
  id: 'u1',
  email: 'ana@exemplo.com',
  displayName: 'Ana',
  allergies: [],
  customAllergies: [],
  preferences: [],
  onboardingCompleted: true,
  onboardingStep: 3,
  isPremium: false,
  subscription: null,
};

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

async function fillCard(number: string, expiry = '1228', cvv = '987') {
  await fireEvent.changeText(screen.getByTestId('card-number'), number);
  await fireEvent(screen.getByTestId('card-number'), 'blur');
  await fireEvent.changeText(screen.getByTestId('card-expiry'), expiry);
  await fireEvent(screen.getByTestId('card-expiry'), 'blur');
  await fireEvent.changeText(screen.getByTestId('card-cvv'), cvv);
  await fireEvent(screen.getByTestId('card-cvv'), 'blur');
}

async function confirmAndWait() {
  await fireEvent.press(screen.getByTestId('payment-confirm'));
  await act(async () => {
    await jest.advanceTimersByTimeAsync(2000);
  });
}

const isDisabled = (id: string) =>
  screen.getByTestId(id).props.accessibilityState?.disabled === true;

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockFail = false;
  useProfileStore.getState().setProfile(base);
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('Aba Scanner com o premium', () => {
  it('non-premium sees the plan with the demo notice; annual is preselected', async () => {
    await renderWithClient(<ScannerScreen />);
    expect(screen.getByTestId('premium-plan')).toBeTruthy();
    expect(screen.queryByTestId('camera')).toBeNull();
    expect(
      screen.getByText('Ambiente de demonstração — nenhuma cobrança será feita.'),
    ).toBeTruthy();
    expect(screen.getByTestId('plan-annual').props.accessibilityState).toMatchObject({
      checked: true,
    });
  });

  it('"Continuar" sends only the chosen plan to Payment', async () => {
    await renderWithClient(<ScannerScreen />);
    await fireEvent.press(screen.getByTestId('plan-monthly'));
    await fireEvent.press(screen.getByTestId('plan-continue'));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/checkout',
      params: { plan: 'monthly' },
    });
  });

  it('premium goes straight to the camera', async () => {
    useProfileStore.getState().setProfile({ ...base, isPremium: true });
    await renderWithClient(<ScannerScreen />);
    expect(screen.getByTestId('camera')).toBeTruthy();
    expect(screen.queryByTestId('premium-plan')).toBeNull();
  });
});

describe('Pagamento (simulado)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('summary follows the plan; demo notice and footer replace "dados seguros"', async () => {
    mockParams = { plan: 'monthly' };
    await renderWithClient(<CheckoutScreen />);
    expect(screen.getByText('Plano Mensal - Scanner Allivia')).toBeTruthy();
    expect(screen.getByText('R$9,90/mês')).toBeTruthy();
    expect(screen.getByText('Renova automaticamente todo mês.')).toBeTruthy();
    expect(screen.getByTestId('demo-notice')).toBeTruthy();
    expect(
      screen.getByText('Ambiente de demonstração. Não digite dados de cartão reais.'),
    ).toBeTruthy();
    expect(screen.queryByText('Seus dados estão seguros conosco.')).toBeNull();
  });

  it('confirm is only enabled with the three fields valid; errors show after leaving a field', async () => {
    await renderWithClient(<CheckoutScreen />);
    expect(screen.getByText('Plano Anual - Scanner Allivia')).toBeTruthy();
    expect(isDisabled('payment-confirm')).toBe(true);
    await fillCard('4111 1111 1111 1112', '0926', '12');
    expect(screen.getByText('Número de cartão inválido.')).toBeTruthy();
    expect(screen.getByText('Validade inválida.')).toBeTruthy();
    expect(screen.getByText('CVV inválido.')).toBeTruthy();
    expect(isDisabled('payment-confirm')).toBe(true);
    await fillCard('4111111111111111');
    expect(screen.getByTestId('card-number').props.value).toBe('4111 1111 1111 1111');
    expect(screen.getByTestId('card-expiry').props.value).toBe('12/28');
    expect(screen.getByTestId('card-cvv').props.secureTextEntry).toBe(true);
    expect(screen.getByTestId('card-cvv').props.autoComplete).toBe('off');
    expect(isDisabled('payment-confirm')).toBe(false);
  });

  it('the test card is declined: message, data kept, nothing written', async () => {
    await renderWithClient(<CheckoutScreen />);
    await fillCard('4000 0000 0000 0002');
    await confirmAndWait();
    expect(screen.getByText('Pagamento recusado (simulação). Tente outro cartão.')).toBeTruthy();
    expect(screen.getByTestId('card-number').props.value).toBe('4000 0000 0000 0002');
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('approved: one write with the simulated subscription and no card data', async () => {
    await renderWithClient(<CheckoutScreen />);
    await fillCard('4111 1111 1111 1111', '1228', '987');
    await confirmAndWait();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const [table, values] = mockUpdate.mock.calls[0];
    expect(table).toBe('profiles');
    expect(Object.keys(values).sort()).toEqual(['is_premium', 'subscription']);
    expect(values.is_premium).toBe(true);
    expect(values.subscription).toMatchObject({
      plan: 'annual',
      status: 'active',
      simulated: true,
      priceCents: 4990,
    });
    const sent = JSON.stringify(values);
    for (const secret of ['4111', '1111 1111', '12/28', '987']) expect(sent).not.toContain(secret);
    expect(useProfileStore.getState().profile?.isPremium).toBe(true);
    expect(mockRouter.replace).toHaveBeenCalledWith('/premium-unlocked');
    expect(JSON.stringify(mockRouter.replace.mock.calls)).not.toContain('4111');
  });

  it('Pix and boleto hide the card fields and approve', async () => {
    await renderWithClient(<CheckoutScreen />);
    await fireEvent.press(screen.getByTestId('method-pix'));
    expect(screen.queryByTestId('card-fields')).toBeNull();
    expect(screen.getByText('Ambiente de demonstração: a confirmação será simulada.')).toBeTruthy();
    expect(isDisabled('payment-confirm')).toBe(false);
    await fireEvent.press(screen.getByTestId('method-boleto'));
    await confirmAndWait();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/premium-unlocked');
  });

  it('a failed write keeps the user non-premium and shows the message', async () => {
    mockFail = true;
    await renderWithClient(<CheckoutScreen />);
    await fireEvent.press(screen.getByTestId('method-pix'));
    await confirmAndWait();
    expect(
      screen.getByText('Não foi possível concluir a assinatura. Tente novamente.'),
    ).toBeTruthy();
    expect(useProfileStore.getState().profile?.isPremium).toBe(false);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('back arrow returns to the plan', async () => {
    await renderWithClient(<CheckoutScreen />);
    await fireEvent.press(screen.getByLabelText('Voltar'));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});

describe('Scanner desbloqueado', () => {
  it('"Começar a usar" opens the camera; "Talvez depois" goes Home', async () => {
    await renderWithClient(<PremiumUnlockedScreen />);
    expect(screen.getByText('Scanner desbloqueado!')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('unlocked-start'));
    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/scanner');
    await fireEvent.press(screen.getByTestId('unlocked-later'));
    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/home');
  });
});
