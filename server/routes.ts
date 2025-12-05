import type { Express } from "express";
import { createServer, type Server } from "http";
import { 
  gradeCopy, 
  rewriteCopy, 
  generateFollowUpEmail, 
  generateFollowUpSequence,
  generateDnsRecords,
  checkDomainHealth,
  analyzeEmailList,
  generateBimiRecord,
  explainTerm,
  generateSubjectVariations,
  generateOptimizationRoadmap,
  rewriteWithTone,
  generateEmailPreviews,
  generateWarmupPlan,
  checkSpamTriggers
} from "./gemini";
import { 
  generateVariationsRequestSchema,
  generateToneRewriteRequestSchema,
  generatePreviewRequestSchema,
  gradingResultSchema
} from "@shared/schema";
import { z } from "zod";

const generateRoadmapRequestSchema = z.object({
  analysisResult: gradingResultSchema,
  subject: z.string().default(''),
  body: z.string().default(''),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post('/api/grade', async (req, res) => {
    try {
      const { body, variations } = req.body;
      const result = await gradeCopy(body, variations);
      res.json(result);
    } catch (error) {
      console.error('Grading error:', error);
      res.status(500).json({ error: 'Failed to grade email' });
    }
  });

  app.post('/api/rewrite', async (req, res) => {
    try {
      const { body, subject, preview, goal } = req.body;
      const result = await rewriteCopy(body, subject, preview, goal);
      res.json(result);
    } catch (error) {
      console.error('Rewrite error:', error);
      res.status(500).json({ error: 'Failed to rewrite email' });
    }
  });

  app.post('/api/followup', async (req, res) => {
    try {
      const { original, analysis, goal, context } = req.body;
      const result = await generateFollowUpEmail(original, analysis, goal, context);
      res.json(result);
    } catch (error) {
      console.error('Follow-up error:', error);
      res.status(500).json({ error: 'Failed to generate follow-up' });
    }
  });

  app.post('/api/followup/sequence', async (req, res) => {
    try {
      const { original, analysis, goal } = req.body;
      const result = await generateFollowUpSequence(original, analysis, goal);
      res.json(result);
    } catch (error) {
      console.error('Sequence error:', error);
      res.status(500).json({ error: 'Failed to generate sequence' });
    }
  });

  app.post('/api/dns/generate', async (req, res) => {
    try {
      const { domain } = req.body;
      const result = await generateDnsRecords(domain);
      res.json(result);
    } catch (error) {
      console.error('DNS generation error:', error);
      res.status(500).json({ error: 'Failed to generate DNS records' });
    }
  });

  app.post('/api/domain/health', async (req, res) => {
    try {
      const { domain } = req.body;
      const result = await checkDomainHealth(domain);
      res.json(result);
    } catch (error) {
      console.error('Domain health check error:', error);
      res.status(500).json({ error: 'Failed to check domain health' });
    }
  });

  app.post('/api/list/analyze', async (req, res) => {
    try {
      const { sample } = req.body;
      const result = await analyzeEmailList(sample);
      res.json(result);
    } catch (error) {
      console.error('List analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze email list' });
    }
  });

  app.post('/api/bimi/generate', async (req, res) => {
    try {
      const { domain } = req.body;
      const result = await generateBimiRecord(domain);
      res.json(result);
    } catch (error) {
      console.error('BIMI generation error:', error);
      res.status(500).json({ error: 'Failed to generate BIMI record' });
    }
  });

  app.post('/api/glossary/explain', async (req, res) => {
    try {
      const { term } = req.body;
      const result = await explainTerm(term);
      res.json(result);
    } catch (error) {
      console.error('Glossary explanation error:', error);
      res.status(500).json({ error: 'Failed to explain term' });
    }
  });

  app.post('/api/subjects/variations', async (req, res) => {
    try {
      const validated = generateVariationsRequestSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({ error: validated.error.errors[0]?.message || 'Invalid request' });
      }
      const { subject, preview, body } = validated.data;
      const result = await generateSubjectVariations(subject, preview, body);
      res.json(result);
    } catch (error) {
      console.error('Subject variations error:', error);
      res.status(500).json({ error: 'Failed to generate subject variations' });
    }
  });

  app.post('/api/optimization/roadmap', async (req, res) => {
    try {
      const validated = generateRoadmapRequestSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({ error: validated.error.errors[0]?.message || 'Invalid request' });
      }
      const { analysisResult, subject, body } = validated.data;
      const result = await generateOptimizationRoadmap(analysisResult, subject, body);
      res.json(result);
    } catch (error) {
      console.error('Optimization roadmap error:', error);
      res.status(500).json({ error: 'Failed to generate optimization roadmap' });
    }
  });

  app.post('/api/rewrite/tone', async (req, res) => {
    try {
      const validated = generateToneRewriteRequestSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({ error: validated.error.errors[0]?.message || 'Invalid request' });
      }
      const { body, subject, preview, tone } = validated.data;
      const result = await rewriteWithTone(body, subject, preview, tone);
      res.json(result);
    } catch (error) {
      console.error('Tone rewrite error:', error);
      res.status(500).json({ error: 'Failed to rewrite with tone' });
    }
  });

  app.post('/api/email/preview', async (req, res) => {
    try {
      const validated = generatePreviewRequestSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({ error: validated.error.errors[0]?.message || 'Invalid request' });
      }
      const { subject, previewText, senderName } = validated.data;
      const result = await generateEmailPreviews(subject, previewText, senderName || 'Your Brand');
      res.json(result);
    } catch (error) {
      console.error('Email preview error:', error);
      res.status(500).json({ error: 'Failed to generate email previews' });
    }
  });

  app.post('/api/warmup/generate', async (req, res) => {
    try {
      const { domain } = req.body;
      if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Domain is required' });
      }
      const result = await generateWarmupPlan(domain);
      res.json(result);
    } catch (error) {
      console.error('Warmup plan generation error:', error);
      res.status(500).json({ error: 'Failed to generate warmup plan' });
    }
  });

  app.post('/api/spam/check', async (req, res) => {
    try {
      const { text, subject, previewText } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Email text is required' });
      }
      const result = await checkSpamTriggers(text, subject, previewText);
      res.json(result);
    } catch (error) {
      console.error('Spam check error:', error);
      res.status(500).json({ error: 'Failed to check for spam triggers' });
    }
  });

  return httpServer;
}
