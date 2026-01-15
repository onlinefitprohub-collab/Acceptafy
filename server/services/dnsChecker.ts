import dns from 'dns';
import { promisify } from 'util';

const dnsResolveTxt = promisify(dns.resolveTxt);
const dnsResolveMx = promisify(dns.resolveMx);
const dnsResolve4 = promisify(dns.resolve4);

export interface DnsRecord {
  type: 'SPF' | 'DKIM' | 'DMARC' | 'MX' | 'A';
  found: boolean;
  value?: string;
  status: 'valid' | 'warning' | 'missing' | 'invalid';
  feedback: string;
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
  
  if (score >= 80) {
    overallStatus = 'ready';
    warmupIntensity = 'standard';
    summary = 'Your domain has good email authentication. You can proceed with a standard warm-up plan.';
  } else if (score >= 50) {
    overallStatus = 'needs_work';
    warmupIntensity = 'conservative';
    summary = 'Your domain has some authentication gaps. We recommend a conservative warm-up approach while you address the issues.';
  } else {
    overallStatus = 'critical';
    warmupIntensity = 'conservative';
    summary = 'Your domain has significant authentication issues that should be fixed before sending. Use a very conservative warm-up approach.';
  }
  
  return {
    domain,
    checkedAt: new Date().toISOString(),
    records,
    overallScore: Math.max(0, score),
    overallStatus,
    summary,
    recommendations,
    warmupIntensity
  };
}
