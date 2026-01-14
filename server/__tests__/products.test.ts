import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll } from '@jest/globals';
import { storage } from '../storage';

describe('Products API', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
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
  });

  describe('GET /api/products', () => {
    it('should return an array of products', async () => {
      const response = await request(app).get('/api/products');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return products with required fields', async () => {
      const response = await request(app).get('/api/products');
      
      if (response.body.length > 0) {
        const product = response.body[0];
        expect(product.id).toBeDefined();
        expect(product.name).toBeDefined();
        expect(product.price).toBeDefined();
        expect(product.brand).toBeDefined();
      }
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return 400 for invalid ID', async () => {
      const response = await request(app).get('/api/products/invalid');
      
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid product ID');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app).get('/api/products/99999');
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found');
    });

    it('should return product for valid ID', async () => {
      const products = await storage.getProducts();
      if (products.length > 0) {
        const response = await request(app).get(`/api/products/${products[0].id}`);
        
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(products[0].id);
      }
    });
  });
});
