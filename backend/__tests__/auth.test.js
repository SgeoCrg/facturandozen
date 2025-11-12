const request = require('supertest');
const express = require('express');
const authRoutes = require('../src/routes/auth.routes');
const db = require('../src/models');

require('./setup');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API', () => {
  let testTenant;
  let testUser;

  beforeEach(async () => {
    const { tenant } = await global.createTestTenant();
    testTenant = tenant;
    testUser = await global.createTestUser(tenant.id);
  });

  describe('POST /api/auth/login', () => {
    it('debe hacer login con credenciales correctas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'test123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('debe rechazar credenciales incorrectas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrong_password'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('debe rechazar usuario inexistente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'noexiste@test.com',
          password: 'test123'
        });

      expect(response.status).toBe(401);
    });

    it('debe validar campos requeridos', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email
          // falta password
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/register', () => {
    it('debe crear nuevo tenant y usuario', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          companyName: 'Nueva Empresa SL',
          nif: 'B99999999',
          email: 'nueva@empresa.com',
          password: 'password123',
          name: 'Admin User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.tenant.name).toBe('Nueva Empresa SL');
    });

    it('debe rechazar NIF duplicado', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          companyName: 'Otra Empresa',
          nif: testTenant.nif, // NIF ya existe
          email: 'otro@email.com',
          password: 'password123',
          name: 'Admin'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('NIF');
    });

    it('debe rechazar email duplicado', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          companyName: 'Otra Empresa',
          nif: 'B88888888',
          email: testTenant.email, // Email ya existe
          password: 'password123',
          name: 'Admin'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('email');
    });

    it('debe crear subscription trial por defecto', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          companyName: 'Test Trial',
          nif: 'B77777777',
          email: 'trial@test.com',
          password: 'password123',
          name: 'Admin'
        });

      expect(response.status).toBe(201);
      
      const subscription = await db.Subscription.findOne({
        where: { tenantId: response.body.tenant.id }
      });

      expect(subscription.status).toBe('trial');
      expect(subscription.plan).toBe('BASIC');
    });
  });
});



