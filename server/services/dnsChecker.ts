import dns from 'dns';
import { promisify } from 'util';

const dnsResolveTxt = promisify(dns.resolveTxt);
const dnsResolveMx = promisify(dns.resolveMx);
const dnsResolve4 = promisify(dns.resolve4);

// Comprehensive list of multi-part public suffixes
// This covers common second-level domains where the registrable domain is name.suffix
const MULTI_PART_SUFFIXES = [
  // UK
  'co.uk', 'org.uk', 'net.uk', 'gov.uk', 'ac.uk', 'me.uk', 'ltd.uk', 'plc.uk', 'sch.uk',
  // Australia
  'com.au', 'net.au', 'org.au', 'gov.au', 'edu.au', 'asn.au', 'id.au',
  // New Zealand
  'co.nz', 'net.nz', 'org.nz', 'govt.nz', 'ac.nz', 'school.nz',
  // Brazil
  'com.br', 'net.br', 'org.br', 'gov.br', 'edu.br',
  // Japan
  'co.jp', 'or.jp', 'ne.jp', 'ac.jp', 'go.jp', 'ed.jp',
  // India
  'co.in', 'net.in', 'org.in', 'gov.in', 'ac.in', 'edu.in', 'res.in',
  // Mexico
  'com.mx', 'net.mx', 'org.mx', 'gob.mx', 'edu.mx',
  // South Africa
  'co.za', 'net.za', 'org.za', 'gov.za', 'ac.za', 'edu.za',
  // South Korea
  'co.kr', 'or.kr', 'ne.kr', 'go.kr', 'ac.kr', 're.kr',
  // China
  'com.cn', 'net.cn', 'org.cn', 'gov.cn', 'edu.cn', 'ac.cn',
  // Hong Kong
  'com.hk', 'net.hk', 'org.hk', 'gov.hk', 'edu.hk',
  // Singapore
  'com.sg', 'net.sg', 'org.sg', 'gov.sg', 'edu.sg',
  // Other common ones
  'com.ar', 'com.co', 'com.tr', 'com.ua', 'com.tw', 'com.pl', 'com.my',
  'co.id', 'co.il', 'co.th', 'co.ke', 'co.tz',
  'org.il', 'ac.il', 'gov.il',
  'com.ng', 'com.eg', 'com.pk', 'com.bd', 'com.vn', 'com.ph',
];

function normalizeDomain(domain: string): string {
  // Remove trailing/leading dots, lowercase, trim whitespace, and collapse multiple dots
  return domain
    .toLowerCase()
    .trim()
    .replace(/\.+/g, '.') // Collapse multiple consecutive dots into one
    .replace(/^\.+/, '')  // Remove leading dots
    .replace(/\.+$/, ''); // Remove trailing dots
}

function isValidDomainPart(part: string): boolean {
  // Domain labels must be 1-63 chars, alphanumeric and hyphens, not start/end with hyphen
  if (part.length === 0 || part.length > 63) return false;
  if (part.startsWith('-') || part.endsWith('-')) return false;
  return /^[a-z0-9-]+$/.test(part);
}

function detectSubdomain(domain: string): { isSubdomain: boolean; parentDomain?: string; subdomain?: string } {
  const normalizedDomain = normalizeDomain(domain);
  const parts = normalizedDomain.split('.').filter(p => p.length > 0);
  
  // Validate domain parts
  if (!parts.every(isValidDomainPart)) {
    // Invalid domain, return false rather than potentially misclassifying
    return { isSubdomain: false };
  }
  
  // Need at least 2 parts for a valid domain
  if (parts.length < 2) {
    return { isSubdomain: false };
  }
  
  // Check for multi-part public suffixes first
  for (const suffix of MULTI_PART_SUFFIXES) {
    if (normalizedDomain.endsWith('.' + suffix) || normalizedDomain === suffix) {
      const suffixParts = suffix.split('.').length;
      // Domain must have at least suffix + registrable name + subdomain = suffixParts + 2
      if (parts.length > suffixParts + 1) {
        const parentDomain = parts.slice(-suffixParts - 1).join('.');
        const subdomain = parts.slice(0, -suffixParts - 1).join('.');
        return { isSubdomain: true, parentDomain, subdomain };
      }
      // This is a root domain under a multi-part suffix
      return { isSubdomain: false };
    }
  }
  
  // Standard TLD detection (e.g., .com, .org, .net, .io)
  // Domain with 3+ parts where last part is TLD = subdomain
  if (parts.length > 2) {
    const parentDomain = parts.slice(-2).join('.');
    const subdomain = parts.slice(0, -2).join('.');
    return { isSubdomain: true, parentDomain, subdomain };
  }
  
  return { isSubdomain: false };
}

