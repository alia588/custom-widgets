import { createHash } from 'node:crypto';
import { Resend } from 'resend';

export type AlertSeverity = 'critical' | 'warning';

export interface CriticalAlert {
  title: string;
  message: string;
  severity?: AlertSeverity;
  /** Stable id for dedupe (widget id, route, error name, etc.). */
  fingerprint?: string;
  meta?: Record<string, unknown>;
}

const DEDUPE_TTL_MS = 15 * 60 * 1000;
const recentFingerprints = new Map<string, number>();

function parseAlertEmails(): string[] {
  const raw = process.env.ALERT_EMAILS ?? '';
  return raw
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
}

function pruneDedupe(now: number) {
  for (const [key, expiresAt] of recentFingerprints) {
    if (expiresAt <= now) recentFingerprints.delete(key);
  }
}

function fingerprintOf(alert: CriticalAlert): string {
  if (alert.fingerprint) return alert.fingerprint;
  return createHash('sha256')
    .update(`${alert.severity ?? 'critical'}|${alert.title}|${alert.message}`)
    .digest('hex')
    .slice(0, 24);
}

/**
 * Send a catastrophic / critical alert email via Resend.
 * Recipients come from ALERT_EMAILS (comma-separated) so the list can change
 * without code changes. Dedupes identical fingerprints for 15 minutes.
 *
 * Safe to call from API routes and server components. Never import into the
 * embed bundle (Resend key must stay server-side).
 */
export async function reportCritical(alert: CriticalAlert): Promise<{
  sent: boolean;
  reason?: string;
}> {
  const severity = alert.severity ?? 'critical';
  if (severity !== 'critical') {
    console.warn('[alerts]', alert.title, alert.message, alert.meta ?? {});
    return { sent: false, reason: 'non-critical' };
  }

  const now = Date.now();
  pruneDedupe(now);
  const fp = fingerprintOf(alert);
  const existing = recentFingerprints.get(fp);
  if (existing && existing > now) {
    return { sent: false, reason: 'deduped' };
  }
  recentFingerprints.set(fp, now + DEDUPE_TTL_MS);

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_FROM;
  const to = parseAlertEmails();

  if (!apiKey || !from || to.length === 0) {
    console.error('[alerts] missing RESEND_API_KEY, ALERT_FROM, or ALERT_EMAILS', {
      title: alert.title,
      message: alert.message,
      meta: alert.meta,
    });
    return { sent: false, reason: 'misconfigured' };
  }

  const metaBlock =
    alert.meta && Object.keys(alert.meta).length > 0
      ? `\n\nMeta:\n${JSON.stringify(alert.meta, null, 2)}`
      : '';

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `[CRITICAL] ${alert.title}`,
      text: `${alert.message}${metaBlock}\n\nFingerprint: ${fp}\nTime: ${new Date(now).toISOString()}`,
    });

    if (error) {
      console.error('[alerts] Resend error:', error);
      return { sent: false, reason: 'resend-error' };
    }

    return { sent: true };
  } catch (err) {
    console.error('[alerts] failed to send:', err);
    return { sent: false, reason: 'exception' };
  }
}

/** Reset dedupe cache — tests only. */
export function __resetAlertDedupeForTests() {
  recentFingerprints.clear();
}
