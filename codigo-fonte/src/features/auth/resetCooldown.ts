export const RESET_COOLDOWN_MS = 60_000;

let lastSentAt: number | null = null;

export function markResetSent(now = Date.now()): void {
  lastSentAt = now;
}

export function resetCooldownLeft(now = Date.now()): number {
  if (lastSentAt === null) return 0;
  return Math.max(0, Math.ceil((lastSentAt + RESET_COOLDOWN_MS - now) / 1000));
}

export function clearResetCooldown(): void {
  lastSentAt = null;
}
