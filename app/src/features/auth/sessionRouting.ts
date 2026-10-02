import type { OnboardingState } from '@/services/profile';

export type SessionStatus = 'loading' | 'signedOut' | 'onboarding' | 'ready' | 'error';

export type ResolvedStatus = Extract<SessionStatus, 'signedOut' | 'onboarding' | 'ready'>;

export const ONBOARDING_STEPS = 3;

export function resolveStatus(hasUser: boolean, profile: OnboardingState | null): ResolvedStatus {
  if (!hasUser) return 'signedOut';
  if (!profile || !profile.completed) return 'onboarding';
  return 'ready';
}

export function onboardingStepToResume(completedSteps: number): number {
  return Math.min(Math.max(completedSteps + 1, 1), ONBOARDING_STEPS);
}

export type RootHref = '/welcome' | '/step-1' | '/step-2' | '/step-3' | '/home';

export function routeForStatus(status: ResolvedStatus, completedSteps = 0): RootHref {
  switch (status) {
    case 'signedOut':
      return '/welcome';
    case 'onboarding':
      return `/step-${onboardingStepToResume(completedSteps)}` as RootHref;
    case 'ready':
      return '/home';
  }
}

export function isResolved(status: SessionStatus): status is ResolvedStatus {
  return status === 'signedOut' || status === 'onboarding' || status === 'ready';
}