async function checkParentDomainRecords(parentDomain: string): Promise<{ hasSPF: boolean; hasDMARC: boolean }> {
  let hasSPF = false;
  let hasDMARC = false;
  
  try {
    const spfRecords = await dnsResolveTxt(parentDomain);
    hasSPF = spfRecords.flat().some(r => r.startsWith('v=spf1'));
  } catch {}
  
  try {
    const dmarcRecords = await dnsResolveTxt(`_dmarc.${parentDomain}`);
    hasDMARC = dmarcRecords.flat().some(r => r.startsWith('v=DMARC1'));
  } catch {}
  
  return { hasSPF, hasDMARC };
}

export interface DnsRecord {
  type: 'SPF' | 'DKIM' | 'DMARC' | 'MX' | 'A';
  found: boolean;
  value?: string;
  status: 'valid' | 'warning' | 'missing' | 'invalid';
  feedback: string;
}

export interface SubdomainInfo {
  isSubdomain: boolean;
  parentDomain?: string;
  subdomain?: string;
  parentHasSPF?: boolean;
  parentHasDMARC?: boolean;
  recommendation?: string;
}

export interface DomainAnalysis {
  domain: string;
  checkedAt: string;
  records: DnsRecord[];
  overallScore: number;
  overallStatus: 'ready' | 'needs_work' | 'critical';
  summary: string;
  recommendations: string[];
  warmupIntensity: 'conservative' | 'standard' | 'aggressive';
  subdomainInfo?: SubdomainInfo;
}

async function checkSPF(domain: string): Promise<DnsRecord> {
  try {
    const records = await dnsResolveTxt(domain);
    const spfRecords = records.flat().filter(r => r.startsWith('v=spf1'));
    
    if (spfRecords.length === 0) {
      return {
        type: 'SPF',
        found: false,
        status: 'missing',
        feedback: 'No SPF record found. SPF helps receiving servers verify your sending IPs are authorized.'
      };
    }
    
    if (spfRecords.length > 1) {
      return {
        type: 'SPF',
        found: true,
        value: spfRecords[0],
        status: 'warning',
        feedback: 'Multiple SPF records found. Only one SPF record should exist per domain.'
      };
    }
    
    const spf = spfRecords[0];
    if (spf.includes('-all') || spf.includes('~all')) {
      return {
        type: 'SPF',
        found: true,
        value: spf,
        status: 'valid',
        feedback: 'SPF record is properly configured with a fail or softfail policy.'
      };
    } else if (spf.includes('+all')) {
      return {
        type: 'SPF',
        found: true,
        value: spf,
        status: 'invalid',
        feedback: 'SPF record uses +all which allows any server to send. This is insecure.'
      };
    } else {
      return {
        type: 'SPF',
        found: true,
        value: spf,
        status: 'warning',
        feedback: 'SPF record found but may need optimization. Consider adding -all or ~all.'
      };
    }
  } catch (error: any) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return {
        type: 'SPF',
        found: false,
        status: 'missing',
        feedback: 'No SPF record found. Add an SPF record to authorize your sending servers.'
      };
    }
    return {
      type: 'SPF',
      found: false,
      status: 'missing',
      feedback: `Could not check SPF: ${error.message}`
    };
  }
}

async function checkDKIM(domain: string): Promise<DnsRecord> {
  const commonSelectors = ['default', 'google', 'selector1', 'selector2', 'k1', 'mail', 'dkim', 's1', 's2'];
  
  for (const selector of commonSelectors) {
    try {
      const records = await dnsResolveTxt(`${selector}._domainkey.${domain}`);
      const dkimRecords = records.flat().filter(r => r.includes('v=DKIM1') || r.includes('p='));
      
      if (dkimRecords.length > 0) {
        return {
          type: 'DKIM',
          found: true,
          value: `${selector}._domainkey: ${dkimRecords[0].substring(0, 100)}...`,
          status: 'valid',
          feedback: `DKIM record found with selector "${selector}". Emails can be cryptographically signed.`
        };
      }
    } catch {
      continue;
    }
  }
  
  return {
    type: 'DKIM',
    found: false,
    status: 'warning',
    feedback: 'No DKIM record found with common selectors. DKIM helps verify email authenticity.'
  };
}

