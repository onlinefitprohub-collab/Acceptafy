import type { DomainHealth, ListQualityAnalysis, BimiRecord, GlossaryTerm, SentenceGrade } from '../types';

export async function rewriteSentence(sentence: string): Promise<string> {
    const response = await fetch('/api/sentence/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence })
    });
    
    if (!response.ok) {
        throw new Error('Failed to rewrite sentence');
    }
    
    const data = await response.json();
    return data.rewritten;
}

export async function gradeSentence(sentence: string): Promise<SentenceGrade> {
    const response = await fetch('/api/sentence/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence })
    });
    
    if (!response.ok) {
        throw new Error('Failed to grade sentence');
    }
    
    return response.json();
}

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

export async function analyzeEmailList(sample: string): Promise<ListQualityAnalysis> {
    const response = await fetch('/api/list/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sample })
    });
    
    if (!response.ok) {
        throw new Error('Failed to analyze list quality');
    }
    
    return response.json();
}

export async function generateBimiRecord(domain: string): Promise<BimiRecord> {
    const response = await fetch('/api/bimi/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
    });
    
    if (!response.ok) {
        throw new Error('Failed to generate BIMI record');
    }
    
    return response.json();
}

export async function explainTerm(term: string): Promise<GlossaryTerm> {
    const response = await fetch('/api/glossary/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term })
    });
    
    if (!response.ok) {
        throw new Error('Failed to explain term');
    }
    
    return response.json();
}
