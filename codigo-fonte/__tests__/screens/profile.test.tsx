import { AuthApiError } from '@supabase/supabase-js';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Profile } from '@/services/profile';
import { useProfileStore } from '@/store/profile';

import ProfileScreen from '@/app/(tabs)/profile';
import EditProfileScreen from '@/app/profile/edit';
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('@/services/avatar', () => ({ avatarUrl: jest.fn(), saveAvatar: jest.fn() }));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) },
  useLocalSearchParams: () => ({}),
  useFocusEffect: jest.fn(),
  usePreventRemove: jest.fn(() => jest.fn()),
}));
const mockRouter = jest.requireMock('expo-router').router as Record<string, jest.Mock>;

const mockUpdateName = jest.fn();
const mockDelete = jest.fn();
const mockSaveSubscription = jest.fn();
jest.mock('@/services/profile', () => ({
  updateDisplayName: (...a: unknown[]) => mockUpdateName(...a),
  deleteAccount: (...a: unknown[]) => mockDelete(...a),
  saveSubscription: (...a: unknown[]) => mockSaveSubscription(...a),
}));
const mockReauth = jest.fn();
const mockChangeEmail = jest.fn();
const mockChangePassword = jest.fn();
const mockRequestPasswordCode = jest.fn();
const mockLogout = jest.fn();
jest.mock('@/services/auth', () => ({
  reauthenticate: (...a: unknown[]) => mockReauth(...a),
  changeEmail: (...a: unknown[]) => mockChangeEmail(...a),
  changePassword: (...a: unknown[]) => mockChangePassword(...a),
  requestPasswordChangeCode: (...a: unknown[]) => mockRequestPasswordCode(...a),
  confirmPasswordChange: (...a: unknown[]) => mockChangePassword(...a),
  clearPasswordProof: jest.fn(),
  logout: (...a: unknown[]) => mockLogout(...a),
}));

