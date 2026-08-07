import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.fn();

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

describe('reportCritical', () => {
  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
    sendMock.mockResolvedValue({ data: { id: 'msg_1' }, error: null });
    process.env.RESEND_API_KEY = 're_test';
    process.env.ALERT_FROM = 'alerts@example.com';
    process.env.ALERT_EMAILS = 'ali@builtbyshah.com, aliamin588@gmail.com';
  });

  it('sends critical emails to ALERT_EMAILS', async () => {
    const { reportCritical, __resetAlertDedupeForTests } = await import('@/lib/alerts');
    __resetAlertDedupeForTests();

    const result = await reportCritical({
      title: 'Test outage',
      message: 'Something broke',
      fingerprint: 'unit-test-send',
    });

    expect(result.sent).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0].to).toEqual([
      'ali@builtbyshah.com',
      'aliamin588@gmail.com',
    ]);
    expect(sendMock.mock.calls[0][0].subject).toContain('Test outage');
  });

  it('dedupes the same fingerprint within the window', async () => {
    const { reportCritical, __resetAlertDedupeForTests } = await import('@/lib/alerts');
    __resetAlertDedupeForTests();

    await reportCritical({
      title: 'Dup',
      message: 'once',
      fingerprint: 'unit-test-dedupe',
    });
    const second = await reportCritical({
      title: 'Dup',
      message: 'once',
      fingerprint: 'unit-test-dedupe',
    });

    expect(second.sent).toBe(false);
    expect(second.reason).toBe('deduped');
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it('does not email non-critical severity', async () => {
    const { reportCritical, __resetAlertDedupeForTests } = await import('@/lib/alerts');
    __resetAlertDedupeForTests();

    const result = await reportCritical({
      title: 'Noise',
      message: 'cors deny',
      severity: 'warning',
      fingerprint: createHash('sha256').update('w').digest('hex'),
    });

    expect(result.sent).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });
});
