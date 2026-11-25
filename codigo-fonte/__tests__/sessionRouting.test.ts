import {
  isResolved,
  onboardingStepToResume,
  resolveStatus,
  routeForStatus,
} from '@/features/auth/sessionRouting';

describe('resolveStatus', () => {
  it('sends users without session to the signed-out state', () => {
    expect(resolveStatus(false, null)).toBe('signedOut');
    expect(resolveStatus(false, { completed: true, step: 3 })).toBe('signedOut');
  });

  it('treats a user without profiles row as onboarding not completed', () => {
    expect(resolveStatus(true, null)).toBe('onboarding');
  });

  it('keeps users with incomplete onboarding in onboarding', () => {
    expect(resolveStatus(true, { completed: false, step: 2 })).toBe('onboarding');
  });

  it('lets users with completed onboarding reach the app', () => {
    expect(resolveStatus(true, { completed: true, step: 3 })).toBe('ready');
  });
});

describe('onboardingStepToResume', () => {
  it.each([
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 3],
    [-1, 1],
    [9, 3],
  ])('after %i completed steps resumes at step %i', (completed, expected) => {
    expect(onboardingStepToResume(completed)).toBe(expected);
  });
});

describe('routeForStatus', () => {
  it('maps each state to its first route', () => {
    expect(routeForStatus('signedOut')).toBe('/welcome');
    expect(routeForStatus('onboarding', 0)).toBe('/step-1');
    expect(routeForStatus('onboarding', 2)).toBe('/step-3');
    expect(routeForStatus('ready')).toBe('/home');
  });
});

describe('isResolved', () => {
  it('only accepts states that allow a routing decision', () => {
    expect(isResolved('loading')).toBe(false);
    expect(isResolved('error')).toBe(false);
    expect(isResolved('signedOut')).toBe(true);
    expect(isResolved('onboarding')).toBe(true);
    expect(isResolved('ready')).toBe(true);
  });
});
