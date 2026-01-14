import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Authentication API', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    app.post('/api/login', async (req, res) => {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      if (username.length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters' });
      }
      
      res.status(200).json({ message: 'Validation passed' });
    });

    app.post('/api/signup', async (req, res) => {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Password strength validation
      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }
      
      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ message: 'Password must contain an uppercase letter' });
      }
      
      if (!/[a-z]/.test(password)) {
        return res.status(400).json({ message: 'Password must contain a lowercase letter' });
      }
      
      if (!/[0-9]/.test(password)) {
        return res.status(400).json({ message: 'Password must contain a number' });
      }
      
      res.status(200).json({ message: 'Validation passed' });
    });
  });

  describe('POST /api/login', () => {
    it('should reject empty credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Username and password are required');
    });

    it('should reject short username', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'ab', password: 'password' });
      
      expect(response.status).toBe(400);
    });

    it('should accept valid credentials format', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'testuser', password: 'Password123' });
      
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/signup - Password Validation', () => {
    it('should reject passwords under 8 characters', async () => {
      const response = await request(app)
        .post('/api/signup')
        .send({ username: 'newuser', password: 'Pass1' });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('8 characters');
    });

    it('should reject passwords without uppercase', async () => {
      const response = await request(app)
        .post('/api/signup')
        .send({ username: 'newuser', password: 'password123' });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('uppercase');
    });

    it('should reject passwords without lowercase', async () => {
      const response = await request(app)
        .post('/api/signup')
        .send({ username: 'newuser', password: 'PASSWORD123' });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('lowercase');
    });

    it('should reject passwords without numbers', async () => {
      const response = await request(app)
        .post('/api/signup')
        .send({ username: 'newuser', password: 'Password' });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('number');
    });

    it('should accept strong passwords', async () => {
      const response = await request(app)
        .post('/api/signup')
        .send({ username: 'newuser', password: 'StrongPass123' });
      
      expect(response.status).toBe(200);
    });
  });
});
