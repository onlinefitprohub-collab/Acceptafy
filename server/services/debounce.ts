const DEBOUNCE_API_KEY = process.env.DEBOUNCE_API_KEY || '';
const DEBOUNCE_BASE = 'https://api.debounce.io/v1';

export interface DebounceResult {
  email: string;
  status: 'valid' | 'invalid' | 'disposable' | 'spamtrap' | 'catch_all' | 'unknown';
  reason: string;
  recommendation: 'keep' | 'remove';
  safeToSend: boolean;
}

interface DebounceApiEmail {
  email?: string;
  code?: string;
  send_transactional?: string;
  disposable?: string;
  free_email?: string;
  result?: string;
  reason?: string;
  role?: string;
  did_you_mean?: string;
}

function mapDebounceStatus(email: DebounceApiEmail): DebounceResult['status'] {
  const result = (email.result || '').toLowerCase();
  const reason = (email.reason || '').toLowerCase();

  if (email.disposable === '1' || reason.includes('disposable')) return 'disposable';
  if (reason.includes('spam') || reason.includes('trap')) return 'spamtrap';
  if (result === 'safe to send' || result === 'deliverable') return 'valid';
  if (result === 'invalid' || result === 'undeliverable') return 'invalid';
  if (result === 'risky' && reason.includes('catch')) return 'catch_all';
  if (result === 'risky') return 'catch_all';
  if (result === 'unknown' || result === 'accept-all') return 'catch_all';
  if (email.code === '5') return 'disposable';
  if (email.code === '4') return 'catch_all';
  if (email.code === '3') return 'invalid';
  if (email.code === '2') return 'valid';
  return 'unknown';
}

function mapToRecommendation(status: DebounceResult['status']): 'keep' | 'remove' {
  return status === 'valid' || status === 'catch_all' ? 'keep' : 'remove';
}

function reasonLabel(email: DebounceApiEmail, status: DebounceResult['status']): string {
  const raw = email.reason || '';
  if (raw) return raw;
  const map: Record<DebounceResult['status'], string> = {
    valid: 'Mailbox verified',
    invalid: 'Mailbox does not exist',
    disposable: 'Disposable/temporary email',
    spamtrap: 'Spam trap detected',
    catch_all: 'Catch-all domain',
    unknown: 'Could not be verified',
  };
  return map[status];
}

export async function verifySingleEmail(email: string): Promise<DebounceResult> {
  if (!DEBOUNCE_API_KEY) throw new Error('DEBOUNCE_API_KEY is not configured');

  const url = `${DEBOUNCE_BASE}/?api=${encodeURIComponent(DEBOUNCE_API_KEY)}&email=${encodeURIComponent(email)}`;
  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Debounce API error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json() as { debounce?: DebounceApiEmail; success?: string };

  if (data.success !== '1' || !data.debounce) {
    return {
      email,
      status: 'unknown',
      reason: 'Could not be verified',
      recommendation: 'keep',
      safeToSend: false,
    };
  }

  const emailData = data.debounce;
  const status = mapDebounceStatus(emailData);
  const recommendation = mapToRecommendation(status);

  return {
    email: emailData.email || email,
    status,
    reason: reasonLabel(emailData, status),
    recommendation,
    safeToSend: recommendation === 'keep' && status !== 'catch_all',
  };
}

const BATCH_SIZE = 5;

export async function verifyEmailList(
  emails: string[],
  onProgress?: (processed: number) => void,
): Promise<DebounceResult[]> {
  const results: DebounceResult[] = [];

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((email) =>
        verifySingleEmail(email).catch((): DebounceResult => ({
          email,
          status: 'unknown',
          reason: 'Verification failed',
          recommendation: 'keep',
          safeToSend: false,
        })),
      ),
    );
    results.push(...batchResults);
    if (onProgress) onProgress(results.length);
  }

  return results;
}
