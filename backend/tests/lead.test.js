const request = require('supertest');
const { sequelize } = require('../config/database');
const { User, Lead } = require('../models');

// Set test environment before importing server
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRE = '1h';
process.env.DB_NAME = process.env.DB_NAME || 'crm_db';

const app = require('../server');

describe('Lead API', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Connect to test database
    await sequelize.authenticate();
    // Clear test data
    await Lead.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // Create test user
    const user = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: 'Sales Executive'
    });
    userId = user.id;

    // Login to get token
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    authToken = response.body.data.token;
  });

  afterAll(async () => {
    // Clean up
    await Lead.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await sequelize.close();
  });

  describe('POST /api/v1/leads', () => {
    it('should create a new lead successfully', async () => {
      const leadData = {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '1234567890',
        company: 'Test Company',
        status: 'New',
        estimatedValue: 1000
      };

      const response = await request(app)
        .post('/api/v1/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send(leadData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lead).toHaveProperty('id');
      expect(response.body.data.lead.firstName).toBe(leadData.firstName);
      expect(response.body.data.lead.lastName).toBe(leadData.lastName);
      expect(response.body.data.lead.email).toBe(leadData.email);
    });

    it('should return 400 if validation fails', async () => {
      const leadData = {
        firstName: '',
        lastName: 'Smith',
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/v1/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send(leadData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/leads', () => {
    it('should get all leads', async () => {
      const response = await request(app)
        .get('/api/v1/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.leads).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toHaveProperty('total');
    });

    it('should filter leads by status', async () => {
      const response = await request(app)
        .get('/api/v1/leads?status=New')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.leads).toBeInstanceOf(Array);
      if (response.body.data.leads.length > 0) {
        expect(response.body.data.leads[0].status).toBe('New');
      }
    });
  });

  describe('GET /api/v1/leads/:id', () => {
    let leadId;

    beforeAll(async () => {
      // Create a test lead
      const lead = await Lead.create({
        firstName: 'Test',
        lastName: 'Lead',
        email: 'test.lead@example.com',
        status: 'New',
        createdById: userId,
        assignedToId: userId
      });
      leadId = lead.id;
    });

    it('should get lead by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/leads/${leadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lead).toHaveProperty('id');
      expect(response.body.data.lead.id).toBe(leadId);
    });

    it('should return 404 if lead not found', async () => {
      const response = await request(app)
        .get('/api/v1/leads/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /api/v1/leads/:id', () => {
    let leadId;

    beforeAll(async () => {
      // Create a test lead
      const lead = await Lead.create({
        firstName: 'Update',
        lastName: 'Test',
        email: 'update.test@example.com',
        status: 'New',
        createdById: userId,
        assignedToId: userId
      });
      leadId = lead.id;
    });

    it('should update lead successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        status: 'Qualified'
      };

      const response = await request(app)
        .put(`/api/v1/leads/${leadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lead.firstName).toBe(updateData.firstName);
      expect(response.body.data.lead.status).toBe(updateData.status);
    });
  });

  describe('DELETE /api/v1/leads/:id', () => {
    let leadId;

    beforeAll(async () => {
      // Create a test lead
      const lead = await Lead.create({
        firstName: 'Delete',
        lastName: 'Test',
        email: 'delete.test@example.com',
        status: 'New',
        createdById: userId,
        assignedToId: userId
      });
      leadId = lead.id;
    });

    it('should delete lead successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/leads/${leadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });
  });
});