async function checkDMARC(domain: string): Promise<DnsRecord> {
  try {
    const records = await dnsResolveTxt(`_dmarc.${domain}`);
    const dmarcRecords = records.flat().filter(r => r.startsWith('v=DMARC1'));
    
    if (dmarcRecords.length === 0) {
      return {
        type: 'DMARC',
        found: false,
        status: 'missing',
        feedback: 'No DMARC record found. DMARC ties SPF and DKIM together and tells receivers what to do with failures.'
      };
    }
    
    const dmarc = dmarcRecords[0];
    if (dmarc.includes('p=reject') || dmarc.includes('p=quarantine')) {
      return {
        type: 'DMARC',
        found: true,
        value: dmarc,
        status: 'valid',
        feedback: 'DMARC record configured with enforcement policy. Great for deliverability.'
      };
    } else if (dmarc.includes('p=none')) {
      return {
        type: 'DMARC',
        found: true,
        value: dmarc,
        status: 'warning',
        feedback: 'DMARC is in monitoring mode (p=none). Consider upgrading to quarantine or reject after testing.'
      };
    }
    
    return {
      type: 'DMARC',
      found: true,
      value: dmarc,
      status: 'valid',
      feedback: 'DMARC record found.'
    };
  } catch (error: any) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return {
        type: 'DMARC',
        found: false,
        status: 'missing',
        feedback: 'No DMARC record found. Add a DMARC record to improve deliverability.'
      };
    }
    return {
      type: 'DMARC',
      found: false,
      status: 'missing',
      feedback: `Could not check DMARC: ${error.message}`
    };
  }
}

async function checkMX(domain: string): Promise<DnsRecord> {
  try {
    const records = await dnsResolveMx(domain);
    
    if (records.length === 0) {
      return {
        type: 'MX',
        found: false,
        status: 'missing',
        feedback: 'No MX records found. MX records are needed to receive email.'
      };
    }
    
    const sortedRecords = records.sort((a, b) => a.priority - b.priority);
    const primaryMx = sortedRecords[0].exchange;
    
    return {
      type: 'MX',
      found: true,
      value: sortedRecords.map(r => `${r.priority} ${r.exchange}`).join(', '),
      status: 'valid',
      feedback: `${records.length} MX record(s) found. Primary: ${primaryMx}`
    };
  } catch (error: any) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return {
        type: 'MX',
        found: false,
        status: 'warning',
        feedback: 'No MX records found. This may indicate a new or misconfigured domain.'
      };
    }
    return {
      type: 'MX',
      found: false,
      status: 'warning',
      feedback: `Could not check MX: ${error.message}`
    };
  }
}

async function checkARecord(domain: string): Promise<DnsRecord> {
  try {
    const records = await dnsResolve4(domain);
    
    if (records.length === 0) {
      return {
        type: 'A',
        found: false,
        status: 'warning',
        feedback: 'No A record found for domain.'
      };
    }
    
    return {
      type: 'A',
      found: true,
      value: records.join(', '),
      status: 'valid',
      feedback: `Domain resolves to ${records.length} IP address(es).`
    };
  } catch (error: any) {
    return {
      type: 'A',
      found: false,
      status: 'warning',
      feedback: 'Could not resolve domain IP address.'
    };
  }
}

