import request from 'supertest';
import app from '../src/server.js';

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'healthy',
      timestamp: expect.any(String),
    });
  });
});
