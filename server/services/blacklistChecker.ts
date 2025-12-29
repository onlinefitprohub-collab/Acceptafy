import dns from 'dns';
import { promisify } from 'util';
import type { BlacklistResult, BlacklistCheckResponse } from '@shared/schema';

const dnsResolve4 = promisify(dns.resolve4);

export interface BlacklistInfo {
  zone: string;
  name: string;
  description: string;
  delistUrl?: string;
  type: 'ip' | 'domain' | 'both';
}

export const BLACKLISTS: BlacklistInfo[] = [
  { zone: 'zen.spamhaus.org', name: 'Spamhaus ZEN', description: 'Combined Spamhaus blocklist (SBL, XBL, PBL)', delistUrl: 'https://www.spamhaus.org/lookup/', type: 'ip' },
  { zone: 'sbl.spamhaus.org', name: 'Spamhaus SBL', description: 'Spamhaus Block List', delistUrl: 'https://www.spamhaus.org/lookup/', type: 'ip' },
  { zone: 'xbl.spamhaus.org', name: 'Spamhaus XBL', description: 'Exploits Block List', delistUrl: 'https://www.spamhaus.org/lookup/', type: 'ip' },
  { zone: 'pbl.spamhaus.org', name: 'Spamhaus PBL', description: 'Policy Block List', delistUrl: 'https://www.spamhaus.org/lookup/', type: 'ip' },
  { zone: 'dbl.spamhaus.org', name: 'Spamhaus DBL', description: 'Domain Block List', delistUrl: 'https://www.spamhaus.org/lookup/', type: 'domain' },
  { zone: 'b.barracudacentral.org', name: 'Barracuda', description: 'Barracuda Reputation Block List', delistUrl: 'https://www.barracudacentral.org/rbl/removal-request', type: 'ip' },
  { zone: 'bl.spamcop.net', name: 'SpamCop', description: 'SpamCop Blocking List', delistUrl: 'https://www.spamcop.net/bl.shtml', type: 'ip' },
  { zone: 'dnsbl.sorbs.net', name: 'SORBS', description: 'SORBS DNSBL', delistUrl: 'http://www.sorbs.net/overview.shtml', type: 'ip' },
  { zone: 'spam.dnsbl.sorbs.net', name: 'SORBS Spam', description: 'SORBS Spam list', delistUrl: 'http://www.sorbs.net/overview.shtml', type: 'ip' },
  { zone: 'cbl.abuseat.org', name: 'Abuseat CBL', description: 'Composite Blocking List', delistUrl: 'https://www.abuseat.org/lookup.cgi', type: 'ip' },
  { zone: 'psbl.surriel.com', name: 'PSBL', description: 'Passive Spam Block List', delistUrl: 'https://psbl.org/', type: 'ip' },
  { zone: 'dnsbl-1.uceprotect.net', name: 'UCEPROTECT L1', description: 'UCEPROTECT Level 1', delistUrl: 'https://www.uceprotect.net/en/index.php', type: 'ip' },
  { zone: 'dnsbl-2.uceprotect.net', name: 'UCEPROTECT L2', description: 'UCEPROTECT Level 2', delistUrl: 'https://www.uceprotect.net/en/index.php', type: 'ip' },
  { zone: 'dnsbl-3.uceprotect.net', name: 'UCEPROTECT L3', description: 'UCEPROTECT Level 3', delistUrl: 'https://www.uceprotect.net/en/index.php', type: 'ip' },
  { zone: 'all.s5h.net', name: 'S5H', description: 'S5H Blacklist', delistUrl: 'http://www.s5h.net/', type: 'ip' },
  { zone: 'hostkarma.junkemailfilter.com', name: 'HostKarma', description: 'Junk Email Filter', delistUrl: 'http://wiki.junkemailfilter.com/index.php/Main_Page', type: 'ip' },
  { zone: 'z.mailspike.net', name: 'Mailspike Z', description: 'Mailspike reputation', delistUrl: 'https://www.mailspike.org/', type: 'ip' },
  { zone: 'bl.mailspike.net', name: 'Mailspike BL', description: 'Mailspike blocklist', delistUrl: 'https://www.mailspike.org/', type: 'ip' },
  { zone: 'black.junkemailfilter.com', name: 'JunkEmailFilter', description: 'Junk Email Filter Black', delistUrl: 'http://wiki.junkemailfilter.com/index.php/Main_Page', type: 'ip' },
  { zone: 'truncate.gbudb.net', name: 'GBUDB', description: 'Truncate GBUDB', delistUrl: 'https://gbudb.com/', type: 'ip' },
  { zone: 'wl.mailspike.net', name: 'Mailspike WL', description: 'Mailspike whitelist', delistUrl: 'https://www.mailspike.org/', type: 'ip' },
  { zone: 'spam.spamrats.com', name: 'SpamRats SPAM', description: 'SpamRats spam list', delistUrl: 'https://www.spamrats.com/', type: 'ip' },
  { zone: 'noptr.spamrats.com', name: 'SpamRats NOPTR', description: 'SpamRats no-PTR list', delistUrl: 'https://www.spamrats.com/', type: 'ip' },
  { zone: 'dyna.spamrats.com', name: 'SpamRats DYNA', description: 'SpamRats dynamic list', delistUrl: 'https://www.spamrats.com/', type: 'ip' },
  { zone: 'multi.surbl.org', name: 'SURBL', description: 'SURBL URI blacklist', delistUrl: 'http://www.surbl.org/surbl-analysis', type: 'domain' },
  { zone: 'uribl.spameatingmonkey.net', name: 'SpamEatingMonkey URI', description: 'URI blacklist', delistUrl: 'https://spameatingmonkey.com/', type: 'domain' },
  { zone: 'fresh.spameatingmonkey.net', name: 'SpamEatingMonkey Fresh', description: 'Fresh domains', delistUrl: 'https://spameatingmonkey.com/', type: 'domain' },
];