export async function analyzeDomain(domain: string): Promise<DomainAnalysis> {
  // Check if this is a subdomain
  const subdomainDetection = detectSubdomain(domain);
  
  const [spf, dkim, dmarc, mx, aRecord] = await Promise.all([
    checkSPF(domain),
    checkDKIM(domain),
    checkDMARC(domain),
    checkMX(domain),
    checkARecord(domain)
  ]);
  
  const records = [spf, dkim, dmarc, mx, aRecord];
  
  let score = 100;
  const recommendations: string[] = [];
  
  // Check parent domain records if this is a subdomain
  let subdomainInfo: SubdomainInfo | undefined;
  if (subdomainDetection.isSubdomain && subdomainDetection.parentDomain) {
    const parentRecords = await checkParentDomainRecords(subdomainDetection.parentDomain);
    
    // Note: Parent domain authentication does NOT automatically apply to subdomains
    // SPF must be configured for each sending subdomain independently
    // DKIM selectors are typically subdomain-specific
    // Only DMARC with sp= policy applies to subdomains (but subdomain should still have its own)
    let recommendation: string;
    if (parentRecords.hasSPF && parentRecords.hasDMARC) {
      recommendation = `This is a subdomain of ${subdomainDetection.parentDomain}. Note: Parent domain's SPF and DKIM do NOT automatically cover this subdomain. You must configure SPF and DKIM specifically for ${subdomainDetection.subdomain}.${subdomainDetection.parentDomain}. The parent's DMARC may apply via the sp= subdomain policy, but having your own records is recommended.`;
    } else if (!parentRecords.hasSPF && !parentRecords.hasDMARC) {
      recommendation = `This is a subdomain of ${subdomainDetection.parentDomain}. The parent domain lacks email authentication. You must configure SPF, DKIM, and DMARC specifically for this subdomain to establish proper email authentication.`;
    } else {
      recommendation = `This is a subdomain of ${subdomainDetection.parentDomain}. The parent domain has partial email authentication. Important: Parent records do not automatically apply to subdomains. Configure complete SPF, DKIM, and DMARC records for this subdomain.`;
    }
    
    subdomainInfo = {
      isSubdomain: true,
      parentDomain: subdomainDetection.parentDomain,
      subdomain: subdomainDetection.subdomain,
      parentHasSPF: parentRecords.hasSPF,
      parentHasDMARC: parentRecords.hasDMARC,
      recommendation
    };
    
    // Add subdomain-specific recommendations
    recommendations.push(`Subdomain "${subdomainDetection.subdomain}" requires its own SPF, DKIM, and DMARC records - parent domain authentication does not automatically apply`);
    recommendations.push(`This subdomain will build sender reputation independently from ${subdomainDetection.parentDomain} - plan for a warmup period`);
  }
  
  if (spf.status === 'missing') {
    score -= 25;
    recommendations.push('Add an SPF record to authorize your email sending servers');
  } else if (spf.status === 'warning' || spf.status === 'invalid') {
    score -= 15;
    recommendations.push('Review and optimize your SPF record configuration');
  }
  
  if (dkim.status === 'missing' || dkim.status === 'warning') {
    score -= 20;
    recommendations.push('Configure DKIM signing to cryptographically verify your emails');
  }
  
  if (dmarc.status === 'missing') {
    score -= 20;
    recommendations.push('Add a DMARC record to improve deliverability and protect against spoofing');
  } else if (dmarc.status === 'warning') {
    score -= 10;
    recommendations.push('Consider upgrading DMARC policy from monitoring (p=none) to enforcement');
  }
  
  if (mx.status === 'missing') {
    score -= 10;
    recommendations.push('Configure MX records to receive email (important for reply handling)');
  }
  
  let overallStatus: 'ready' | 'needs_work' | 'critical';
  let warmupIntensity: 'conservative' | 'standard' | 'aggressive';
  let summary: string;
  
  // Subdomains should use conservative warmup since they start with no reputation
  const isNewSubdomain = subdomainInfo?.isSubdomain;
  
  if (score >= 80) {
    overallStatus = 'ready';
    warmupIntensity = isNewSubdomain ? 'conservative' : 'standard';
    summary = isNewSubdomain 
      ? `Your subdomain has good email authentication, but as a new sending subdomain, it has no reputation history. We recommend a conservative warm-up approach.`
      : 'Your domain has good email authentication. You can proceed with a standard warm-up plan.';
  } else if (score >= 50) {
    overallStatus = 'needs_work';
    warmupIntensity = 'conservative';
    summary = isNewSubdomain
      ? `Your subdomain has some authentication gaps. As a new subdomain with no reputation, use a conservative warm-up while addressing the issues.`
      : 'Your domain has some authentication gaps. We recommend a conservative warm-up approach while you address the issues.';
  } else {
    overallStatus = 'critical';
    warmupIntensity = 'conservative';
    summary = isNewSubdomain
      ? `Your subdomain has significant authentication issues. Fix these before sending, and remember this subdomain starts with no reputation.`
      : 'Your domain has significant authentication issues that should be fixed before sending. Use a very conservative warm-up approach.';
  }
  
  return {
    domain,
    checkedAt: new Date().toISOString(),
    records,
    overallScore: Math.max(0, score),
    overallStatus,
    summary,
    recommendations,
    warmupIntensity,
    subdomainInfo
  };
}