const profile: Profile = {
  id: 'u1',
  email: 'ana@exemplo.com',
  displayName: 'Ana',
  allergies: ['milk', 'egg', 'peanut', 'soy'],
  customAllergies: [],
  preferences: [],
  onboardingCompleted: true,
  onboardingStep: 3,
  isPremium: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  useProfileStore.getState().setProfile(profile);
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('Perfil', () => {
  it('shows name, e-mail and up to 3 restrictions with "+N"', async () => {
    await render(<ProfileScreen />);
    expect(screen.getByTestId('profile-name')).toHaveTextContent('Ana');
    expect(screen.getByTestId('profile-email')).toHaveTextContent('ana@exemplo.com');
    expect(screen.getByText('Leite')).toBeTruthy();
    expect(screen.getByText('Ovo')).toBeTruthy();
    expect(screen.getByTestId('profile-more')).toHaveTextContent('+2');
  });

  it('shows "Nenhuma alergia cadastrada" without allergies', async () => {
    useProfileStore.getState().setProfile({ ...profile, allergies: [] });
    await render(<ProfileScreen />);
    expect(screen.getByText('Nenhuma alergia cadastrada')).toBeTruthy();
  });

  it('opens the restrictions editor and the text screens', async () => {
    await render(<ProfileScreen />);
    await fireEvent.press(screen.getByTestId('profile-edit'));
    expect(mockRouter.push).toHaveBeenCalledWith('/profile/edit');
    expect(screen.queryByTestId('profile-row-restrictions')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Termos de uso' }));
    expect(mockRouter.push).toHaveBeenCalledWith('/profile/terms');
  });

  it('signs out and clears the profile store', async () => {
    mockLogout.mockResolvedValue(undefined);
    await render(<ProfileScreen />);
    await fireEvent.press(screen.getByTestId('profile-logout'));
    expect(mockLogout).toHaveBeenCalled();
    expect(useProfileStore.getState().profile).toBeNull();
  });
});

describe('Editar informações', () => {
  it('can cancel email verification without changing the password', async () => {
    mockReauth.mockResolvedValue(undefined);
    mockRequestPasswordCode.mockResolvedValue('ana@exemplo.com');
    await render(<EditProfileScreen />);
    await fireEvent.changeText(screen.getByTestId('edit-new-password'), 'Nova12345');
    await fireEvent.changeText(screen.getByTestId('edit-current-password'), 'Atual12345');
    await fireEvent.press(screen.getByTestId('edit-save'));
    await fireEvent.press(await screen.findByTestId('password-verification-close'));
    expect(screen.queryByTestId('password-verification')).toBeNull();
    expect(mockChangePassword).not.toHaveBeenCalled();
    expect(mockUpdateName).not.toHaveBeenCalled();
  });
  it('requests an email code before saving a new password or other profile edits', async () => {
    mockReauth.mockResolvedValue(undefined);
    mockRequestPasswordCode.mockResolvedValue('ana@exemplo.com');
    mockChangePassword.mockResolvedValue(undefined);
    mockUpdateName.mockResolvedValue({ ...profile, displayName: 'Ana Maria' });
    await render(<EditProfileScreen />);
    await fireEvent.changeText(screen.getByTestId('edit-name'), 'Ana Maria');
    await fireEvent.changeText(screen.getByTestId('edit-new-password'), 'Nova12345');
    await fireEvent.changeText(screen.getByTestId('edit-current-password'), 'Atual12345');
    await fireEvent.press(screen.getByTestId('edit-save'));
    expect(await screen.findByTestId('password-verification')).toBeTruthy();
    expect(mockRequestPasswordCode).toHaveBeenCalledTimes(1);
    expect(mockChangePassword).not.toHaveBeenCalled();
    expect(mockUpdateName).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByTestId('otp-code'), '012345');
    await fireEvent.press(screen.getByTestId('otp-confirm'));
    expect(mockChangePassword).toHaveBeenCalledWith('012345', 'Nova12345', 'Atual12345');
    expect(mockUpdateName).toHaveBeenCalledWith('u1', 'Ana Maria');
  });

  it('keeps all edits unsaved when a password verification code is wrong', async () => {
    mockReauth.mockResolvedValue(undefined);
    mockRequestPasswordCode.mockResolvedValue('ana@exemplo.com');
    mockChangePassword.mockRejectedValue({ code: 'otp_expired' });
    await render(<EditProfileScreen />);
    await fireEvent.changeText(screen.getByTestId('edit-name'), 'Ana Maria');
    await fireEvent.changeText(screen.getByTestId('edit-new-password'), 'Nova12345');
    await fireEvent.changeText(screen.getByTestId('edit-current-password'), 'Atual12345');
    await fireEvent.press(screen.getByTestId('edit-save'));
    await fireEvent.changeText(screen.getByTestId('otp-code'), '111111');
    await fireEvent.press(screen.getByTestId('otp-confirm'));
    expect(await screen.findByText(/Código inválido ou expirado/)).toBeTruthy();
    expect(mockUpdateName).not.toHaveBeenCalled();
    expect(mockChangeEmail).not.toHaveBeenCalled();
    expect(mockRouter.back).not.toHaveBeenCalled();
  });
  it('removes numbers from the name while typing or pasting and saves the filtered value', async () => {
    mockUpdateName.mockResolvedValue({ ...profile, displayName: "João D'Ávila-Silva" });
    await render(<EditProfileScreen />);
    await fireEvent.changeText(screen.getByTestId('edit-name'), 'Ana1');
    expect(screen.getByTestId('edit-name')).toHaveDisplayValue('Ana');
    await fireEvent.changeText(screen.getByTestId('edit-name'), "João2 D'Ávila-Silva３");
    expect(screen.getByTestId('edit-name')).toHaveDisplayValue("João D'Ávila-Silva");
    await fireEvent.press(screen.getByTestId('edit-save'));
    expect(mockUpdateName).toHaveBeenCalledWith('u1', "João D'Ávila-Silva");
  });

  it('saves only the name without asking for the password', async () => {
    mockUpdateName.mockResolvedValue({ ...profile, displayName: 'Ana Maria' });
    await render(<EditProfileScreen />);
    expect(screen.queryByTestId('edit-current-password')).toBeNull();
    await fireEvent.changeText(screen.getByTestId('edit-name'), 'Ana Maria');
    await fireEvent.press(screen.getByTestId('edit-save'));
    expect(mockReauth).not.toHaveBeenCalled();
    expect(mockUpdateName).toHaveBeenCalledWith('u1', 'Ana Maria');
  });

  it('changing the e-mail requires the current password, then sends the confirmation', async () => {
    mockReauth.mockResolvedValue(undefined);
    mockChangeEmail.mockResolvedValue(undefined);
    await render(<EditProfileScreen />);
    await fireEvent.changeText(screen.getByTestId('edit-email'), 'nova@exemplo.com');
    expect(screen.getByTestId('edit-current-password')).toBeTruthy();
    expect(screen.getByTestId('edit-save')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('edit-current-password'), 'atual123');
    await fireEvent.press(screen.getByTestId('edit-save'));
    expect(mockReauth).toHaveBeenCalledWith('ana@exemplo.com', 'atual123');
    expect(mockChangeEmail).toHaveBeenCalledWith('nova@exemplo.com');
  });

  it('wrong current password shows the message and changes nothing', async () => {
    mockReauth.mockRejectedValue(new AuthApiError('bad', 400, 'invalid_credentials'));
    await render(<EditProfileScreen />);
    await fireEvent.changeText(screen.getByTestId('edit-new-password'), 'nova12345');
    await fireEvent.changeText(screen.getByTestId('edit-current-password'), 'errada1');
    await fireEvent.press(screen.getByTestId('edit-save'));
    expect(await screen.findByText('Senha atual incorreta.')).toBeTruthy();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });
});

describe('Excluir conta', () => {
  it('asks for the password, re-authenticates, deletes and signs out locally', async () => {
    mockReauth.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
    mockLogout.mockResolvedValue(undefined);
    await render(<ProfileScreen />);
    await fireEvent.press(screen.getByTestId('profile-delete'));
    expect(screen.getByText('Tem certeza que deseja excluir sua conta?')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('delete-confirm'));
    expect(mockDelete).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByTestId('delete-password'), 'senha123');
    await fireEvent.press(screen.getByTestId('delete-confirm'));
    expect(mockReauth).toHaveBeenCalledWith('ana@exemplo.com', 'senha123');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockLogout).toHaveBeenCalledWith(true);
  });

  it('when deletion fails nothing is deleted and the user can retry', async () => {
    mockReauth.mockResolvedValue(undefined);
    mockDelete.mockRejectedValue(new Error('db'));
    await render(<ProfileScreen />);
    await fireEvent.press(screen.getByTestId('profile-delete'));
    await fireEvent.press(screen.getByTestId('delete-confirm'));
    await fireEvent.changeText(screen.getByTestId('delete-password'), 'senha123');
    await fireEvent.press(screen.getByTestId('delete-confirm'));
    expect(
      await screen.findByText('Não foi possível excluir sua conta agora. Tente novamente.'),
    ).toBeTruthy();
    expect(mockLogout).not.toHaveBeenCalled();
    expect(screen.getByTestId('delete-confirm')).toBeEnabled();
  });
});

