import type { SessionStatus } from '@/features/auth/sessionRouting';

export const DEV_SIMULATED_SESSION: Exclude<SessionStatus, 'loading' | 'error'> | null = null;

export const DEV_SIMULATED_ONBOARDING_STEP = 0;
