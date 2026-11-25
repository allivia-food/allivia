import {
  clearPasswordProof,
  completePasswordRecovery,
  confirmPasswordChange,
  confirmSignupCode,
  hasRecoveryProof,
  requestPasswordChangeCode,
  resendSignupCode,
  verifyRecoveryCode,
} from '@/services/auth';
import { emailOtpErrorMessage } from '@/features/auth/emailOtp';

const mockMainVerify = jest.fn();
const mockMainUpdate = jest.fn();
const mockResend = jest.fn();
const mockGetUser = jest.fn();
const mockProofVerify = jest.fn();
const mockProofUpdate = jest.fn();
const mockProofSend = jest.fn();
const mockProofSignOut = jest.fn();
const mockCreateClient = jest.fn();
jest.mock('@/services/supabase', () => ({
  getSupabase: () => ({
    auth: {
      verifyOtp: mockMainVerify,
      updateUser: mockMainUpdate,
      resend: mockResend,
      getUser: mockGetUser,
    },
  }),
  createPasswordAuthClient: () => mockCreateClient(),
}));
const user = { id: 'u1', email: 'ana@exemplo.com', email_confirmed_at: '2026-11-24' };
beforeEach(() => {
  clearPasswordProof();
  jest.clearAllMocks();
  mockProofSignOut.mockResolvedValue({ error: null });
  mockCreateClient.mockReturnValue({
    auth: {
      verifyOtp: mockProofVerify,
      updateUser: mockProofUpdate,
      signInWithOtp: mockProofSend,
      signOut: mockProofSignOut,
    },
  });
  mockGetUser.mockResolvedValue({ data: { user }, error: null });
  mockProofVerify.mockResolvedValue({
    data: { user, session: { access_token: 'proof' } },
    error: null,
  });
  mockProofUpdate.mockResolvedValue({ error: null });
  mockMainUpdate.mockResolvedValue({ error: null });
  mockProofSend.mockResolvedValue({ error: null });
});
afterEach(() => {
  clearPasswordProof();
  jest.restoreAllMocks();
});

it('confirms registration on the normal Auth client and supports resending', async () => {
  mockMainVerify.mockResolvedValue({ data: { session: { access_token: 'main' } }, error: null });
  mockResend.mockResolvedValue({ error: null });
  await confirmSignupCode(' Ana@Exemplo.com ', '012345');
  expect(mockMainVerify).toHaveBeenCalledWith({
    email: 'ana@exemplo.com',
    token: '012345',
    type: 'email',
  });
  await resendSignupCode(' Ana@Exemplo.com ');
  expect(mockResend).toHaveBeenCalledWith({ type: 'signup', email: 'ana@exemplo.com' });
});

it('never authenticates the normal client during recovery and updates only after verification', async () => {
  expect(hasRecoveryProof()).toBe(false);
  await expect(completePasswordRecovery('Nova12345')).rejects.toMatchObject({
    code: 'proof_expired',
  });
  await verifyRecoveryCode(' Ana@Exemplo.com ', '012345');
  expect(mockProofVerify).toHaveBeenCalledWith({
    email: 'ana@exemplo.com',
    token: '012345',
    type: 'recovery',
  });
  expect(mockMainVerify).not.toHaveBeenCalled();
  expect(hasRecoveryProof()).toBe(true);
  await completePasswordRecovery('Nova12345');
  expect(mockProofUpdate).toHaveBeenCalledWith({ password: 'Nova12345' });
  expect(mockMainUpdate).not.toHaveBeenCalled();
  expect(hasRecoveryProof()).toBe(false);
  expect(mockProofSignOut).toHaveBeenCalledWith({ scope: 'local' });
});

it('rejects an incorrect recovery code and never saves a password', async () => {
  mockProofVerify.mockResolvedValue({
    data: { session: null, user: null },
    error: { code: 'otp_expired' },
  });
  await expect(verifyRecoveryCode('ana@exemplo.com', '123456')).rejects.toMatchObject({
    code: 'otp_expired',
  });
  await expect(completePasswordRecovery('Nova12345')).rejects.toMatchObject({
    code: 'proof_expired',
  });
  expect(mockProofUpdate).not.toHaveBeenCalled();
});