describe('profile plan', () => {
  const subscription = {
    plan: 'monthly' as const,
    status: 'active' as const,
    simulated: true as const,
    startedAt: '2099-01-01',
    renewsAt: '2099-02-01',
    priceCents: 990,
  };
  it('takes free users to plan selection before checkout', async () => {
    await render(<ProfileScreen />);
    await fireEvent.press(screen.getByTestId('profile-change-plan'));
    expect(mockRouter.push).toHaveBeenCalledWith('/premium');
  });
  it('confirms cancellation and preserves Premium until expiry', async () => {
    useProfileStore.getState().setProfile({ ...profile, isPremium: true, subscription });
    mockSaveSubscription.mockResolvedValue({
      ...profile,
      isPremium: true,
      subscription: { ...subscription, status: 'canceled' },
    });
    await render(<ProfileScreen />);
    await fireEvent.press(screen.getByTestId('profile-change-plan'));
    expect(mockSaveSubscription).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('plan-confirm'));
    expect(mockSaveSubscription).toHaveBeenCalledWith('u1', true, {
      ...subscription,
      status: 'canceled',
    });
    expect(useProfileStore.getState().profile?.isPremium).toBe(true);
    expect(screen.queryByTestId('profile-change-plan')).toBeNull();
  });
  it('shows free plan after canceled period expires', async () => {
    useProfileStore.getState().setProfile({
      ...profile,
      isPremium: true,
      subscription: { ...subscription, status: 'canceled', renewsAt: '2020-01-01' },
    });
    await render(<ProfileScreen />);
    expect(screen.getByText('Plano gratuito')).toBeTruthy();
  });
});
