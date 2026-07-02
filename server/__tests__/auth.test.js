import request from 'supertest';
import { expect, test, vi } from 'vitest';
import app from '../server';

// Mock database connection/query to simulate user lookup
vi.mock('../config/db', () => {
  return {
    query: vi.fn().mockImplementation(async (text, params) => {
      // Mock SELECT query for login
      if (text.includes('SELECT * FROM users WHERE email = $1')) {
        return {
          rows: [
            {
              id: 1,
              email: 'test@example.com',
              // bcrypt hash for password "correct_password"
              password_hash: '$2a$10$wK3Fj2kH3D7V3LekbHpef.j/u/Mh0UoY/8v7Q/tTfR8F1uGZ1F.mK',
              role: 'teacher',
              name: 'Test Teacher',
              avatar: 'initials',
              theme_color: 'emerald'
            }
          ]
        };
      }
      return { rows: [] };
    }),
    pool: {
      end: vi.fn()
    }
  };
});

test('POST /api/auth/login with incorrect password returns 401 Unauthorized', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'wrong_password'
    });

  // Assert status code is strictly 401
  expect(response.status).toBe(401);
  // Assert error message returned matches invalid credentials
  expect(response.body).toHaveProperty('error', 'Invalid credentials.');
});
