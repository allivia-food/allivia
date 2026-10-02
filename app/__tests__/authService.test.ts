import { PRIVACY_VERSION, TERMS_VERSION } from '@/constants/legal';
import {
  clearResetCooldown,
  markResetSent,
  resetCooldownLeft,
} from '@/features/auth/resetCooldown';

const mockSignUp = jest.fn();
const mockSignIn = jest.fn();
const mockReset = jest.fn();
const mockUpsert = jest.fn();
const mockFrom = jest.fn(() => ({ upsert: mockUpsert }));

jest.mock('@/services/supabase', () => ({
  getSupabase: () => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignIn,
      resetPasswordForEmail: mockReset,
    },
    from: mockFrom,
  }),
  isSupabaseConfigured: true,
}));

import { ensureProfile, login, register, requestPasswordReset } from '@/services/auth';

const user = (metadata: Record<string, unknown>) => ({
  id: 'user-1',
  email: 'Ana@Exemplo.com',
  user_metadata: metadata,
});

beforeEach(() => jest.clearAllMocks());

describe('register', () => {
  it('creates the Auth user with the consent versions, then the profiles row', async () => {
    mockSignUp.mockImplementation(async ({ options }) => ({
      data: { user: user(options.data), session: { access_token: 'x' } },
      error: null,
    }));
    mockUpsert.mockResolvedValue({ error: null });

    const result = await register('  Ana@Exemplo.com ', 'senha1234');

    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ana@exemplo.com',
        password: 'senha1234',
        options: {
          data: expect.objectContaining({
            terms_version: TERMS_VERSION,
            privacy_version: PRIVACY_VERSION,
          }),
        },
      }),
    );
    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-1',
        email: 'ana@exemplo.com',
        terms_version: TERMS_VERSION,
        privacy_version: PRIVACY_VERSION,
      }),
      { onConflict: 'id', ignoreDuplicates: true },
    );
    expect(result).toEqual({ profileSaved: true });
  });

  it('keeps the account when the profiles insert fails (retried by ensureProfile later)', async () => {
    mockSignUp.mockImplementation(async ({ options }) => ({
      data: { user: user(options.data), session: { access_token: 'x' } },
      error: null,
    }));
    mockUpsert.mockResolvedValue({ error: new Error('db down') });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(register('ana@exemplo.com', 'senha1234')).resolves.toEqual({
      profileSaved: false,
    });
  });

  it('throws the Auth error (e.g. duplicated e-mail) without touching profiles', async () => {
    const error = { code: 'user_already_exists' };
    mockSignUp.mockResolvedValue({ data: { user: null, session: null }, error });
    await expect(register('ana@exemplo.com', 'senha1234')).rejects.toBe(error);
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});

describe('ensureProfile', () => {
  it('never assumes consent: users without recorded consent get no profile', async () => {
    await expect(ensureProfile(user({}) as never)).resolves.toBe(false);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('creates the row from the consent recorded at sign-up', async () => {
    mockUpsert.mockResolvedValue({ error: null });
    const consent = { terms_version: '1.0', privacy_version: '1.0', consent_accepted_at: 'T' };
    await expect(ensureProfile(user(consent) as never)).resolves.toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ consent_accepted_at: 'T', email: 'ana@exemplo.com' }),
      { onConflict: 'id', ignoreDuplicates: true },
    );
  });
});

describe('login and password reset', () => {
  it('normalizes the e-mail and returns the session', async () => {
    mockSignIn.mockResolvedValue({ data: { session: { access_token: 'x' } }, error: null });
    await login(' Ana@Exemplo.com', 'pw');
    expect(mockSignIn).toHaveBeenCalledWith({ email: 'ana@exemplo.com', password: 'pw' });
  });

  it('propagates login errors', async () => {
    const error = { code: 'invalid_credentials' };
    mockSignIn.mockResolvedValue({ data: { session: null }, error });
    await expect(login('ana@exemplo.com', 'x')).rejects.toBe(error);
  });

  it('requests the reset e-mail with the normalized address', async () => {
    mockReset.mockResolvedValue({ data: {}, error: null });
    await requestPasswordReset(' Ana@Exemplo.com ');
    expect(mockReset).toHaveBeenCalledWith('ana@exemplo.com');
  });
});

describe('reset cooldown', () => {
  afterEach(() => clearResetCooldown());

  it('blocks a new request for 60 s after a successful one', () => {
    expect(resetCooldownLeft(1_000)).toBe(0);
    markResetSent(1_000);
    expect(resetCooldownLeft(1_000)).toBe(60);
    expect(resetCooldownLeft(30_500)).toBe(31);
    expect(resetCooldownLeft(61_000)).toBe(0);
  });
});
