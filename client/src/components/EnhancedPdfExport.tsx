import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Loader2 } from 'lucide-react';
import type { GradingResult, HistoryItem, SpamTrigger } from '../types';

interface AgencyBranding {
  agencyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  footerText?: string;
  introText?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
}

interface EnhancedPdfExportProps {
  analysisResult: GradingResult;
  hasWhitelabelReports: boolean;
  previousResult?: GradingResult | null;
  emailContent?: {
    subject: string;
    previewText: string;
    body: string;
  };
}

function generateRadarChartSvg(scores: { label: string; value: number; max: number }[], primaryColor: string): string {
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 120;
  const numPoints = scores.length;
  const angleStep = (2 * Math.PI) / numPoints;
  
  const gridLines: string[] = [];
  [0.25, 0.5, 0.75, 1].forEach(scale => {
    const radius = maxRadius * scale;
    const points = scores.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      return `${centerX + radius * Math.cos(angle)},${centerY + radius * Math.sin(angle)}`;
    }).join(' ');
    gridLines.push(`<polygon points="${points}" fill="none" stroke="#e5e7eb" stroke-width="1"/>`);
  });
  
  const axisLines = scores.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = centerX + maxRadius * Math.cos(angle);
    const y = centerY + maxRadius * Math.sin(angle);
    return `<line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`;
  }).join('');
  
  const dataPoints = scores.map((s, i) => {
    const normalizedValue = s.value / s.max;
    const radius = maxRadius * normalizedValue;
    const angle = i * angleStep - Math.PI / 2;
    return `${centerX + radius * Math.cos(angle)},${centerY + radius * Math.sin(angle)}`;
  }).join(' ');
  
  const labels = scores.map((s, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const labelRadius = maxRadius + 25;
    const x = centerX + labelRadius * Math.cos(angle);
    const y = centerY + labelRadius * Math.sin(angle);
    const textAnchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
    return `<text x="${x}" y="${y}" text-anchor="${textAnchor}" font-size="11" fill="#374151">${s.label}</text>
            <text x="${x}" y="${y + 14}" text-anchor="${textAnchor}" font-size="10" font-weight="600" fill="${primaryColor}">${Math.round(s.value)}%</text>`;
  }).join('');
  
  return `
    <svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      ${gridLines.join('')}
      ${axisLines}
      <polygon points="${dataPoints}" fill="${primaryColor}22" stroke="${primaryColor}" stroke-width="2"/>
      ${labels}
    </svg>
  `;
}

function generateBarChartSvg(items: { label: string; value: number; color: string }[], title: string): string {
  const barHeight = 28;
  const gap = 8;
  const maxWidth = 200;
  const labelWidth = 80;
  const height = items.length * (barHeight + gap) + 40;
  
  const bars = items.map((item, i) => {
    const y = 30 + i * (barHeight + gap);
    const width = (item.value / 100) * maxWidth;
    return `
      <text x="0" y="${y + 18}" font-size="11" fill="#374151">${item.label}</text>
      <rect x="${labelWidth}" y="${y}" width="${maxWidth}" height="${barHeight}" fill="#f3f4f6" rx="4"/>
      <rect x="${labelWidth}" y="${y}" width="${width}" height="${barHeight}" fill="${item.color}" rx="4"/>
      <text x="${labelWidth + width + 8}" y="${y + 18}" font-size="11" font-weight="600" fill="#374151">${item.value}%</text>
    `;
  }).join('');
  
  return `
    <svg width="350" height="${height}" viewBox="0 0 350 ${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="16" font-size="13" font-weight="600" fill="#1f2937">${title}</text>
      ${bars}
    </svg>
  `;
}

