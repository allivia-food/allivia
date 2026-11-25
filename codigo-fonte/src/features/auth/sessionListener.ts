import type { Session } from '@supabase/supabase-js';

import { DEV_SIMULATED_ONBOARDING_STEP, DEV_SIMULATED_SESSION } from '@/constants/devFlags';
import { ensureProfile } from '@/services/auth';
import { getProfile, onboardingStateOf } from '@/services/profile';
import { useProfileStore } from '@/store/profile';
import { getSupabase, isSupabaseConfigured } from '@/services/supabase';
import { useSessionStore } from '@/store/session';
import { withTimeout } from '@/utils/withTimeout';

import { resolveStatus } from './sessionRouting';

let requestId = 0;

async function applySession(session: Session | null) {
  const store = useSessionStore.getState();
  if (store.simulated) return;
  const id = ++requestId;
  if (!session) {
    useProfileStore.getState().setProfile(null);
    store.setStatus('signedOut');
    return;
  }
  try {
    let profile = await getProfile(session.user.id);
    if (!profile) {
      try {
        if (await ensureProfile(session.user)) {
          profile = await getProfile(session.user.id);
        }
      } catch (ensureError) {
        if (__DEV__) console.warn('[session] ensureProfile failed', ensureError);
        if ((ensureError as { code?: string } | null)?.code === '23503') {
          // A persisted JWT can outlive a deleted Auth user. Check with Auth
          // before clearing it; a database failure alone is not proof.
          const { data, error } = await withTimeout(getSupabase().auth.getUser());
          if (id !== requestId || useSessionStore.getState().simulated) return;
          if (error?.code === 'user_not_found' || (!error && !data.user)) {
            const { error: signOutError } = await withTimeout(
              getSupabase().auth.signOut({ scope: 'local' }),
            );
            if (signOutError) throw signOutError;
            if (id !== requestId || useSessionStore.getState().simulated) return;
            useProfileStore.getState().setProfile(null);
            store.setStatus('signedOut');
            return;
          }
          if (error) throw error;
        }
        throw ensureError;
      }
    }
    if (id !== requestId || useSessionStore.getState().simulated) return;
    useProfileStore.getState().setProfile(profile);
    const state = onboardingStateOf(profile);
    store.setStatus(resolveStatus(true, state), state?.step ?? 0);
  } catch (error) {
    if (id !== requestId) return;
    if (__DEV__) console.warn('[session] could not read profiles', error);
    store.setStatus('error');
  }
}

export function startSessionListener(): () => void {
  if (__DEV__ && DEV_SIMULATED_SESSION) {
    useSessionStore.getState().simulate(DEV_SIMULATED_SESSION, DEV_SIMULATED_ONBOARDING_STEP);
    return () => {};
  }
  if (!isSupabaseConfigured) {
    if (__DEV__) console.warn('[session] Supabase is not configured (app/.env)');
    useSessionStore.getState().setStatus('error');
    return () => {};
  }
  const { data } = getSupabase().auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;
    setTimeout(() => void applySession(session), 0);
  });
  return () => data.subscription.unsubscribe();
}

export async function retrySession(): Promise<void> {
  const store = useSessionStore.getState();
  if (store.simulated) return;
  store.setStatus('loading');
  if (!isSupabaseConfigured) {
    store.setStatus('error');
    return;
  }
  try {
    const { data, error } = await getSupabase().auth.getSession();
    if (error) throw error;
    await applySession(data.session);
  } catch (error) {
    if (__DEV__) console.warn('[session] retry failed', error);
    store.setStatus('error');
  }
}
