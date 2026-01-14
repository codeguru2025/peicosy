import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Health Endpoint', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    
    app.get('/api/health', async (req, res) => {
      try {
        const healthData = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        };
        res.json(healthData);
      } catch (error) {
        res.status(503).json({ status: 'unhealthy', error: 'Health check failed' });
      }
    });
  });

  it('should return healthy status', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.uptime).toBeGreaterThan(0);
    expect(response.body.memory).toBeDefined();
  });

  it('should include memory metrics', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.body.memory.rss).toBeDefined();
    expect(response.body.memory.heapTotal).toBeDefined();
    expect(response.body.memory.heapUsed).toBeDefined();
  });
});
