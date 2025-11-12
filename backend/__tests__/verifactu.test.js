/**
 * Tests para Verifactu
 */

const request = require('supertest');
const express = require('express');
const db = require('../src/models');
const verifactuRoutes = require('../src/routes/verifactu.routes');

require('./setup');

const app = express();
app.use(express.json());
app.use('/api/verifactu', verifactuRoutes);

describe('Verifactu API', () => {
  let testTenant;
  let testUser;
  let authToken;
  let testInvoice;

  beforeEach(async () => {
    const { tenant } = await global.createTestTenant();
    testTenant = tenant;
    testUser = await global.createTestUser(tenant.id);
    
    // Login para obtener token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'test123' });
    authToken = loginRes.body.token;

    // Crear factura de prueba
    testInvoice = await db.Invoice.create({
      tenantId: tenant.id,
      number: 'TEST-001',
      status: 'draft'
    });
  });

  describe('POST /api/verifactu/certificate', () => {
    it('debe rechazar sin autenticación', async () => {
      const res = await request(app)
        .post('/api/verifactu/certificate')
        .send({});

      expect(res.status).toBe(401);
    });

    it('debe rechazar certificado inválido', async () => {
      const res = await request(app)
        .post('/api/verifactu/certificate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('certificate', Buffer.from('fake-cert'), 'cert.p12');

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/verifactu/certificate/status', () => {
    it('debe devolver status sin certificado', async () => {
      const res = await request(app)
        .get('/api/verifactu/certificate/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('hasCertificate');
      expect(res.body.hasCertificate).toBe(false);
    });
  });

  describe('POST /api/verifactu/invoices/:id/send', () => {
    it('debe rechazar factura sin certificado', async () => {
      const res = await request(app)
        .post(`/api/verifactu/invoices/${testInvoice.id}/send`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('certificado');
    });
  });
});