function reverseIP(ip: string): string {
  return ip.split('.').reverse().join('.');
}

function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return false;
  const parts = ip.split('.').map(Number);
  return parts.every(p => p >= 0 && p <= 255);
}

function isValidDomain(domain: string): boolean {
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

async function checkBlacklist(target: string, blacklist: BlacklistInfo, isIP: boolean): Promise<BlacklistResult> {
  const query = isIP ? `${reverseIP(target)}.${blacklist.zone}` : `${target}.${blacklist.zone}`;
  
  try {
    await dnsResolve4(query);
    return {
      blacklist: blacklist.zone,
      name: blacklist.name,
      listed: true,
      delistUrl: blacklist.delistUrl,
    };
  } catch (error: any) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return {
        blacklist: blacklist.zone,
        name: blacklist.name,
        listed: false,
      };
    }
    return {
      blacklist: blacklist.zone,
      name: blacklist.name,
      listed: false,
      error: error.code || 'Unknown error',
    };
  }
}

export async function checkBlacklists(target: string): Promise<BlacklistCheckResponse> {
  const isIP = isValidIP(target);
  const isDomain = isValidDomain(target);
  
  if (!isIP && !isDomain) {
    throw new Error('Invalid IP address or domain name');
  }
  
  const applicableBlacklists = BLACKLISTS.filter(bl => {
    if (isIP) return bl.type === 'ip' || bl.type === 'both';
    return bl.type === 'domain' || bl.type === 'both';
  });
  
  const results = await Promise.allSettled(
    applicableBlacklists.map(bl => checkBlacklist(target, bl, isIP))
  );
  
  const blacklistResults: BlacklistResult[] = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      blacklist: applicableBlacklists[index].zone,
      name: applicableBlacklists[index].name,
      listed: false,
      error: 'Check failed',
    };
  });
  
  const listedOn = blacklistResults.filter(r => r.listed).length;
  const cleanOn = blacklistResults.filter(r => !r.listed && !r.error).length;
  
  return {
    domain: target,
    type: isIP ? 'ip' : 'domain',
    checkedAt: new Date().toISOString(),
    totalBlacklists: applicableBlacklists.length,
    listedOn,
    cleanOn,
    status: listedOn > 0 ? 'listed' : 'clean',
    results: blacklistResults.sort((a, b) => {
      if (a.listed && !b.listed) return -1;
      if (!a.listed && b.listed) return 1;
      return a.name.localeCompare(b.name);
    }),
  };
}

