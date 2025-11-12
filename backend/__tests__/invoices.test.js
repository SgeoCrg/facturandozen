const request = require('supertest');
const express = require('express');
const invoiceRoutes = require('../src/routes/invoice.routes');
const { authenticateToken } = require('../src/middleware/auth');
const db = require('../src/models');

require('./setup');

const app = express();
app.use(express.json());
app.use(authenticateToken);
app.use('/api/invoices', invoiceRoutes);

describe('Invoices API', () => {
  let testTenant;
  let testUser;
  let authToken;
  let testCustomer;

  beforeEach(async () => {
    const { tenant } = await global.createTestTenant();
    testTenant = tenant;
    testUser = await global.createTestUser(tenant.id);
    authToken = global.generateTestToken(testUser);

    testCustomer = await db.Customer.create({
      tenantId: tenant.id,
      name: 'Cliente Test',
      nif: 'B11111111',
      email: 'cliente@test.com'
    });
  });

  describe('POST /api/invoices', () => {
    it('debe crear factura correctamente', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: testCustomer.id,
          date: new Date().toISOString(),
          status: 'issued',
          lines: [
            {
              description: 'Producto 1',
              quantity: 2,
              unitPrice: 100,
              iva: 21
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('number');
      expect(response.body.total).toBe('242.00'); // 200 + 21% = 242
    });

    it('debe calcular IVA correctamente', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: testCustomer.id,
          date: new Date().toISOString(),
          status: 'issued',
          lines: [
            {
              description: 'Servicio',
              quantity: 1,
              unitPrice: 1000,
              iva: 21
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(parseFloat(response.body.subtotal)).toBe(1000);
      expect(parseFloat(response.body.ivaAmount)).toBe(210);
      expect(parseFloat(response.body.total)).toBe(1210);
    });

    it('debe crear factura sin cliente (manual)', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerManualName: 'Cliente Manual',
          customerManualNif: 'B22222222',
          date: new Date().toISOString(),
          status: 'issued',
          lines: [
            {
              description: 'Producto',
              quantity: 1,
              unitPrice: 50,
              iva: 21
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.customerManualName).toBe('Cliente Manual');
    });

    it('debe rechazar factura sin líneas', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: testCustomer.id,
          date: new Date().toISOString(),
          status: 'issued',
          lines: []
        });

      expect(response.status).toBe(400);
    });

    it('debe aislar por tenant', async () => {
      // Crear otro tenant
      const { tenant: otherTenant } = await global.createTestTenant();
      const otherUser = await global.createTestUser(otherTenant.id);
      const otherToken = global.generateTestToken(otherUser);

      const otherCustomer = await db.Customer.create({
        tenantId: otherTenant.id,
        name: 'Otro Cliente',
        nif: 'B33333333',
        email: 'otro@test.com'
      });

      // Intentar crear factura con customer de otro tenant
      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: otherCustomer.id,
          date: new Date().toISOString(),
          status: 'issued',
          lines: [
            {
              description: 'Test',
              quantity: 1,
              unitPrice: 100,
              iva: 21
            }
          ]
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/invoices', () => {
    beforeEach(async () => {
      // Crear varias facturas
      await db.Invoice.create({
        tenantId: testTenant.id,
        customerId: testCustomer.id,
        number: 'F-2024-0001',
        date: new Date(),
        status: 'issued',
        subtotal: 100,
        ivaAmount: 21,
        total: 121
      });

      await db.Invoice.create({
        tenantId: testTenant.id,
        customerId: testCustomer.id,
        number: 'F-2024-0002',
        date: new Date(),
        status: 'paid',
        subtotal: 200,
        ivaAmount: 42,
        total: 242
      });
    });

    it('debe listar facturas del tenant', async () => {
      const response = await request(app)
        .get('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.invoices).toHaveLength(2);
    });

    it('debe filtrar por status', async () => {
      const response = await request(app)
        .get('/api/invoices?status=paid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.invoices).toHaveLength(1);
      expect(response.body.invoices[0].status).toBe('paid');
    });

    it('debe paginar resultados', async () => {
      const response = await request(app)
        .get('/api/invoices?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.invoices).toHaveLength(1);
      expect(response.body.pagination.total).toBe(2);
    });
  });

  describe('GET /api/invoices/:id', () => {
    let testInvoice;

    beforeEach(async () => {
      testInvoice = await db.Invoice.create({
        tenantId: testTenant.id,
        customerId: testCustomer.id,
        number: 'F-2024-0001',
        date: new Date(),
        status: 'issued',
        subtotal: 100,
        ivaAmount: 21,
        total: 121
      });

      await db.InvoiceLine.create({
        invoiceId: testInvoice.id,
        description: 'Test Product',
        quantity: 1,
        unitPrice: 100,
        iva: 21,
        subtotal: 100
      });
    });

    it('debe obtener factura con líneas', async () => {
      const response = await request(app)
        .get(`/api/invoices/${testInvoice.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testInvoice.id);
      expect(response.body.lines).toHaveLength(1);
    });

    it('debe rechazar factura de otro tenant', async () => {
      const { tenant: otherTenant } = await global.createTestTenant();
      const otherUser = await global.createTestUser(otherTenant.id);
      const otherToken = global.generateTestToken(otherUser);

      const response = await request(app)
        .get(`/api/invoices/${testInvoice.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(404);
    });
  });
});



