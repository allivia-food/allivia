import { create } from 'zustand';

import type { SessionStatus } from '@/features/auth/sessionRouting';

interface SessionStore {
  status: SessionStatus;
  onboardingStep: number;
  simulated: boolean;
  setStatus: (status: SessionStatus, onboardingStep?: number) => void;
  simulate: (status: SessionStatus | null, onboardingStep?: number) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  status: 'loading',
  onboardingStep: 0,
  simulated: false,
  setStatus: (status, onboardingStep = 0) => set({ status, onboardingStep }),
  simulate: (status, onboardingStep = 0) =>
    status === null
      ? set({ simulated: false, status: 'loading' })
      : set({ simulated: true, status, onboardingStep }),
}));