function generateSpamSeverityChart(triggers: SpamTrigger[], primaryColor: string): string {
  const high = triggers.filter(t => t.severity === 'High').length;
  const medium = triggers.filter(t => t.severity === 'Medium').length;
  const low = triggers.filter(t => t.severity === 'Low').length;
  const total = triggers.length || 1;
  
  const items = [
    { label: 'High Risk', value: Math.round((high / total) * 100), color: '#ef4444', count: high },
    { label: 'Medium Risk', value: Math.round((medium / total) * 100), color: '#f59e0b', count: medium },
    { label: 'Low Risk', value: Math.round((low / total) * 100), color: '#22c55e', count: low },
  ].filter(item => item.count > 0);
  
  if (items.length === 0) {
    return `
      <svg width="350" height="60" viewBox="0 0 350 60" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="16" font-size="13" font-weight="600" fill="#1f2937">Spam Trigger Severity</text>
        <text x="0" y="45" font-size="12" fill="#22c55e">No spam triggers detected</text>
      </svg>
    `;
  }
  
  const barHeight = 24;
  const gap = 6;
  const maxWidth = 180;
  const labelWidth = 90;
  const height = items.length * (barHeight + gap) + 40;
  
  const bars = items.map((item, i) => {
    const y = 30 + i * (barHeight + gap);
    const width = (item.value / 100) * maxWidth;
    return `
      <text x="0" y="${y + 16}" font-size="11" fill="#374151">${item.label}</text>
      <rect x="${labelWidth}" y="${y}" width="${maxWidth}" height="${barHeight}" fill="#f3f4f6" rx="4"/>
      <rect x="${labelWidth}" y="${y}" width="${width}" height="${barHeight}" fill="${item.color}" rx="4"/>
      <text x="${labelWidth + maxWidth + 8}" y="${y + 16}" font-size="11" font-weight="600" fill="#374151">${item.count}</text>
    `;
  }).join('');
  
  return `
    <svg width="350" height="${height}" viewBox="0 0 350 ${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="16" font-size="13" font-weight="600" fill="#1f2937">Spam Trigger Severity</text>
      ${bars}
    </svg>
  `;
}

function generateComparisonChart(previous: number, current: number, label: string, primaryColor: string): string {
  const diff = current - previous;
  const isImproved = diff > 0;
  const diffColor = isImproved ? '#22c55e' : diff < 0 ? '#ef4444' : '#6b7280';
  const arrow = isImproved ? '&#9650;' : diff < 0 ? '&#9660;' : '&#8212;';
  
  return `
    <svg width="200" height="100" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
      <text x="100" y="16" text-anchor="middle" font-size="12" fill="#6b7280">${label}</text>
      <text x="40" y="55" text-anchor="middle" font-size="24" fill="#9ca3af">${previous}</text>
      <text x="100" y="55" text-anchor="middle" font-size="18" fill="#6b7280">→</text>
      <text x="160" y="55" text-anchor="middle" font-size="28" font-weight="bold" fill="${primaryColor}">${current}</text>
      <text x="100" y="85" text-anchor="middle" font-size="14" font-weight="600" fill="${diffColor}">${arrow} ${Math.abs(diff)} points</text>
    </svg>
  `;
}

function getGradeScore(grade: string): number {
  const gradeMap: Record<string, number> = {
    'A+': 97, 'A': 93, 'A-': 90,
    'B+': 87, 'B': 83, 'B-': 80,
    'C+': 77, 'C': 73, 'C-': 70,
    'D+': 67, 'D': 63, 'D-': 60,
    'F': 50
  };
  return gradeMap[grade] || 70;
}

