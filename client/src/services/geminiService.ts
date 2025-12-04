import type { DomainHealth, ListQualityAnalysis } from '../types';

export async function checkDomainHealth(domain: string): Promise<DomainHealth> {
    const response = await fetch('/api/domain/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
    });
    
    if (!response.ok) {
        throw new Error('Failed to check domain health');
    }
    
    return response.json();
}

export async function analyzeListQuality(emails: string[]): Promise<ListQualityAnalysis> {
    const response = await fetch('/api/list/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails })
    });
    
    if (!response.ok) {
        throw new Error('Failed to analyze list quality');
    }
    
    return response.json();
}
