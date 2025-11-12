/**
 * Script para insertar datos de ejemplo
 * 
 * USO:
 * node src/seeders/seed.js
 */

require('dotenv').config();
const db = require('../models');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('🌱 Iniciando seed multi-tenant...\n');

    await db.sequelize.authenticate();
    console.log('✅ Conectado a base de datos\n');

    // Sync modelos (recrear tablas)
    await db.sequelize.sync({ force: true });
    console.log('✅ Tablas recreadas\n');

    // 1. Crear SUPERADMIN (TÚ)
    const [superadmin, superCreated] = await db.User.findOrCreate({
      where: { email: 'super@admin.com' },
      defaults: {
        email: 'super@admin.com',
        password: await bcrypt.hash('super123', 10),
        name: 'Superadministrador',
        role: 'superadmin',
        tenantId: null
      }
    });

    if (superCreated) {
      console.log('✅ SUPERADMIN creado');
      console.log('   Email: super@admin.com');
      console.log('   Password: super123\n');
    }

    // 2. Crear tenant ejemplo
    const tenant = await db.Tenant.create({
      name: 'Empresa Demo S.L.',
      nif: 'B12345678',
      email: 'demo@empresa.com',
      address: 'Calle Principal 123, 28001 Madrid',
      status: 'active'
    });
    console.log('✅ Tenant ejemplo creado: Empresa Demo S.L.\n');

    // 3. Crear subscripción STARTER (plan básico)
    await db.Subscription.create({
      tenantId: tenant.id,
      plan: 'starter',
      priceMonthly: 9,
      status: 'active',
      maxInvoices: 100
    });
    console.log('✅ Subscripción STARTER creada\n');

    // 4. Crear admin del tenant
    const admin = await db.User.create({
      email: 'admin@demo.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'Admin Demo',
      tenantId: tenant.id,
      role: 'admin'
    });
    console.log('✅ Admin tenant creado');
    console.log('   Email: admin@demo.com');
    console.log('   Password: admin123\n');

    // 5. Configuración empresa
    await db.Settings.create({
      companyName: tenant.name,
      companyNif: tenant.nif,
      companyAddress: tenant.address
    });
    console.log('✅ Configuración creada\n');

    // 6. Clientes de ejemplo (para el tenant)
    const customersData = [
      {
        name: 'Acme Corporation S.A.',
        nif: 'A12345678',
        email: 'contacto@acme.com',
        phone: '+34912345678',
        address: 'Av. Ejemplo 456',
        city: 'Madrid',
        postalCode: '28002'
      },
      {
        name: 'Tech Solutions S.L.',
        nif: 'B87654321',
        email: 'info@techsolutions.com',
        phone: '+34923456789',
        address: 'Calle Innovación 789',
        city: 'Barcelona',
        postalCode: '08001'
      },
      {
        name: 'Juan García Pérez',
        nif: '12345678Z',
        email: 'juan.garcia@email.com',
        phone: '+34654321098',
        address: 'Plaza Mayor 12',
        city: 'Valencia',
        postalCode: '46001'
      }
    ];

    for (const customerData of customersData) {
      await db.Customer.create({
        ...customerData,
        tenantId: tenant.id
      });
      console.log(`✅ Cliente creado: ${customerData.name}`);
    }
    console.log();

    // 7. Productos de ejemplo (para el tenant)
    const productsData = [
      {
        name: 'Consultoría Desarrollo Web',
        description: 'Hora de consultoría especializada en desarrollo web',
        sku: 'CONS-WEB-001',
        price: 75.00,
        ivaRate: 21
      },
      {
        name: 'Diseño Logo Corporativo',
        description: 'Diseño de logo profesional + 3 revisiones',
        sku: 'DIS-LOGO-001',
        price: 450.00,
        ivaRate: 21
      },
      {
        name: 'Hosting Anual',
        description: 'Hosting compartido con SSL incluido',
        sku: 'HOST-ANUAL',
        price: 120.00,
        ivaRate: 21
      },
      {
        name: 'Mantenimiento Web Mensual',
        description: 'Mantenimiento y actualizaciones mensuales',
        sku: 'MANT-WEB-MES',
        price: 95.00,
        ivaRate: 21
      },
      {
        name: 'Formación Presencial',
        description: 'Jornada formativa presencial (8 horas)',
        sku: 'FORM-PRES',
        price: 600.00,
        ivaRate: 21
      }
    ];

    const products = [];
    for (const productData of productsData) {
      const product = await db.Product.create({
        ...productData,
        tenantId: tenant.id
      });
      products.push(product);
      console.log(`✅ Producto creado: ${product.name}`);
    }
    console.log();

    // 8. Factura de ejemplo
    const customer = await db.Customer.findOne({ where: { nif: 'A12345678', tenantId: tenant.id } });

    if (customer && products.length >= 2) {
      const invoice = await db.Invoice.create({
        tenantId: tenant.id,
        number: 1,
        series: 'A',
        fullNumber: 'A2025/000001',
        date: new Date(),
        customerId: customer.id,
        subtotal: 975.00,
        totalIva: 204.75,
        total: 1179.75,
        status: 'issued',
        notes: 'Factura de ejemplo - Proyecto web inicial'
      });

      await db.InvoiceLine.create({
        invoiceId: invoice.id,
        description: products[0].name,
        quantity: 10,
        price: 75.00,
        ivaRate: 21,
        total: 907.50
      });

      await db.InvoiceLine.create({
        invoiceId: invoice.id,
        description: products[1].name,
        quantity: 1,
        price: 450.00,
        ivaRate: 21,
        total: 544.50
      });

      console.log('✅ Factura de ejemplo creada: A2025/000001\n');
    }

    console.log('🎉 Seed multi-tenant completado!\n');
    console.log('📋 Resumen:');
    console.log(`   - Tenants: ${await db.Tenant.count()}`);
    console.log(`   - Usuarios: ${await db.User.count()}`);
    console.log(`   - Clientes: ${await db.Customer.count()}`);
    console.log(`   - Productos: ${await db.Product.count()}`);
    console.log(`   - Facturas: ${await db.Invoice.count()}\n`);
    
    console.log('🔐 CREDENCIALES:\n');
    console.log('   👑 SUPERADMIN (TÚ):');
    console.log('      Email: super@admin.com');
    console.log('      Password: super123\n');
    console.log('   👤 Cliente Demo:');
    console.log('      Email: admin@demo.com');
    console.log('      Password: admin123\n');
    
    console.log('🚀 Inicia: npm run dev\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
};

seedData();

