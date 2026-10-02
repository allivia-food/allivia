import { AuthApiError } from '@supabase/supabase-js';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Profile } from '@/services/profile';
import { useProfileStore } from '@/store/profile';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) },
  useLocalSearchParams: () => ({}),
  useFocusEffect: jest.fn(),
}));
const mockRouter = jest.requireMock('expo-router').router as Record<string, jest.Mock>;

const mockUpdateName = jest.fn();
const mockDelete = jest.fn();
jest.mock('@/services/profile', () => ({
  updateDisplayName: (...a: unknown[]) => mockUpdateName(...a),
  deleteAccount: (...a: unknown[]) => mockDelete(...a),
}));
const mockReauth = jest.fn();
const mockChangeEmail = jest.fn();
const mockChangePassword = jest.fn();
const mockLogout = jest.fn();
jest.mock('@/services/auth', () => ({
  reauthenticate: (...a: unknown[]) => mockReauth(...a),
  changeEmail: (...a: unknown[]) => mockChangeEmail(...a),
  changePassword: (...a: unknown[]) => mockChangePassword(...a),
  logout: (...a: unknown[]) => mockLogout(...a),
}));

import ProfileScreen from '@/app/(tabs)/profile';

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
    await fireEvent.press(screen.getByTestId('profile-restrictions'));
    expect(mockRouter.push).toHaveBeenCalledWith('/profile/edit-preferences');
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
  it('saves only the name without asking for the password', async () => {
    mockUpdateName.mockResolvedValue({ ...profile, displayName: 'Ana Maria' });
    await render(<ProfileScreen />);
    await fireEvent.press(screen.getByTestId('profile-edit'));
    expect(screen.queryByTestId('edit-current-password')).toBeNull();
    await fireEvent.changeText(screen.getByTestId('edit-name'), 'Ana Maria');
    await fireEvent.press(screen.getByTestId('edit-save'));
    expect(mockReauth).not.toHaveBeenCalled();
    expect(mockUpdateName).toHaveBeenCalledWith('u1', 'Ana Maria');
    expect(await screen.findByText('Informações atualizadas.')).toBeTruthy();
  });

  it('changing the e-mail requires the current password, then sends the confirmation', async () => {
    mockReauth.mockResolvedValue(undefined);
    mockChangeEmail.mockResolvedValue(undefined);
    await render(<ProfileScreen />);
    await fireEvent.press(screen.getByTestId('profile-edit'));
    await fireEvent.changeText(screen.getByTestId('edit-email'), 'nova@exemplo.com');
    expect(screen.getByTestId('edit-current-password')).toBeTruthy();
    expect(screen.getByTestId('edit-save')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('edit-current-password'), 'atual123');
    await fireEvent.press(screen.getByTestId('edit-save'));
    expect(mockReauth).toHaveBeenCalledWith('ana@exemplo.com', 'atual123');
    expect(mockChangeEmail).toHaveBeenCalledWith('nova@exemplo.com');
    expect(await screen.findByText(/Enviamos um link de confirmação/)).toBeTruthy();
  });

  it('wrong current password shows the message and changes nothing', async () => {
    mockReauth.mockRejectedValue(new AuthApiError('bad', 400, 'invalid_credentials'));
    await render(<ProfileScreen />);
    await fireEvent.press(screen.getByTestId('profile-edit'));
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
