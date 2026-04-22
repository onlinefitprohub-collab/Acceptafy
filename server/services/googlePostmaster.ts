import { OAuth2Client } from 'google-auth-library';
import { storage } from '../storage';
import type { ESPProviderType } from '@shared/schema';

const POSTMASTER_SCOPE = 'https://www.googleapis.com/auth/postmaster.readonly';
const POSTMASTER_API_BASE = 'https://gmailpostmastertools.googleapis.com/v2';
const PROVIDER = 'google-postmaster' as ESPProviderType;

function createClient(redirectUri?: string) {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );
}

export function getAuthUrl(state: string, hostname: string): string {
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `https://${hostname}/api/google-postmaster/callback`;
  return createClient(redirectUri).generateAuthUrl({
    access_type: 'offline',
    scope: [POSTMASTER_SCOPE],
    state,
    prompt: 'consent',
  });
}

export async function exchangeCode(code: string, hostname: string) {
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `https://${hostname}/api/google-postmaster/callback`;
  const client = createClient(redirectUri);
  const { tokens } = await client.getToken(code);
  return tokens;
}

async function getAuthorizedClient(userId: string) {
  const connection = await storage.getESPConnection(userId, PROVIDER);
  if (!connection?.accessToken) throw new Error('Google Postmaster not connected');

  const client = createClient();
  client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken ?? undefined,
  });

  // Persist refreshed tokens automatically
  client.on('tokens', async (newTokens) => {
    await storage.upsertESPConnection({
      userId,
      provider: PROVIDER,
      accessToken: newTokens.access_token ?? connection.accessToken!,
      refreshToken: newTokens.refresh_token ?? connection.refreshToken ?? undefined,
      isConnected: true,
      accountName: connection.accountName ?? undefined,
      accountEmail: connection.accountEmail ?? undefined,
    });
  });

  return client;
}

export async function getTokenEmail(accessToken: string): Promise<string | null> {
  try {
    const client = createClient();
    const info = await client.getTokenInfo(accessToken);
    return info.email ?? null;
  } catch {
    return null;
  }
}

export async function getVerifiedDomains(userId: string): Promise<string[]> {
  const client = await getAuthorizedClient(userId);
  const res = await client.request<{ domains?: Array<{ name: string }> }>({
    url: `${POSTMASTER_API_BASE}/domains`,
  });
  return (res.data.domains ?? []).map((d) => d.name.replace(/^domains\//, ''));
}

export interface PostmasterReputationData {
  domainReputation: null; // removed in Postmaster Tools API v2
  userReportedSpamRatio: number | null;
  spfSuccessRatio: number | null;
  dkimSuccessRatio: number | null;
  dmarcSuccessRatio: number | null;
  dataPoints: number;
  periodStart: string;
  periodEnd: string;
  verifiedDomain: boolean;
}

export async function getDomainReputation(userId: string, domain: string): Promise<PostmasterReputationData> {
  const client = await getAuthorizedClient(userId);

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  const params = new URLSearchParams({
    'startDate.year':  String(start.getFullYear()),
    'startDate.month': String(start.getMonth() + 1),
    'startDate.day':   String(start.getDate()),
    'endDate.year':    String(end.getFullYear()),
    'endDate.month':   String(end.getMonth() + 1),
    'endDate.day':     String(end.getDate()),
  });

  type DomainStat = {
    userReportedSpamRatio?: number;
    spfSuccessRatio?: number;
    dkimSuccessRatio?: number;
    dmarcSuccessRatio?: number;
  };

  let stats: DomainStat[] = [];
  let verifiedDomain = true;

  try {
    const res = await client.request<{ domainStats?: DomainStat[] }>({
      url: `${POSTMASTER_API_BASE}/domains/${encodeURIComponent(domain)}/domainStats:query?${params}`,
    });
    stats = res.data.domainStats ?? [];
  } catch (err: any) {
    const status = err?.response?.status ?? err?.code;
    if (status === 403 || status === 404) {
      verifiedDomain = false;
    } else {
      throw err;
    }
  }

  const avgOrNull = (key: keyof DomainStat): number | null => {
    const vals = stats
      .map((s) => s[key] as number | undefined)
      .filter((v): v is number => v != null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  return {
    domainReputation: null,
    userReportedSpamRatio: avgOrNull('userReportedSpamRatio'),
    spfSuccessRatio: avgOrNull('spfSuccessRatio'),
    dkimSuccessRatio: avgOrNull('dkimSuccessRatio'),
    dmarcSuccessRatio: avgOrNull('dmarcSuccessRatio'),
    dataPoints: stats.length,
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
    verifiedDomain,
  };
}
