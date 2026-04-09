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
  email: string;
  code?: string;
  send_transactional?: string;
  disposable?: string;
  free_email?: string;
  result?: string;
  reason?: string;
  role?: string;
  did_you_mean?: string;
}

interface DebounceBulkStatusResponse {
  debounce?: {
    success?: string;
    summary?: {
      total?: number;
      processed?: number;
    };
    emails?: DebounceApiEmail[];
  };
  status?: string;
  success?: string;
}

function mapDebounceStatus(email: DebounceApiEmail): DebounceResult['status'] {
  const result = (email.result || '').toLowerCase();
  const reason = (email.reason || '').toLowerCase();

  if (email.disposable === '1' || reason.includes('disposable')) return 'disposable';
  if (reason.includes('spam') || reason.includes('trap')) return 'spamtrap';
  if (result === 'deliverable' || result === 'safe_to_send') return 'valid';
  if (result === 'undeliverable') return 'invalid';
  if (result === 'risky' && reason.includes('catch')) return 'catch_all';
  if (result === 'risky') return 'catch_all';
  if (result === 'unknown') return 'unknown';
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

export async function submitBulkVerification(emails: string[]): Promise<string> {
  if (!DEBOUNCE_API_KEY) throw new Error('DEBOUNCE_API_KEY is not configured');

  const csv = ['email', ...emails].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const formData = new FormData();
  formData.append('api', DEBOUNCE_API_KEY);
  formData.append('file', blob, 'emails.csv');

  const response = await fetch(`${DEBOUNCE_BASE}/bulk`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Debounce.io upload failed: ${response.status} ${text}`);
  }

  const data = await response.json() as { debounce?: { list_id?: string }; list_id?: string };
  const listId = data?.debounce?.list_id || data?.list_id;
  if (!listId) throw new Error('Debounce.io did not return a list_id');
  return listId;
}

export async function getBulkVerificationStatus(listId: string): Promise<{
  done: boolean;
  total: number;
  processed: number;
  results?: DebounceResult[];
}> {
  if (!DEBOUNCE_API_KEY) throw new Error('DEBOUNCE_API_KEY is not configured');

  const url = `${DEBOUNCE_BASE}/bulk?api=${encodeURIComponent(DEBOUNCE_API_KEY)}&id=${encodeURIComponent(listId)}`;
  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Debounce.io status check failed: ${response.status} ${text}`);
  }

  const data = await response.json() as DebounceBulkStatusResponse;
  const summary = data?.debounce?.summary;
  const total = summary?.total ?? 0;
  const processed = summary?.processed ?? 0;
  const done = total > 0 && processed >= total;

  if (!done) {
    return { done: false, total, processed };
  }

  const emails = data?.debounce?.emails || [];
  const results: DebounceResult[] = emails.map((e) => {
    const status = mapDebounceStatus(e);
    const recommendation = mapToRecommendation(status);
    return {
      email: e.email,
      status,
      reason: reasonLabel(e, status),
      recommendation,
      safeToSend: recommendation === 'keep' && status !== 'catch_all',
    };
  });

  return { done: true, total, processed, results };
}
