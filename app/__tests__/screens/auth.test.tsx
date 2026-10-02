import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { clearResetCooldown } from '@/features/auth/resetCooldown';

let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    dismissTo: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  useLocalSearchParams: () => mockParams,
  useFocusEffect: jest.fn(),
}));
const mockRouter = jest.requireMock('expo-router').router as Record<string, jest.Mock>;

const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockReset = jest.fn();
jest.mock('@/services/auth', () => ({
  login: (...args: unknown[]) => mockLogin(...args),
  register: (...args: unknown[]) => mockRegister(...args),
  requestPasswordReset: (...args: unknown[]) => mockReset(...args),
}));

import ForgotPasswordScreen from '@/app/(auth)/forgot-password';
import LoginScreen from '@/app/(auth)/login';
import RegisterScreen from '@/app/(auth)/register';
import RequestSentScreen from '@/app/(auth)/request-sent';

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  clearResetCooldown();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('Login', () => {
  it('keeps "Entrar" disabled until a valid e-mail and a password are typed', async () => {
    await render(<LoginScreen />);
    const submit = screen.getByTestId('login-submit');
    expect(submit).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('login-email'), 'ana@exemplo');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'x');
    expect(submit).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('login-email'), 'ana@exemplo.com');
    expect(screen.getByTestId('login-submit')).toBeEnabled();
  });

  it('shows the field error when leaving an invalid e-mail', async () => {
    await render(<LoginScreen />);
    await fireEvent.changeText(screen.getByTestId('login-email'), 'ana');
    await fireEvent(screen.getByTestId('login-email'), 'blur');
    expect(screen.getByText('Informe um e-mail válido.')).toBeTruthy();
  });

  it('wrong credentials show the message and keep the e-mail', async () => {
    mockLogin.mockRejectedValue(new AuthApiError('Invalid', 400, 'invalid_credentials'));
    await render(<LoginScreen />);
    await fireEvent.changeText(screen.getByTestId('login-email'), 'ana@exemplo.com');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'errada');
    await fireEvent.press(screen.getByTestId('login-submit'));
    expect(mockLogin).toHaveBeenCalledWith('ana@exemplo.com', 'errada');
    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeTruthy();
    expect(screen.getByTestId('login-email').props.value).toBe('ana@exemplo.com');
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('prefills the e-mail received from the sign-up shortcut', async () => {
    mockParams = { email: 'ana@exemplo.com' };
    await render(<LoginScreen />);
    expect(screen.getByTestId('login-email').props.value).toBe('ana@exemplo.com');
  });
});

async function fillValidRegister() {
  await fireEvent.changeText(screen.getByTestId('register-email'), 'ana@exemplo.com');
  await fireEvent.changeText(screen.getByTestId('register-password'), 'senha1234');
  await fireEvent.changeText(screen.getByTestId('register-confirmation'), 'senha1234');
}

