const request = require('supertest');
const express = require('express');
const customerRoutes = require('../src/routes/customer.routes');
const { authenticateToken } = require('../src/middleware/auth');
const db = require('../src/models');

require('./setup');

const app = express();
app.use(express.json());
app.use(authenticateToken);
app.use('/api/customers', customerRoutes);

describe('Customers API', () => {
  let testTenant;
  let testUser;
  let authToken;

  beforeEach(async () => {
    const { tenant } = await global.createTestTenant();
    testTenant = tenant;
    testUser = await global.createTestUser(tenant.id);
    authToken = global.generateTestToken(testUser);
  });

  describe('POST /api/customers', () => {
    it('debe crear cliente correctamente', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Cliente Test',
          nif: 'B12345678',
          email: 'cliente@test.com',
          address: 'Calle Test 123'
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Cliente Test');
      expect(response.body.nif).toBe('B12345678');
    });

    it('debe validar NIF español', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Cliente',
          nif: 'INVALID',
          email: 'test@test.com'
        });

      expect(response.status).toBe(400);
    });

    it('debe rechazar NIF duplicado en mismo tenant', async () => {
      await db.Customer.create({
        tenantId: testTenant.id,
        name: 'Cliente 1',
        nif: 'B11111111',
        email: 'cliente1@test.com'
      });

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Cliente 2',
          nif: 'B11111111',
          email: 'cliente2@test.com'
        });

      expect(response.status).toBe(400);
    });

    it('debe permitir mismo NIF en diferentes tenants', async () => {
      const { tenant: otherTenant } = await global.createTestTenant();
      
      await db.Customer.create({
        tenantId: otherTenant.id,
        name: 'Cliente Otro Tenant',
        nif: 'B22222222',
        email: 'otro@test.com'
      });

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Mi Cliente',
          nif: 'B22222222',
          email: 'mi@test.com'
        });

      expect(response.status).toBe(201);
    });
  });

  describe('GET /api/customers', () => {
    beforeEach(async () => {
      await db.Customer.bulkCreate([
        {
          tenantId: testTenant.id,
          name: 'Cliente A',
          nif: 'B11111111',
          email: 'a@test.com'
        },
        {
          tenantId: testTenant.id,
          name: 'Cliente B',
          nif: 'B22222222',
          email: 'b@test.com'
        }
      ]);
    });

    it('debe listar clientes del tenant', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.customers).toHaveLength(2);
    });

    it('debe buscar por nombre', async () => {
      const response = await request(app)
        .get('/api/customers?search=Cliente A')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.customers).toHaveLength(1);
      expect(response.body.customers[0].name).toBe('Cliente A');
    });
  });

  describe('PUT /api/customers/:id', () => {
    let customer;

    beforeEach(async () => {
      customer = await db.Customer.create({
        tenantId: testTenant.id,
        name: 'Cliente Original',
        nif: 'B11111111',
        email: 'original@test.com'
      });
    });

    it('debe actualizar cliente', async () => {
      const response = await request(app)
        .put(`/api/customers/${customer.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Cliente Actualizado',
          email: 'actualizado@test.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Cliente Actualizado');
    });

    it('debe rechazar actualizar cliente de otro tenant', async () => {
      const { tenant: otherTenant } = await global.createTestTenant();
      const otherUser = await global.createTestUser(otherTenant.id);
      const otherToken = global.generateTestToken(otherUser);

      const response = await request(app)
        .put(`/api/customers/${customer.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          name: 'Hack'
        });

      expect(response.status).toBe(404);
    });
  });
});



