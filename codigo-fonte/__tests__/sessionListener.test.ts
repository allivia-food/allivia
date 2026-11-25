import { retrySession } from '@/features/auth/sessionListener';
import { useSessionStore } from '@/store/session';

const mockGetSession = jest.fn();
const mockGetUser = jest.fn();
const mockSignOut = jest.fn();
const mockEnsureProfile = jest.fn();

jest.mock('@/services/supabase', () => ({
  isSupabaseConfigured: true,
  getSupabase: () => ({
    auth: {
      getSession: mockGetSession,
      getUser: mockGetUser,
      signOut: mockSignOut,
    },
  }),
}));
jest.mock('@/services/auth', () => ({
  ensureProfile: (...args: unknown[]) => mockEnsureProfile(...args),
}));
jest.mock('@/services/profile', () => ({
  getProfile: jest.fn(async () => null),
  onboardingStateOf: jest.fn(() => null),
}));

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  useSessionStore.setState({ simulated: false, status: 'loading' });
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'deleted' } } } });
  mockEnsureProfile.mockRejectedValue({ code: '23503' });
  mockSignOut.mockResolvedValue({ error: null });
});

afterEach(() => jest.restoreAllMocks());

it('clears a deleted user session locally and returns to sign-in', async () => {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: { code: 'user_not_found' } });
  await retrySession();
  expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
  expect(useSessionStore.getState().status).toBe('signedOut');
});

it('keeps the session when Auth validation fails due to the network', async () => {
  mockGetUser.mockRejectedValue(new Error('Network unavailable'));
  await retrySession();
  expect(mockSignOut).not.toHaveBeenCalled();
  expect(useSessionStore.getState().status).toBe('error');
});

it('shows an error when the user still exists but the database rejects the profile', async () => {
  mockGetUser.mockResolvedValue({ data: { user: { id: 'deleted' } }, error: null });
  await retrySession();
  expect(mockSignOut).not.toHaveBeenCalled();
  expect(useSessionStore.getState().status).toBe('error');
});
