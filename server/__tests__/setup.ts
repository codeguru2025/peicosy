import { db } from '../db';
import { beforeAll, afterAll } from '@jest/globals';

beforeAll(async () => {
  // Ensure database connection is available
  try {
    await db.execute('SELECT 1');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
});

afterAll(async () => {
  // Clean up database connection
  try {
    await db.$client.end();
  } catch (error) {
    // Ignore cleanup errors
  }
});
