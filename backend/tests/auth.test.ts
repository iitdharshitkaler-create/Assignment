import request from 'supertest';
import { connectDB, clearDB, closeDB } from './dbSetup';
import { app } from '../src/server';
beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe('Auth API Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should successfully register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message', 'User registered successfully');
      // Ensure no sensitive data like the hashed password is leaked in the response
      expect(res.body).not.toHaveProperty('password'); 
    });

    it('should fail if the email is already in use', async () => {
      // First registration
      await request(app).post('/api/auth/register').send({
        name: 'Existing User',
        email: 'duplicate@example.com',
        password: 'Password123!',
      });

      // Second registration with the same email
      const res = await request(app).post('/api/auth/register').send({
        name: 'New User',
        email: 'duplicate@example.com',
        password: 'Password123!',
      });

      expect(res.statusCode).toEqual(400); // Or whatever error code your API design uses [cite: 31]
    });
  });
});