describe('Cadastro', () => {
  it('cannot create the account without both checkboxes (none pre-checked)', async () => {
    await render(<RegisterScreen />);
    expect(screen.getByTestId('register-terms')).not.toBeChecked();
    expect(screen.getByTestId('register-privacy')).not.toBeChecked();
    await fillValidRegister();
    expect(screen.getByTestId('register-submit')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('register-terms'));
    expect(screen.getByTestId('register-submit')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('register-privacy'));
    expect(screen.getByTestId('register-submit')).toBeEnabled();
  });

  it('opening and closing the pop-ups keeps every typed value and checkbox', async () => {
    await render(<RegisterScreen />);
    await fillValidRegister();
    await fireEvent.press(screen.getByTestId('register-terms'));
    await fireEvent.press(screen.getByTestId('register-privacy-link'));
    expect(screen.getAllByText('Política de Privacidade')).toHaveLength(2);
    await fireEvent.press(screen.getByTestId('legal-modal-close'));
    await fireEvent.press(screen.getByTestId('register-terms-link'));
    expect(screen.getByText('Termos de Uso')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('legal-modal-close'));
    expect(screen.getByTestId('register-email').props.value).toBe('ana@exemplo.com');
    expect(screen.getByTestId('register-password').props.value).toBe('senha1234');
    expect(screen.getByTestId('register-confirmation').props.value).toBe('senha1234');
    expect(screen.getByTestId('register-terms')).toBeChecked();
    expect(screen.getByTestId('register-privacy')).not.toBeChecked();
  });

  it('validates the confirmation when leaving the field', async () => {
    await render(<RegisterScreen />);
    await fireEvent.changeText(screen.getByTestId('register-password'), 'senha1234');
    await fireEvent.changeText(screen.getByTestId('register-confirmation'), 'senha123');
    await fireEvent(screen.getByTestId('register-confirmation'), 'blur');
    expect(screen.getByText('As senhas não são iguais.')).toBeTruthy();
  });

  it('shows the password requirements', async () => {
    await render(<RegisterScreen />);
    await fireEvent.changeText(screen.getByTestId('register-password'), 'abc1');
    expect(screen.getByLabelText('8 ou mais caracteres: pendente')).toBeTruthy();
    expect(screen.getByLabelText('Letra e número: atendido')).toBeTruthy();
  });

  it('creates the account with the typed data', async () => {
    mockRegister.mockResolvedValue({ profileSaved: true });
    await render(<RegisterScreen />);
    await fillValidRegister();
    await fireEvent.press(screen.getByTestId('register-terms'));
    await fireEvent.press(screen.getByTestId('register-privacy'));
    await fireEvent.press(screen.getByTestId('register-submit'));
    expect(mockRegister).toHaveBeenCalledWith('ana@exemplo.com', 'senha1234');
  });

  it('duplicated e-mail offers the login shortcut with the e-mail filled in', async () => {
    mockRegister.mockRejectedValue(new AuthApiError('exists', 422, 'user_already_exists'));
    await render(<RegisterScreen />);
    await fillValidRegister();
    await fireEvent.press(screen.getByTestId('register-terms'));
    await fireEvent.press(screen.getByTestId('register-privacy'));
    await fireEvent.press(screen.getByTestId('register-submit'));
    expect(await screen.findByText('Já existe uma conta com este e-mail.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Fazer login?'));
    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/login',
      params: { email: 'ana@exemplo.com' },
    });
  });
});

describe('Recuperar senha', () => {
  it('always moves to "Solicitação enviada" after a successful request', async () => {
    mockReset.mockResolvedValue(undefined);
    await render(<ForgotPasswordScreen />);
    expect(screen.getByText('Enviar instruções')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('forgot-email'), 'qualquer@exemplo.com');
    await fireEvent.press(screen.getByTestId('forgot-submit'));
    expect(mockReset).toHaveBeenCalledWith('qualquer@exemplo.com');
    expect(mockRouter.push).toHaveBeenCalledWith('/request-sent');
  });

  it('without internet shows the network error and does not navigate', async () => {
    mockReset.mockRejectedValue(new AuthRetryableFetchError('Failed to fetch', 0));
    await render(<ForgotPasswordScreen />);
    await fireEvent.changeText(screen.getByTestId('forgot-email'), 'ana@exemplo.com');
    await fireEvent.press(screen.getByTestId('forgot-submit'));
    expect(
      await screen.findByText(
        'Não foi possível conectar. Verifique sua internet e tente novamente.',
      ),
    ).toBeTruthy();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('keeps the button disabled during the 60 s cooldown', async () => {
    mockReset.mockResolvedValue(undefined);
    await render(<ForgotPasswordScreen />);
    await fireEvent.changeText(screen.getByTestId('forgot-email'), 'ana@exemplo.com');
    await fireEvent.press(screen.getByTestId('forgot-submit'));
    expect(screen.getByTestId('forgot-submit')).toBeDisabled();
    expect(screen.getByText(/Aguarde \d+ s/)).toBeTruthy();
  });
});

describe('Solicitação enviada', () => {
  it('shows the neutral message and returns to Login', async () => {
    await render(<RequestSentScreen />);
    expect(screen.getByText(/Caso o email informado esteja cadastrado/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull();
    await fireEvent.press(screen.getByTestId('request-sent-back'));
    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/login');
  });
});