export function getDelistingGuidance(blacklistZone: string): { steps: string[]; timeframe: string; notes: string } | null {
  const guidance: Record<string, { steps: string[]; timeframe: string; notes: string }> = {
    'zen.spamhaus.org': {
      steps: [
        'Visit https://www.spamhaus.org/lookup/ and enter your IP',
        'Follow the removal request link provided',
        'Complete the removal request form with accurate information',
        'Fix the underlying issue that caused the listing before requesting removal'
      ],
      timeframe: '24-48 hours after approval',
      notes: 'Spamhaus requires you to identify and fix the spam source before removal.'
    },
    'b.barracudacentral.org': {
      steps: [
        'Go to https://www.barracudacentral.org/lookups and check your IP',
        'Register for a free Barracuda Central account',
        'Submit a removal request from the lookup results',
        'Ensure your IP has valid reverse DNS (PTR record)'
      ],
      timeframe: '12-24 hours',
      notes: 'Barracuda typically auto-delists after 12 hours if spam stops.'
    },
    'bl.spamcop.net': {
      steps: [
        'Visit https://www.spamcop.net/bl.shtml and check your IP',
        'SpamCop listings expire automatically after 24-48 hours',
        'Identify the source of spam complaints and stop it',
        'Consider setting up feedback loops with major ISPs'
      ],
      timeframe: 'Auto-expires in 24-48 hours',
      notes: 'SpamCop is automated - stop the spam and it will auto-delist.'
    },
    'dnsbl.sorbs.net': {
      steps: [
        'Visit http://www.sorbs.net/lookup.shtml and check your listing',
        'Identify which SORBS zone you are listed in',
        'Follow the specific removal process for that zone',
        'Some zones require a small donation for removal'
      ],
      timeframe: 'Varies by zone, 24-72 hours',
      notes: 'SORBS has multiple zones with different policies.'
    },
    'cbl.abuseat.org': {
      steps: [
        'Go to https://www.abuseat.org/lookup.cgi and enter your IP',
        'Review the detailed explanation of why you were listed',
        'Fix the malware, virus, or spam issue on your network',
        'Use the self-service removal once the issue is fixed'
      ],
      timeframe: 'Immediate to 24 hours',
      notes: 'CBL listings are usually due to infected machines or open proxies.'
    },
    'dbl.spamhaus.org': {
      steps: [
        'Check your domain at https://www.spamhaus.org/lookup/',
        'Review why your domain was listed',
        'Ensure your domain is not being used in spam campaigns',
        'Submit a removal request if the issue is resolved'
      ],
      timeframe: '24-72 hours',
      notes: 'DBL is for domain reputation. Check all DNS records and email practices.'
    },
    'multi.surbl.org': {
      steps: [
        'Check your domain at http://www.surbl.org/surbl-analysis',
        'Identify which SURBL list you appear on',
        'Ensure your domain is not in spam links',
        'Request removal through the SURBL website'
      ],
      timeframe: '24-48 hours',
      notes: 'SURBL tracks domains found in spam message bodies/links.'
    },
  };
  
  return guidance[blacklistZone] || {
    steps: [
      'Visit the blacklist\'s official website',
      'Look up your IP or domain',
      'Follow their removal/delisting process',
      'Fix the underlying issue before requesting removal'
    ],
    timeframe: '24-72 hours (varies by provider)',
    notes: 'Each blacklist has its own removal process. Check their documentation.'
  };
}
