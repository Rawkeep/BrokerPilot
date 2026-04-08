import { describe, it, expect, afterAll } from 'vitest';
import express from 'express';
import { healthRouter } from '../../server/routes/health.js';

describe('GET /health', () => {
  let server;
  let baseUrl;

  // Start a test server
  const app = express();
  app.use('/api', healthRouter);

  // Use a random available port
  const startServer = () =>
    new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

  afterAll(() => {
    if (server) server.close();
  });

  it('should return 200 with status ok, timestamp, and uptime', async () => {
    await startServer();

    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThan(0);

    // Verify timestamp is a valid ISO date
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });
});