function generateEnhancedPdfHtml(
  result: GradingResult,
  branding: AgencyBranding | null,
  hasWhitelabelReports: boolean,
  agencyNotes: string,
  previousResult?: GradingResult | null,
  emailContent?: { subject: string; previewText: string; body: string }
): string {
  const primaryColor = branding?.primaryColor || '#a855f7';
  const secondaryColor = branding?.secondaryColor || '#ec4899';
  
  const headerHtml = hasWhitelabelReports && branding ? `
    <div style="text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid ${primaryColor}20;">
      ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="${branding.agencyName || 'Agency'}" style="max-height: 60px; max-width: 200px; margin-bottom: 12px;" />` : ''}
      ${branding.agencyName ? `<h1 style="font-size: 24px; font-weight: bold; color: ${primaryColor}; margin: 0;">${branding.agencyName}</h1>` : ''}
      <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Email Marketing Analysis Report</p>
    </div>
    ${branding.introText ? `<div style="background: ${primaryColor}08; border-left: 4px solid ${primaryColor}; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;"><p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">${branding.introText}</p></div>` : ''}
  ` : `
    <div style="text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
      <div style="display: inline-flex; align-items: center; gap: 12px;">
        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); border-radius: 10px;"></div>
        <span style="font-size: 24px; font-weight: bold; color: #1f2937;">Acceptafy</span>
      </div>
      <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Email Marketing Analysis Report</p>
    </div>
  `;
  
  const score = result.inboxPlacementScore?.score || 0;
  const grade = result.overallGrade?.grade || 'N/A';
  const gradeColor = getGradeScore(grade) >= 80 ? '#22c55e' : getGradeScore(grade) >= 60 ? '#f59e0b' : '#ef4444';
  
  const executiveSummaryHtml = `
    <div style="background: linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}10); border-radius: 16px; padding: 32px; margin-bottom: 32px; page-break-inside: avoid;">
      <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 0.5px;">Executive Summary</h2>
      <div style="display: flex; justify-content: center; gap: 48px; align-items: center; margin-bottom: 24px;">
        <div style="text-align: center;">
          <div style="font-size: 72px; font-weight: bold; color: ${primaryColor}; line-height: 1;">${score}</div>
          <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Inbox Score</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 72px; font-weight: bold; color: ${gradeColor}; line-height: 1;">${grade}</div>
          <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Overall Grade</div>
        </div>
      </div>
      <p style="text-align: center; color: #374151; font-size: 15px; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        ${result.overallGrade?.summary || 'This email has been analyzed across multiple dimensions including deliverability, engagement potential, and spam risk.'}
      </p>
    </div>
  `;
  
  const radarScores = [
    { label: 'Subject', value: getGradeScore(result.subjectLine?.grade || 'C'), max: 100 },
    { label: 'Preview', value: getGradeScore(result.previewText?.grade || 'C'), max: 100 },
    { label: 'Body', value: getGradeScore(result.bodyCopy?.grade || 'C'), max: 100 },
    { label: 'CTA', value: getGradeScore(result.callToAction?.grade || 'C'), max: 100 },
    { label: 'Personal', value: result.personalizationScore?.score || 50, max: 100 },
    { label: 'Reply', value: result.replyAbilityAnalysis?.score || 50, max: 100 },
  ];
  
  const benchmarkChartHtml = `
    <div style="page-break-inside: avoid; margin-bottom: 32px;">
      <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 0.5px;">Performance Breakdown</h2>
      <div style="display: flex; justify-content: center;">
        ${generateRadarChartSvg(radarScores, primaryColor)}
      </div>
    </div>
  `;
  
  const spamTriggers = result.spamAnalysis || [];
  const spamChartHtml = `
    <div style="page-break-inside: avoid; margin-bottom: 32px;">
      ${generateSpamSeverityChart(spamTriggers, primaryColor)}
      ${spamTriggers.length > 0 ? `
        <div style="margin-top: 16px;">
          <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">Detected triggers:</p>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${spamTriggers.slice(0, 8).map(t => `
              <span style="background: ${t.severity === 'High' ? '#fef2f2' : t.severity === 'Medium' ? '#fefce8' : '#f0fdf4'}; 
                          color: ${t.severity === 'High' ? '#dc2626' : t.severity === 'Medium' ? '#ca8a04' : '#16a34a'}; 
                          padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 500;">
                ${t.word}
              </span>
            `).join('')}
            ${spamTriggers.length > 8 ? `<span style="color: #6b7280; font-size: 11px; padding: 4px;">+${spamTriggers.length - 8} more</span>` : ''}
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  const inboxPrediction = result.inboxPlacementPrediction;
  const engagementPredictionsHtml = inboxPrediction ? `
    <div style="page-break-inside: avoid; margin-bottom: 32px;">
      <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 0.5px;">Inbox Placement Predictions</h2>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 8px;">📧</div>
          <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">Gmail</div>
          <div style="font-size: 14px; color: ${inboxPrediction.gmail?.placement === 'Primary' ? '#22c55e' : inboxPrediction.gmail?.placement === 'Spam' ? '#ef4444' : '#f59e0b'}; font-weight: 600;">
            ${inboxPrediction.gmail?.placement || 'Unknown'}
          </div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${inboxPrediction.gmail?.reason || ''}</div>
        </div>
        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 8px;">📬</div>
          <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">Outlook</div>
          <div style="font-size: 14px; color: ${inboxPrediction.outlook?.placement === 'Focused' ? '#22c55e' : inboxPrediction.outlook?.placement === 'Junk' ? '#ef4444' : '#f59e0b'}; font-weight: 600;">
            ${inboxPrediction.outlook?.placement || 'Unknown'}
          </div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${inboxPrediction.outlook?.reason || ''}</div>
        </div>
        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 8px;">🍎</div>
          <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">Apple Mail</div>
          <div style="font-size: 14px; color: ${inboxPrediction.appleMail?.placement === 'Inbox' ? '#22c55e' : '#ef4444'}; font-weight: 600;">
            ${inboxPrediction.appleMail?.placement || 'Unknown'}
          </div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${inboxPrediction.appleMail?.reason || ''}</div>
        </div>
      </div>
    </div>
  ` : '';
  
  const beforeAfterHtml = previousResult ? `
    <div style="page-break-inside: avoid; margin-bottom: 32px;">
      <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 0.5px;">Progress Comparison</h2>
      <div style="display: flex; justify-content: center; gap: 32px;">
        ${generateComparisonChart(previousResult.inboxPlacementScore?.score || 0, score, 'Inbox Score', primaryColor)}
      </div>
      <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 16px;">Compared to your previous analysis</p>
    </div>
  ` : '';
  
  const detailedAnalysisHtml = `
    <div style="page-break-before: always; page-break-inside: avoid;">
      <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 0.5px;">Detailed Analysis</h2>
      
      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="font-size: 15px; font-weight: 600; color: #374151; margin: 0;">Subject Line</h3>
          <span style="background: ${getGradeScore(result.subjectLine?.grade || 'C') >= 80 ? '#dcfce7' : getGradeScore(result.subjectLine?.grade || 'C') >= 60 ? '#fef3c7' : '#fee2e2'}; 
                 color: ${getGradeScore(result.subjectLine?.grade || 'C') >= 80 ? '#166534' : getGradeScore(result.subjectLine?.grade || 'C') >= 60 ? '#92400e' : '#991b1b'};
                 padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">
            ${result.subjectLine?.grade || 'N/A'}
          </span>
        </div>
        <p style="color: #374151; font-size: 13px; margin: 0; line-height: 1.5;">${result.subjectLine?.summary || 'No analysis available'}</p>
      </div>
      
      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="font-size: 15px; font-weight: 600; color: #374151; margin: 0;">Preview Text</h3>
          <span style="background: ${getGradeScore(result.previewText?.grade || 'C') >= 80 ? '#dcfce7' : getGradeScore(result.previewText?.grade || 'C') >= 60 ? '#fef3c7' : '#fee2e2'}; 
                 color: ${getGradeScore(result.previewText?.grade || 'C') >= 80 ? '#166534' : getGradeScore(result.previewText?.grade || 'C') >= 60 ? '#92400e' : '#991b1b'};
                 padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">
            ${result.previewText?.grade || 'N/A'}
          </span>
        </div>
        <p style="color: #374151; font-size: 13px; margin: 0; line-height: 1.5;">${result.previewText?.summary || 'No analysis available'}</p>
      </div>
      
      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="font-size: 15px; font-weight: 600; color: #374151; margin: 0;">Body Copy</h3>
          <span style="background: ${getGradeScore(result.bodyCopy?.grade || 'C') >= 80 ? '#dcfce7' : getGradeScore(result.bodyCopy?.grade || 'C') >= 60 ? '#fef3c7' : '#fee2e2'}; 
                 color: ${getGradeScore(result.bodyCopy?.grade || 'C') >= 80 ? '#166534' : getGradeScore(result.bodyCopy?.grade || 'C') >= 60 ? '#92400e' : '#991b1b'};
                 padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">
            ${result.bodyCopy?.grade || 'N/A'}
          </span>
        </div>
        <p style="color: #374151; font-size: 13px; margin: 0; line-height: 1.5;">${result.bodyCopy?.summary || 'No analysis available'}</p>
      </div>
      
      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="font-size: 15px; font-weight: 600; color: #374151; margin: 0;">Call to Action</h3>
          <span style="background: ${getGradeScore(result.callToAction?.grade || 'C') >= 80 ? '#dcfce7' : getGradeScore(result.callToAction?.grade || 'C') >= 60 ? '#fef3c7' : '#fee2e2'}; 
                 color: ${getGradeScore(result.callToAction?.grade || 'C') >= 80 ? '#166534' : getGradeScore(result.callToAction?.grade || 'C') >= 60 ? '#92400e' : '#991b1b'};
                 padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">
            ${result.callToAction?.grade || 'N/A'}
          </span>
        </div>
        <p style="color: #374151; font-size: 13px; margin: 0; line-height: 1.5;">${result.callToAction?.summary || 'No analysis available'}</p>
      </div>
    </div>
  `;
  
  const allFeedback = [
    ...(result.subjectLine?.feedback || []),
    ...(result.previewText?.feedback || []),
    ...(result.bodyCopy?.feedback || []),
    ...(result.callToAction?.feedback || []),
  ].slice(0, 8);
  
  const recommendationsHtml = allFeedback.length > 0 ? `
    <div style="page-break-inside: avoid; margin-bottom: 32px;">
      <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 0.5px;">Key Recommendations</h2>
      <div style="background: ${primaryColor}08; border-radius: 12px; padding: 20px;">
        ${allFeedback.map((fb, i) => `
          <div style="display: flex; gap: 12px; ${i < allFeedback.length - 1 ? 'margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;' : ''}">
            <div style="flex-shrink: 0; width: 24px; height: 24px; background: ${primaryColor}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;">${i + 1}</div>
            <p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.5;">${fb}</p>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';
  
  const agencyNotesHtml = agencyNotes.trim() ? `
    <div style="page-break-inside: avoid; margin-bottom: 32px;">
      <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 0.5px;">Analyst Notes</h2>
      <div style="background: ${primaryColor}05; border: 1px solid ${primaryColor}20; border-radius: 12px; padding: 20px;">
        <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${agencyNotes}</p>
      </div>
    </div>
  ` : '';
  
  const footerHtml = hasWhitelabelReports && branding ? `
    <div style="margin-top: 48px; padding-top: 24px; border-top: 2px solid ${primaryColor}20; text-align: center;">
      ${branding.footerText ? `<p style="color: #6b7280; font-size: 13px; margin-bottom: 12px;">${branding.footerText}</p>` : ''}
      <div style="display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; font-size: 12px; color: #9ca3af;">
        ${branding.contactEmail ? `<span>${branding.contactEmail}</span>` : ''}
        ${branding.contactPhone ? `<span>${branding.contactPhone}</span>` : ''}
        ${branding.website ? `<span>${branding.website}</span>` : ''}
      </div>
      <p style="color: #9ca3af; font-size: 11px; margin-top: 16px;">Generated on ${new Date().toLocaleDateString()}</p>
    </div>
  ` : `
    <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="color: #9ca3af; font-size: 12px;">Generated on ${new Date().toLocaleDateString()} | Powered by Acceptafy</p>
    </div>
  `;
  
  return `<!DOCTYPE html>
<html>
<head>
  <title>Email Analysis Report</title>
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 40px; 
      color: #1f2937;
      line-height: 1.5;
    }
    @media print { 
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  ${headerHtml}
  ${executiveSummaryHtml}
  ${benchmarkChartHtml}
  ${engagementPredictionsHtml}
  ${spamChartHtml}
  ${beforeAfterHtml}
  ${detailedAnalysisHtml}
  ${recommendationsHtml}
  ${agencyNotesHtml}
  ${footerHtml}
</body>
</html>`;
}

export function EnhancedPdfExport({ 
  analysisResult, 
  hasWhitelabelReports, 
  previousResult,
  emailContent 
}: EnhancedPdfExportProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agencyNotes, setAgencyNotes] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  const { data: branding, isLoading: isBrandingLoading } = useQuery<AgencyBranding>({
    queryKey: ['/api/agency-branding'],
    enabled: hasWhitelabelReports && isModalOpen,
  });
  
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const html = generateEnhancedPdfHtml(
        analysisResult,
        hasWhitelabelReports ? (branding || null) : null,
        hasWhitelabelReports,
        agencyNotes,
        previousResult,
        emailContent
      );
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to export the PDF report.');
        return;
      }
      
      printWindow.document.write(html);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } finally {
      setIsExporting(false);
      setIsModalOpen(false);
      setAgencyNotes('');
    }
  };
  
  const handleQuickExport = () => {
    if (hasWhitelabelReports) {
      setIsModalOpen(true);
    } else {
      const html = generateEnhancedPdfHtml(
        analysisResult,
        null,
        false,
        '',
        previousResult,
        emailContent
      );
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to export the PDF report.');
        return;
      }
      
      printWindow.document.write(html);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };
  
  return (
    <>
      <Button 
        onClick={handleQuickExport}
        variant="outline"
        size="sm"
        data-testid="button-export-pdf"
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        Export PDF
      </Button>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Export Report
            </DialogTitle>
            <DialogDescription>
              Add custom notes to your branded report before exporting.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="agency-notes">Analyst Notes (Optional)</Label>
              <Textarea
                id="agency-notes"
                data-testid="input-agency-notes"
                placeholder="Add any custom commentary, recommendations, or context for your client..."
                value={agencyNotes}
                onChange={(e) => setAgencyNotes(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                These notes will appear in a dedicated section of the report.
              </p>
            </div>
            
            {isBrandingLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading your branding...
              </div>
            )}
            
            {branding && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">
                  {branding.agencyName || 'Your Agency'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Report will use your custom branding
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || isBrandingLoading}
              data-testid="button-confirm-export"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