it('expires a verified recovery after ten minutes and discards it on cancellation', async () => {
  const now = jest.spyOn(Date, 'now').mockReturnValue(100000);
  await verifyRecoveryCode('ana@exemplo.com', '012345');
  now.mockReturnValue(700001);
  await expect(completePasswordRecovery('Nova12345')).rejects.toMatchObject({
    code: 'proof_expired',
  });
  expect(mockProofUpdate).not.toHaveBeenCalled();
  expect(hasRecoveryProof()).toBe(false);
});

it('sends profile verification only to the authenticated address without creating users', async () => {
  expect(await requestPasswordChangeCode()).toBe('ana@exemplo.com');
  expect(mockProofSend).toHaveBeenCalledWith({
    email: 'ana@exemplo.com',
    options: { shouldCreateUser: false },
  });
  expect(mockMainUpdate).not.toHaveBeenCalled();
  await confirmPasswordChange('012345', 'Nova12345', 'Atual1234');
  expect(mockMainUpdate).toHaveBeenCalledWith({
    password: 'Nova12345',
    current_password: 'Atual1234',
  });
  expect(mockProofUpdate).not.toHaveBeenCalled();
});

it('identifies account lookup failures before requesting an email', async () => {
  mockGetUser.mockRejectedValueOnce(new TypeError('Network request failed'));
  await expect(requestPasswordChangeCode()).rejects.toMatchObject({
    code: 'account_check_connection',
  });
  expect(mockProofSend).not.toHaveBeenCalled();
});

it('identifies email request failures without changing the password', async () => {
  mockProofSend.mockRejectedValueOnce(new TypeError('Network request failed'));
  await expect(requestPasswordChangeCode()).rejects.toMatchObject({
    code: 'email_send_connection',
  });
  expect(mockMainUpdate).not.toHaveBeenCalled();
});

it('allows a slower email request and explains a timeout without blaming the internet', async () => {
  jest.useFakeTimers();
  try {
    mockProofSend.mockImplementationOnce(() => new Promise(() => {}));
    const result = requestPasswordChangeCode();
    const rejection = expect(result).rejects.toMatchObject({ code: 'email_send_timeout' });
    await jest.advanceTimersByTimeAsync(15001);
    expect(mockProofSend).toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(30000);
    await rejection;
    expect(emailOtpErrorMessage({ code: 'email_send_timeout' })).toContain('Confira seu e-mail');
    expect(mockMainUpdate).not.toHaveBeenCalled();
  } finally {
    jest.useRealTimers();
  }
});

it('rejects incorrect codes on the profile even for recently authenticated users', async () => {
  await requestPasswordChangeCode();
  mockProofVerify.mockResolvedValue({
    data: { user: null, session: null },
    error: { code: 'otp_expired' },
  });
  await expect(confirmPasswordChange('111111', 'Nova12345', 'Atual1234')).rejects.toMatchObject({
    code: 'otp_expired',
  });
  expect(mockMainUpdate).not.toHaveBeenCalled();
});

it('refuses to change another account if the signed-in user changes', async () => {
  await requestPasswordChangeCode();
  mockGetUser.mockResolvedValue({ data: { user: { ...user, id: 'u2' } }, error: null });
  await expect(confirmPasswordChange('012345', 'Nova12345', 'Atual1234')).rejects.toMatchObject({
    code: 'account_changed',
  });
  expect(mockProofVerify).not.toHaveBeenCalled();
  expect(mockMainUpdate).not.toHaveBeenCalled();
});

it('refuses a verification session belonging to a different identity', async () => {
  await requestPasswordChangeCode();
  mockProofVerify.mockResolvedValue({
    data: { user: { ...user, id: 'u2' }, session: {} },
    error: null,
  });
  await expect(confirmPasswordChange('012345', 'Nova12345', 'Atual1234')).rejects.toMatchObject({
    code: 'account_changed',
  });
  expect(mockMainUpdate).not.toHaveBeenCalled();
});
