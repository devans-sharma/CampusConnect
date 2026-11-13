import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Notification Microservice', () => {
  it('GET /api/notifications/health returns healthy status', async () => {
    const res = await request(app).get('/api/notifications/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toContain('CampusConnect Notification Microservice');
  });

  it('POST /api/notifications/send accepts valid notification payload', async () => {
    const payload = {
      userId: 'test-user-uuid',
      recipientEmail: 'student@campus.edu',
      recipientName: 'Alex Student',
      type: 'CLAIM_SUBMITTED',
      title: 'New Ownership Claim Submitted',
      message: 'A student has submitted a claim for your found item: Wireless Earbuds.',
      metadata: {
        itemReference: 'LF-2026-001',
        itemName: 'Wireless Earbuds',
      },
    };

    const res = await request(app)
      .post('/api/notifications/send')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('CLAIM_SUBMITTED');
  });

  it('POST /api/notifications/send rejects invalid payload missing required fields', async () => {
    const res = await request(app)
      .post('/api/notifications/send')
      .send({
        // Missing userId, title, message
        type: 'CLAIM_SUBMITTED',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
