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
  explainTerm 
} from "./gemini";

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

  return httpServer;
}
