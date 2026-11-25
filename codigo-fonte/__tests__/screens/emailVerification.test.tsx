import { fireEvent, render, screen } from '@testing-library/react-native';
import VerifyEmailScreen from '@/app/(auth)/verify-email';
import ResetPasswordScreen from '@/app/(auth)/reset-password';
import { clearOtpCooldowns } from '@/features/auth/emailOtp';

let mockParams = { email: 'ana@exemplo.com', kind: 'recovery' };
const mockRecoveryCode = jest.fn();
const mockSignupCode = jest.fn();
const mockComplete = jest.fn();
const mockHasProof = jest.fn();
const mockResend = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), canGoBack: () => true, back: jest.fn() },
  useLocalSearchParams: () => mockParams,
  usePreventRemove: () => jest.fn(),
}));
const mockRouter = jest.requireMock('expo-router').router;
jest.mock('@/services/auth', () => ({
  verifyRecoveryCode: (...args: unknown[]) => mockRecoveryCode(...args),
  confirmSignupCode: (...args: unknown[]) => mockSignupCode(...args),
  requestPasswordReset: (...args: unknown[]) => mockResend(...args),
  resendSignupCode: (...args: unknown[]) => mockResend(...args),
  completePasswordRecovery: (...args: unknown[]) => mockComplete(...args),
  hasRecoveryProof: () => mockHasProof(),
  clearPasswordProof: jest.fn(),
}));
beforeEach(() => {
  jest.clearAllMocks();
  clearOtpCooldowns();
  mockParams = { email: 'ana@exemplo.com', kind: 'recovery' };
  mockRecoveryCode.mockResolvedValue(undefined);
  mockSignupCode.mockResolvedValue(undefined);
  mockComplete.mockResolvedValue(undefined);
  mockResend.mockResolvedValue(undefined);
  mockHasProof.mockReturnValue(true);
});

it('accepts only six digits, preserves leading zeroes and moves recovery to the new-password screen', async () => {
  await render(<VerifyEmailScreen />);
  expect(screen.getByTestId('otp-confirm')).toBeDisabled();
  expect(screen.getByTestId('otp-code').props.maxLength).toBe(6);
  await fireEvent.changeText(screen.getByTestId('otp-code'), '01a 234');
  expect(screen.getByTestId('otp-confirm')).toBeDisabled();
  await fireEvent.changeText(screen.getByTestId('otp-code'), '012345');
  await fireEvent.press(screen.getByTestId('otp-confirm'));
  expect(mockRecoveryCode).toHaveBeenCalledWith('ana@exemplo.com', '012345');
  expect(mockRouter.replace).toHaveBeenCalledWith('/reset-password');
});

it('shows an invalid/expired code error without navigating', async () => {
  mockRecoveryCode.mockRejectedValue({ code: 'otp_expired' });
  await render(<VerifyEmailScreen />);
  await fireEvent.changeText(screen.getByTestId('otp-code'), '111111');
  await fireEvent.press(screen.getByTestId('otp-confirm'));
  expect(await screen.findByText(/Código inválido ou expirado/)).toBeTruthy();
  expect(mockRouter.replace).not.toHaveBeenCalled();
});

it('resends successfully once and disables repeated sends for sixty seconds', async () => {
  await render(<VerifyEmailScreen />);
  await fireEvent.press(screen.getByTestId('otp-resend'));
  expect(mockResend).toHaveBeenCalledWith('ana@exemplo.com');
  expect(screen.getByTestId('otp-resend')).toBeDisabled();
  expect(screen.getByText('Reenviar código em 60 s')).toBeTruthy();
});

it('verifies registration on its own flow without opening password recovery', async () => {
  mockParams.kind = 'signup';
  await render(<VerifyEmailScreen />);
  await fireEvent.changeText(screen.getByTestId('otp-code'), '012345');
  await fireEvent.press(screen.getByTestId('otp-confirm'));
  expect(mockSignupCode).toHaveBeenCalledWith('ana@exemplo.com', '012345');
  expect(mockRecoveryCode).not.toHaveBeenCalled();
  expect(mockRouter.replace).not.toHaveBeenCalled();
});

it('requires verified recovery plus a matching strong new password', async () => {
  await render(<ResetPasswordScreen />);
  await fireEvent.changeText(screen.getByTestId('reset-password'), 'Nova12345');
  await fireEvent.changeText(screen.getByTestId('reset-confirmation'), 'Outra12345');
  expect(screen.getByTestId('reset-submit')).toBeDisabled();
  await fireEvent.changeText(screen.getByTestId('reset-confirmation'), 'Nova12345');
  await fireEvent.press(screen.getByTestId('reset-submit'));
  expect(mockComplete).toHaveBeenCalledWith('Nova12345');
  expect(await screen.findByText('Senha atualizada')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('reset-success-login'));
  expect(mockRouter.replace).toHaveBeenCalledWith('/login');
});

it('cannot define a new password by opening the reset route directly', async () => {
  mockHasProof.mockReturnValue(false);
  await render(<ResetPasswordScreen />);
  expect(screen.queryByTestId('reset-submit')).toBeNull();
  expect(mockComplete).not.toHaveBeenCalled();
  expect(screen.getByText(/Verifique seu e-mail antes/)).toBeTruthy();
});
