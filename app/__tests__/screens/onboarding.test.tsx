import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Profile } from '@/services/profile';
import { useProfileStore } from '@/store/profile';
import { useSessionStore } from '@/store/session';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) },
  useLocalSearchParams: () => mockParams,
  useFocusEffect: jest.fn(),
}));
const mockRouter = jest.requireMock('expo-router').router as Record<string, jest.Mock>;

const mockSaveStep = jest.fn();
const mockComplete = jest.fn();
jest.mock('@/services/profile', () => ({
  saveOnboardingStep: (...a: unknown[]) => mockSaveStep(...a),
  completeOnboarding: (...a: unknown[]) => mockComplete(...a),
}));

import Step1 from '@/app/(onboarding)/step-1';
import Step2 from '@/app/(onboarding)/step-2';
import Step3 from '@/app/(onboarding)/step-3';

const baseProfile: Profile = {
  id: 'u1',
  email: 'ana@exemplo.com',
  displayName: '',
  allergies: [],
  customAllergies: [],
  preferences: [],
  onboardingCompleted: false,
  onboardingStep: 0,
  isPremium: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  useProfileStore.getState().setProfile(baseProfile);
  useSessionStore.getState().setStatus('onboarding', 0);
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('Passo 01', () => {
  it('saves the normalized name and step 1, then opens step 2', async () => {
    mockSaveStep.mockImplementation(async () => ({
      ...baseProfile,
      displayName: 'Ana Maria',
      onboardingStep: 1,
    }));
    await render(<Step1 />);
    expect(screen.getByTestId('step1-continue')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('step1-name'), '  Ana   Maria ');
    await fireEvent.press(screen.getByTestId('step1-continue'));
    expect(mockSaveStep).toHaveBeenCalledWith('u1', { step: 1, displayName: 'Ana Maria' }, 0);
    expect(mockRouter.push).toHaveBeenCalledWith('/step-2');
    expect(useProfileStore.getState().profile?.displayName).toBe('Ana Maria');
  });

  it('stays on the step and keeps the name when saving fails', async () => {
    mockSaveStep.mockRejectedValue(new Error('db'));
    await render(<Step1 />);
    await fireEvent.changeText(screen.getByTestId('step1-name'), 'Ana');
    await fireEvent.press(screen.getByTestId('step1-continue'));
    expect(await screen.findByText('Não foi possível salvar. Tente novamente.')).toBeTruthy();
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(screen.getByTestId('step1-name').props.value).toBe('Ana');
  });
});

describe('Passo 02', () => {
  it('disables "Avançar" with 0 selected and shows the right counter', async () => {
    await render(<Step2 />);
    expect(screen.getByText('Avançar (0 selecionadas)')).toBeTruthy();
    expect(screen.getByTestId('step2-continue')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('allergy-milk'));
    expect(screen.getByText('Avançar (1 selecionada)')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('allergy-gluten'));
    expect(screen.getByText('Avançar (2 selecionadas)')).toBeTruthy();
    expect(screen.getByTestId('step2-continue')).toBeEnabled();
  });

  it('adds a custom allergy (no duplicates) and saves step 2', async () => {
    mockSaveStep.mockImplementation(async () => ({ ...baseProfile, onboardingStep: 2 }));
    await render(<Step2 />);
    await fireEvent.press(screen.getByTestId('allergy-add'));
    await fireEvent.changeText(screen.getByTestId('allergy-modal-input'), 'Glúten');
    expect(screen.getByTestId('allergy-modal-confirm')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('allergy-modal-input'), 'Mostarda');
    await fireEvent.press(screen.getByTestId('allergy-modal-confirm'));
    expect(screen.getByText('Avançar (1 selecionada)')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('step2-continue'));
    expect(mockSaveStep).toHaveBeenCalledWith(
      'u1',
      { step: 2, allergies: [], customAllergies: ['Mostarda'] },
      0,
    );
    expect(mockRouter.push).toHaveBeenCalledWith('/step-3');
  });

  it('restores the saved selection when the onboarding is resumed', async () => {
    useProfileStore.getState().setProfile({
      ...baseProfile,
      allergies: ['egg'],
      customAllergies: ['Kiwi'],
      onboardingStep: 1,
    });
    await render(<Step2 />);
    expect(screen.getByTestId('allergy-egg')).toBeChecked();
    expect(screen.getByText('Kiwi')).toBeTruthy();
    expect(screen.getByText('Avançar (2 selecionadas)')).toBeTruthy();
  });
});

describe('Passo 03', () => {
  it('"Nenhuma" is exclusive and Vegano unchecks Vegetariano', async () => {
    await render(<Step3 />);
    await fireEvent.press(screen.getByTestId('preference-vegetarian'));
    await fireEvent.press(screen.getByTestId('preference-vegan'));
    expect(screen.getByTestId('preference-vegetarian')).not.toBeChecked();
    expect(screen.getByTestId('preference-vegan')).toBeChecked();
    await fireEvent.press(screen.getByTestId('preference-none'));
    expect(screen.getByTestId('preference-vegan')).not.toBeChecked();
    expect(screen.getByTestId('preference-none')).toBeChecked();
  });

  it('"Concluir" saves in one write and marks the session as ready', async () => {
    mockComplete.mockImplementation(async (_id, prefs) => ({
      ...baseProfile,
      preferences: prefs,
      onboardingStep: 3,
      onboardingCompleted: true,
    }));
    await render(<Step3 />);
    await fireEvent.press(screen.getByTestId('preference-gluten_free'));
    await fireEvent.press(screen.getByTestId('step3-finish'));
    expect(mockComplete).toHaveBeenCalledWith('u1', ['gluten_free']);
    expect(useSessionStore.getState().status).toBe('ready');
  });

  it('with nothing selected saves no preferences', async () => {
    mockComplete.mockImplementation(async () => ({ ...baseProfile, onboardingCompleted: true }));
    await render(<Step3 />);
    expect(screen.getByTestId('step3-finish')).toBeEnabled();
    await fireEvent.press(screen.getByTestId('step3-finish'));
    expect(mockComplete).toHaveBeenCalledWith('u1', []);
  });
});
