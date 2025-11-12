const db = require('../src/models');

beforeAll(async () => {
  // Sync DB para tests
  await db.sequelize.sync({ force: true });
});

afterAll(async () => {
  // Cerrar conexiones
  await db.sequelize.close();
});

// Helper para crear tenant de prueba
global.createTestTenant = async () => {
  const tenant = await db.Tenant.create({
    name: 'Test Company',
    nif: 'B12345678',
    email: 'test@test.com',
    status: 'trial'
  });

  const subscription = await db.Subscription.create({
    tenantId: tenant.id,
    plan: 'BASIC',
    status: 'trial',
    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    maxInvoices: 50
  });

  return { tenant, subscription };
};

// Helper para crear usuario de prueba
global.createTestUser = async (tenantId, role = 'admin') => {
  const bcrypt = require('bcryptjs');
  const user = await db.User.create({
    tenantId,
    name: 'Test User',
    email: `test_${Date.now()}@test.com`,
    password: await bcrypt.hash('test123', 10),
    role
  });

  return user;
};

// Helper para generar JWT
global.generateTestToken = (user) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { 
      id: user.id, 
      tenantId: user.tenantId, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
};



