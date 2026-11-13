import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

let studentToken: string = '';
let studentUserId: string = '';
let studentEmail: string = 'sarah.chen@campusconnect.edu';

let student2Token: string = '';
let student2UserId: string = '';

let adminToken: string = '';
let testCategoryId: string = '';
let createdFoundItemId: string = '';
let createdClaimId: string = '';
let scheduledCollectionId: string = '';

describe('CampusConnect Backend Comprehensive Test Suite', () => {
  beforeAll(async () => {
    // 1. Login as Student 1 (Sarah)
    const s1Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah.chen@campusconnect.edu', password: 'Student@12345' });
    expect(s1Res.status).toBe(200);
    studentToken = s1Res.body.data.token;
    studentUserId = s1Res.body.data.user.id;

    // 2. Login as Student 2 (Marcus)
    const s2Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'marcus.johnson@campusconnect.edu', password: 'Student@12345' });
    expect(s2Res.status).toBe(200);
    student2Token = s2Res.body.data.token;
    student2UserId = s2Res.body.data.user.id;

    // 3. Login as Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@campusconnect.edu', password: 'Admin@12345' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;

    // Fetch an existing category
    const cat = await prisma.category.findFirst();
    testCategoryId = cat!.id;
  });

  // TEST 1: Successful item creation
  it('1. Successfully reports a FOUND item with private verification details', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        itemName: 'Apple AirPods Pro in White Case',
        categoryId: testCategoryId,
        itemType: 'FOUND',
        publicDescription: 'Found white AirPods charging case on the 2nd floor library desk.',
        privateVerificationDetails: 'Engraved with initials "SC-99" and has a pink silicone dust guard.',
        location: 'Central Library - 2nd Floor',
        dateOccurred: new Date().toISOString(),
        colour: 'White',
        brand: 'Apple',
        currentHoldingLocation: 'Deposited at Security Desk',
        contactPreference: 'IN_APP',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.item.referenceNumber).toMatch(/^LF-\d{4}-\d+/);
    createdFoundItemId = res.body.data.item.id;
  });

  // TEST 2: Invalid item submission (validation check)
  it('2. Fails item creation when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        // Missing itemName, categoryId, location, etc.
        itemType: 'FOUND',
        publicDescription: 'Short',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // TEST 9: Private verification information is not exposed publicly
  it('9. Private verification information is NOT exposed to public or other students', async () => {
    // Query item as Student 2 (who is NOT the reporter)
    const res = await request(app)
      .get(`/api/items/${createdFoundItemId}`)
      .set('Authorization', `Bearer ${student2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.item.itemName).toBe('Apple AirPods Pro in White Case');
    expect(res.body.data.item.privateVerificationDetails).toBeUndefined();
  });

  // TEST 4: Users cannot claim their own found items
  it('4. Prevents users from claiming an item they reported found themselves', async () => {
    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${studentToken}`) // Sarah is the reporter
      .send({
        itemId: createdFoundItemId,
        claimDescription: 'This is my own item that I accidentally reported found.',
        identifyingCharacteristics: 'White case',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('cannot submit an ownership claim for an item you reported found yourself');
  });

  // TEST: Legitimate student (Marcus) submits claim
  it('Allows another student to file a legitimate claim', async () => {
    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${student2Token}`) // Marcus
      .send({
        itemId: createdFoundItemId,
        claimDescription: 'I left my AirPods Pro at the study carrel when heading to class.',
        identifyingCharacteristics: 'They have engraved initials SC-99 on the back of the case.',
        supportingEvidence: 'Serial number proof from my Apple receipt.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.referenceNumber).toMatch(/^CLM-\d{4}-\d+/);
    createdClaimId = res.body.data.id;
  });

  // TEST 3: Duplicate claim prevention
  it('3. Prevents duplicate active claim from the same user for the same item', async () => {
    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${student2Token}`)
      .send({
        itemId: createdFoundItemId,
        claimDescription: 'Submitting a second claim by accident.',
        identifyingCharacteristics: 'White case',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already have an active claim');
  });

  // TEST 6: Claim rejection requiring a reason
  it('6. Rejects claim review if status is REJECTED but no rejectionReason is provided', async () => {
    // Sarah (the finder) attempts to reject without a reason
    const res = await request(app)
      .patch(`/api/claims/${createdClaimId}/review`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        status: 'REJECTED',
        // Missing rejectionReason
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // TEST 5: Claim approval
  it('5. Successfully approves legitimate claim and updates item status', async () => {
    const res = await request(app)
      .patch(`/api/claims/${createdClaimId}/review`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        status: 'APPROVED',
        verificationNotes: 'Engraved initials SC-99 verified against claimant proof.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');

    // Verify item status transitioned to CLAIM_APPROVED
    const itemCheck = await prisma.item.findUnique({ where: { id: createdFoundItemId } });
    expect(itemCheck?.status).toBe('CLAIM_APPROVED');
  });

  // TEST 7: Invalid status transitions
  it('7. Enforces valid lifecycle transitions and rejects invalid item status transitions', async () => {
    const res = await request(app)
      .patch(`/api/items/${createdFoundItemId}/status`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        status: 'INVALID_STATUS_TEST',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid status transition');
  });

  // TEST 8: Unauthorised administrative access
  it('8. Prevents unauthorized students from accessing protected admin endpoints', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${studentToken}`); // Student token, not admin

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Access denied');
  });

  // TEST: Schedule Collection workflow
  it('Schedules a pickup collection for the approved claim', async () => {
    const res = await request(app)
      .post('/api/collections/schedule')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        claimId: createdClaimId,
        collectionLocation: 'Campus Security Office, Counter A',
        collectionInstructions: 'Bring student ID card for photo verification.',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('SCHEDULED');
    scheduledCollectionId = res.body.data.id;
  });

  // TEST 10: Collection confirmation
  it('10. Confirms item collection handover and updates item status to RETURNED', async () => {
    const res = await request(app)
      .patch(`/api/collections/${scheduledCollectionId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        handoverNotes: 'AirPods handed over to Marcus Johnson after ID verification.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COLLECTED');

    // Verify item status updated to RETURNED
    const itemCheck = await prisma.item.findUnique({ where: { id: createdFoundItemId } });
    expect(itemCheck?.status).toBe('RETURNED');
  });

  // TEST: Admin dashboard retrieves actual database analytics
  it('Admin dashboard endpoint successfully queries real database statistics', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.overview.totalStudents).toBeGreaterThan(0);
    expect(res.body.data.overview.totalFound).toBeGreaterThan(0);
    expect(res.body.data.categoryDistribution.length).toBeGreaterThan(0);
  });
});
