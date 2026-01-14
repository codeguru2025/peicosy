import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { storage } from '../storage';
import { db } from '../db';

describe('Integration Tests - Real API', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    app.get('/api/health', async (req, res) => {
      try {
        await db.execute('SELECT 1');
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        });
      } catch (error) {
        res.status(503).json({ status: 'unhealthy', error: 'Database connection failed' });
      }
    });

    app.get('/api/products', async (req, res) => {
      try {
        const products = await storage.getProducts();
        res.json(products);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch products' });
      }
    });

    app.get('/api/products/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: 'Invalid product ID' });
        }
        const product = await storage.getProduct(id);
        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch product' });
      }
    });

    app.get('/api/exchange-rates', async (req, res) => {
      try {
        const rate = await storage.getExchangeRate('GBP', 'ZAR');
        res.json(rate ? [rate] : []);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch exchange rates' });
      }
    });

    app.get('/api/shipping-rates', async (req, res) => {
      try {
        const rates = await storage.getShippingRates();
        res.json(rates);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch shipping rates' });
      }
    });
  });

  afterAll(async () => {
    try {
      await db.$client.end();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Health Endpoint - Real Database', () => {
    it('should verify database connectivity', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Products API - Real Storage', () => {
    it('should return products from database', async () => {
      const response = await request(app).get('/api/products');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return product with price and brand', async () => {
      const response = await request(app).get('/api/products');
      const product = response.body[0];
      
      expect(product.name).toBeDefined();
      expect(product.price).toBeDefined();
      expect(product.brand).toBeDefined();
      expect(product.currency).toBe('GBP');
    });

    it('should fetch individual product by ID', async () => {
      const listResponse = await request(app).get('/api/products');
      const productId = listResponse.body[0].id;
      
      const response = await request(app).get(`/api/products/${productId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(productId);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app).get('/api/products/99999');
      
      expect(response.status).toBe(404);
    });
  });

  describe('Exchange Rates - Real Storage', () => {
    it('should return exchange rates from database', async () => {
      const response = await request(app).get('/api/exchange-rates');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Shipping Rates - Real Storage', () => {
    it('should return shipping rates from database', async () => {
      const response = await request(app).get('/api/shipping-rates');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
