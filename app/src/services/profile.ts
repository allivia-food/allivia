import type { AllergenId } from '@/constants/allergens';
import type { PreferenceId } from '@/constants/preferences';
import type { Subscription } from '@/features/premium/plans';
import { withTimeout } from '@/utils/withTimeout';

import { getSupabase } from './supabase';

export interface OnboardingState {
  completed: boolean;
  step: number;
}

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  allergies: AllergenId[];
  customAllergies: string[];
  preferences: PreferenceId[];
  onboardingCompleted: boolean;
  onboardingStep: number;
  isPremium: boolean;
  subscription?: Subscription | null;
}

interface ProfileRow {
  id: string;
  email: string;
  display_name: string;
  allergies: AllergenId[];
  custom_allergies: string[];
  preferences: PreferenceId[];
  onboarding_completed: boolean;
  onboarding_step: number;
  is_premium: boolean;
  subscription: Subscription | null;
}

const COLUMNS =
  'id, email, display_name, allergies, custom_allergies, preferences, onboarding_completed, onboarding_step, is_premium, subscription';

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    allergies: row.allergies ?? [],
    customAllergies: row.custom_allergies ?? [],
    preferences: row.preferences ?? [],
    onboardingCompleted: row.onboarding_completed,
    onboardingStep: row.onboarding_step,
    isPremium: row.is_premium,
    subscription: row.subscription ?? null,
  };
}

export function onboardingStateOf(profile: Profile | null): OnboardingState | null {
  return profile ? { completed: profile.onboardingCompleted, step: profile.onboardingStep } : null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await withTimeout(
    getSupabase().from('profiles').select(COLUMNS).eq('id', userId).maybeSingle<ProfileRow>(),
  );
  if (error) throw error;
  return data ? toProfile(data) : null;
}

export async function getOnboardingState(userId: string): Promise<OnboardingState | null> {
  return onboardingStateOf(await getProfile(userId));
}

async function update(userId: string, values: Partial<ProfileRow>): Promise<Profile> {
  const { data, error } = await withTimeout(
    getSupabase()
      .from('profiles')
      .update(values)
      .eq('id', userId)
      .select(COLUMNS)
      .single<ProfileRow>(),
  );
  if (error) throw error;
  return toProfile(data);
}

export type OnboardingStepData =
  | { step: 1; displayName: string }
  | { step: 2; allergies: AllergenId[]; customAllergies: string[] };

export function saveOnboardingStep(
  userId: string,
  data: OnboardingStepData,
  currentStep: number,
): Promise<Profile> {
  const onboarding_step = Math.max(currentStep, data.step);
  if (data.step === 1) {
    return update(userId, { display_name: data.displayName, onboarding_step });
  }
  return update(userId, {
    allergies: data.allergies,
    custom_allergies: data.customAllergies,
    onboarding_step,
  });
}

export function completeOnboarding(userId: string, preferences: PreferenceId[]): Promise<Profile> {
  return update(userId, { preferences, onboarding_step: 3, onboarding_completed: true });
}

export function updateDisplayName(userId: string, displayName: string): Promise<Profile> {
  return update(userId, { display_name: displayName });
}

export function updateAllergiesAndPreferences(
  userId: string,
  allergies: AllergenId[],
  customAllergies: string[],
  preferences: PreferenceId[],
): Promise<Profile> {
  return update(userId, {
    allergies,
    custom_allergies: customAllergies,
    preferences,
  });
}

export function saveSubscription(
  userId: string,
  isPremium: boolean,
  subscription: Subscription,
): Promise<Profile> {
  return update(userId, { is_premium: isPremium, subscription });
}

export async function deleteAccount(): Promise<void> {
  const { error } = await withTimeout(getSupabase().rpc('delete_own_account'));
  if (error) throw error;
}
