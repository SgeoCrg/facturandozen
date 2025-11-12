#!/usr/bin/env node

/**
 * Script completo para crear datos de prueba del sistema completo
 * Incluye: Tenants, usuarios, clientes, productos, facturas, afiliados, comisiones, etc.
 * 
 * USO:
 * node scripts/create-complete-test-data.js
 */

require('dotenv').config();
const db = require('../src/models');
const bcrypt = require('bcryptjs');
const AffiliateService = require('../src/services/AffiliateService');

const createCompleteTestData = async () => {
  try {
    console.log('🚀 Creando datos de prueba completos del sistema...\n');

    await db.sequelize.authenticate();
    console.log('✅ Conectado a base de datos\n');

    // Sync modelos (recrear tablas)
    await db.sequelize.sync({ force: true });
    console.log('✅ Tablas recreadas\n');

    // ===========================================
    // 1. SUPERADMIN
    // ===========================================
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

    // ===========================================
    // 2. AFILIADOS DE PRUEBA
    // ===========================================
    console.log('📊 Creando afiliados...');
    const affiliatesData = [
      {
        name: 'Juan Pérez Marketing',
        email: 'juan@marketing.com',
        phone: '+34 600 123 456',
        commissionRate: 20,
        status: 'active'
      },
      {
        name: 'María García Digital',
        email: 'maria@digital.com',
        phone: '+34 600 789 012',
        commissionRate: 25,
        status: 'active'
      },
      {
        name: 'Carlos López Consultoría',
        email: 'carlos@consultoria.com',
        phone: '+34 600 345 678',
        commissionRate: 15,
        status: 'active'
      },
      {
        name: 'Ana Martínez Agencia',
        email: 'ana@agencia.com',
        phone: '+34 600 901 234',
        commissionRate: 30,
        status: 'active'
      },
      {
        name: 'Roberto Silva Freelancer',
        email: 'roberto@freelancer.com',
        phone: '+34 600 567 890',
        commissionRate: 18,
        status: 'inactive'
      }
    ];

    const affiliates = [];
    for (const affiliateData of affiliatesData) {
      try {
        const affiliate = await AffiliateService.createAffiliate(affiliateData);
        affiliates.push(affiliate);
        console.log(`✅ Afiliado: ${affiliate.name} (${affiliate.code})`);
      } catch (error) {
        console.log(`❌ Error creando afiliado ${affiliateData.name}:`, error.message);
      }
    }
    console.log();

    // ===========================================
    // 3. TENANTS DE PRUEBA (Empresas)
    // ===========================================
    console.log('🏢 Creando empresas tenant...');
    const tenantsData = [
      {
        name: 'Tech Solutions S.L.',
        nif: 'B12345678',
        email: 'admin@techsolutions.com',
        address: 'Calle Innovación 123, 28001 Madrid',
        status: 'active'
      },
      {
        name: 'Marketing Digital Pro S.A.',
        nif: 'A87654321',
        email: 'admin@marketingpro.com',
        address: 'Av. Digital 456, 08001 Barcelona',
        status: 'trial'
      },
      {
        name: 'Consultoría Empresarial López',
        nif: 'B11111111',
        email: 'admin@consultorialopez.com',
        address: 'Plaza Empresarial 789, 46001 Valencia',
        status: 'active'
      },
      {
        name: 'Diseño Creativo Studio',
        nif: 'B22222222',
        email: 'admin@disenocreativo.com',
        address: 'Calle Arte 321, 41001 Sevilla',
        status: 'trial'
      },
      {
        name: 'Servicios Web Express',
        nif: 'B33333333',
        email: 'admin@webexpress.com',
        address: 'Av. Tecnología 654, 15001 A Coruña',
        status: 'active'
      }
    ];

    const tenants = [];
    for (const tenantData of tenantsData) {
      const tenant = await db.Tenant.create(tenantData);
      tenants.push(tenant);
      console.log(`✅ Tenant: ${tenant.name}`);
    }
    console.log();

    // ===========================================
    // 4. SUSCRIPCIONES
    // ===========================================
    console.log('💳 Creando suscripciones...');
    const subscriptionPlans = ['basic', 'pro'];
    
    for (let i = 0; i < tenants.length; i++) {
      const tenant = tenants[i];
      const plan = subscriptionPlans[i % subscriptionPlans.length];
      const isTrial = tenant.status === 'trial';
      
      const subscription = await db.Subscription.create({
        tenantId: tenant.id,
        plan: plan,
        priceMonthly: plan === 'basic' ? 29 : 49,
        status: isTrial ? 'trial' : 'active',
        trialEndsAt: isTrial ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
        maxInvoices: plan === 'basic' ? 50 : 500,
        stripeCustomerId: `cus_test_${tenant.id}`,
        stripeSubscriptionId: isTrial ? null : `sub_test_${tenant.id}`
      });
      
      console.log(`✅ Suscripción ${plan} para ${tenant.name} (${subscription.status})`);
    }
    console.log();

    // ===========================================
    // 5. USUARIOS ADMIN POR TENANT
    // ===========================================
    console.log('👥 Creando usuarios admin...');
    const users = [];
    
    for (let i = 0; i < tenants.length; i++) {
      const tenant = tenants[i];
      const user = await db.User.create({
        email: tenant.email,
        password: await bcrypt.hash('admin123', 10),
        name: `Admin ${tenant.name.split(' ')[0]}`,
        tenantId: tenant.id,
        role: 'admin'
      });
      users.push(user);
      console.log(`✅ Usuario admin: ${user.email}`);
    }
    console.log();

    // ===========================================
    // 6. CONFIGURACIONES POR TENANT
    // ===========================================
    console.log('⚙️ Creando configuraciones...');
    for (const tenant of tenants) {
      await db.Settings.create({
        tenantId: tenant.id,
        companyName: tenant.name,
        nif: tenant.nif,
        address: tenant.address,
        phone: '+34 900 123 456',
        email: tenant.email,
        website: `https://www.${tenant.name.toLowerCase().replace(/\s+/g, '')}.com`,
        logo: null,
        invoicePrefix: 'F',
        nextInvoiceNumber: 1,
        defaultIva: 21,
        verifactuEnabled: tenant.status === 'active'
      });
      console.log(`✅ Configuración: ${tenant.name}`);
    }
    console.log();

    // ===========================================
    // 7. CLIENTES POR TENANT
    // ===========================================
    console.log('👤 Creando clientes...');
    const customersTemplate = [
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
      },
      {
        name: 'María López Fernández',
        nif: '87654321Y',
        email: 'maria.lopez@email.com',
        phone: '+34654321099',
        address: 'Calle Principal 34',
        city: 'Sevilla',
        postalCode: '41001'
      },
      {
        name: 'Carlos Ruiz Martín',
        nif: '11223344X',
        email: 'carlos.ruiz@email.com',
        phone: '+34654321100',
        address: 'Av. Central 56',
        city: 'A Coruña',
        postalCode: '15001'
      }
    ];

    for (const tenant of tenants) {
      const tenantNum = parseInt(tenant.id.replace(/\D/g, '').slice(-2)) || 1;
      
      for (let i = 0; i < customersTemplate.length; i++) {
        const customerData = { ...customersTemplate[i] };
        // Generar NIF único para cada cliente usando timestamp
        const uniqueId = Date.now() + Math.random() * 1000;
        const nifSuffix = String(Math.floor(uniqueId) % 100000000).padStart(8, '0');
        customerData.nif = customerData.nif.charAt(0) + nifSuffix;
        customerData.email = customerData.email.replace('@', `+${uniqueId}@`);
        
        await db.Customer.create({
          ...customerData,
          tenantId: tenant.id
        });
      }
      console.log(`✅ 5 clientes creados para ${tenant.name}`);
    }
    console.log();

    // ===========================================
    // 8. PRODUCTOS POR TENANT
    // ===========================================
    console.log('📦 Creando productos...');
    const productsTemplate = [
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
      },
      {
        name: 'SEO Básico',
        description: 'Optimización SEO básica para sitio web',
        sku: 'SEO-BASIC',
        price: 300.00,
        ivaRate: 21
      },
      {
        name: 'Redes Sociales Management',
        description: 'Gestión mensual de redes sociales',
        sku: 'RRSS-MES',
        price: 250.00,
        ivaRate: 21
      },
      {
        name: 'Email Marketing',
        description: 'Campaña de email marketing completa',
        sku: 'EMAIL-CAMP',
        price: 180.00,
        ivaRate: 21
      }
    ];

    const allProducts = [];
    for (const tenant of tenants) {
      const tenantProducts = [];
      const tenantNum = parseInt(tenant.id.replace(/\D/g, '').slice(-2)) || 1;
      
      for (let i = 0; i < productsTemplate.length; i++) {
        const productData = { ...productsTemplate[i] };
        // Variar precios por tenant
        productData.price = productData.price * (1 + tenantNum * 0.1);
        productData.sku = `${productData.sku}-T${tenantNum}`;
        
        const product = await db.Product.create({
          ...productData,
          tenantId: tenant.id
        });
        tenantProducts.push(product);
        allProducts.push(product);
      }
      console.log(`✅ 8 productos creados para ${tenant.name}`);
    }
    console.log();

    // ===========================================
    // 9. FACTURAS CON LÍNEAS
    // ===========================================
    console.log('🧾 Creando facturas...');
    let totalInvoices = 0;
    
    for (const tenant of tenants) {
      const customers = await db.Customer.findAll({ where: { tenantId: tenant.id } });
      const products = await db.Product.findAll({ where: { tenantId: tenant.id } });
      
      // Crear 3-5 facturas por tenant
      const numInvoices = 3 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < numInvoices; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const numLines = 1 + Math.floor(Math.random() * 3);
        
        let subtotal = 0;
        const invoiceLines = [];
        
        // Crear líneas de factura
        for (let j = 0; j < numLines; j++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const quantity = 1 + Math.floor(Math.random() * 5);
          const lineTotal = product.price * quantity;
          subtotal += lineTotal;
          
          invoiceLines.push({
            description: product.name,
            quantity: quantity,
            price: product.price,
            ivaRate: product.ivaRate,
            total: lineTotal
          });
        }
        
        const totalIva = subtotal * 0.21;
        const total = subtotal + totalIva;
        
        const tenantNum = parseInt(tenant.id.replace(/\D/g, '').slice(-2)) || 1;
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 1000);
        const invoiceNumber = tenantNum * 10000 + (timestamp % 1000) + randomSuffix;
        
        const invoice = await db.Invoice.create({
          tenantId: tenant.id,
          number: invoiceNumber,
          series: 'A',
          fullNumber: `A2025/${String(invoiceNumber).padStart(6, '0')}`,
          date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Últimos 90 días
          customerId: customer.id,
          subtotal: subtotal,
          totalIva: totalIva,
          total: total,
          status: Math.random() > 0.2 ? 'issued' : 'paid', // 80% emitidas, 20% pagadas
          notes: `Factura ${invoiceNumber} - ${customer.name}`
        });
        
        // Crear líneas de factura
        for (const line of invoiceLines) {
          await db.InvoiceLine.create({
            invoiceId: invoice.id,
            ...line
          });
        }
        
        totalInvoices++;
      }
      
      console.log(`✅ ${numInvoices} facturas creadas para ${tenant.name}`);
    }
    console.log();

    // ===========================================
    // 10. REFERRALS (Algunos tenants vinieron por afiliados)
    // ===========================================
    console.log('🔗 Creando referrals...');
    const activeAffiliates = affiliates.filter(a => a.status === 'active');
    
    for (let i = 0; i < Math.min(3, tenants.length); i++) {
      const tenant = tenants[i];
      const affiliate = activeAffiliates[i % activeAffiliates.length];
      
      await db.Referral.create({
        affiliateId: affiliate.id,
        tenantId: tenant.id,
        referralCode: `REF${affiliate.code}${tenant.id.slice(-4).toUpperCase()}`,
        status: 'converted',
        convertedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
      
      console.log(`✅ Referral: ${affiliate.name} → ${tenant.name}`);
    }
    console.log();

    // ===========================================
    // 11. COMISIONES
    // ===========================================
    console.log('💰 Creando comisiones...');
    const referrals = await db.Referral.findAll();
    
    for (const referral of referrals) {
      const subscription = await db.Subscription.findOne({ 
        where: { tenantId: referral.tenantId } 
      });
      
      if (subscription && subscription.status === 'active') {
        // Obtener el affiliate para calcular la comisión
        const affiliate = await db.Affiliate.findByPk(referral.affiliateId);
        const commissionAmount = subscription.priceMonthly * (affiliate.commissionRate / 100);
        
        await db.Commission.create({
          affiliateId: referral.affiliateId,
          referralId: referral.id,
          subscriptionId: subscription.id,
          amount: commissionAmount,
          commissionRate: affiliate.commissionRate,
          status: 'pending'
        });
        
        // Obtener el tenant para el log
        const tenant = await db.Tenant.findByPk(referral.tenantId);
        console.log(`✅ Comisión: ${affiliate.name} → ${tenant.name} (€${commissionAmount.toFixed(2)})`);
      }
    }
    console.log();

    // ===========================================
    // 12. PAGOS (Algunas facturas pagadas)
    // ===========================================
    console.log('💳 Creando pagos...');
    const paidInvoices = await db.Invoice.findAll({ 
      where: { status: 'paid' }
    });
    
    for (const invoice of paidInvoices) {
        // Obtener la suscripción del tenant para el pago
        const subscription = await db.Subscription.findOne({ 
          where: { tenantId: invoice.tenantId } 
        });
        
        if (subscription) {
          await db.Payment.create({
            tenantId: invoice.tenantId,
            subscriptionId: subscription.id,
            amount: invoice.total,
            currency: 'eur',
            status: 'succeeded',
            plan: subscription.plan,
            periodStart: new Date(new Date(invoice.date).getTime() - 30 * 24 * 60 * 60 * 1000),
            periodEnd: new Date(new Date(invoice.date).getTime() + 30 * 24 * 60 * 60 * 1000)
          });
        }
    }
    
    console.log(`✅ ${paidInvoices.length} pagos creados\n`);

    // ===========================================
    // 13. ACTIVITY LOGS
    // ===========================================
    console.log('📝 Creando logs de actividad...');
    const activities = [
      'user_login',
      'invoice_created',
      'customer_added',
      'product_added',
      'settings_updated',
      'payment_received'
    ];
    
    for (const tenant of tenants) {
      for (let i = 0; i < 10; i++) {
        await db.ActivityLog.create({
          tenantId: tenant.id,
          userId: users.find(u => u.tenantId === tenant.id)?.id,
          action: activities[Math.floor(Math.random() * activities.length)],
          details: `Actividad de prueba ${i + 1}`,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Test Browser)'
        });
      }
      console.log(`✅ 10 logs creados para ${tenant.name}`);
    }
    console.log();

    // ===========================================
    // 14. LOPD DATA (Consentimientos)
    // ===========================================
    console.log('🔒 Creando datos LOPD...');
    for (const tenant of tenants) {
      // Crear consentimientos para algunos clientes
      const customers = await db.Customer.findAll({ 
        where: { tenantId: tenant.id },
        limit: 3
      });
      
      for (const customer of customers) {
        await db.Consent.create({
          tenantId: tenant.id,
          customerId: customer.id,
          email: customer.email || `cliente${customer.id.slice(-4)}@example.com`,
          consentType: 'marketing',
          granted: Math.random() > 0.3,
          grantedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          source: 'website',
          version: '1.0'
        });
      }
      
      await db.PrivacyPolicy.create({
        tenantId: tenant.id,
        version: '1.0',
        title: 'Política de Privacidad',
        content: 'Política de privacidad de prueba para cumplimiento LOPD',
        isActive: true,
        effectiveDate: new Date(),
        language: 'es'
      });
      
      console.log(`✅ Datos LOPD creados para ${tenant.name}`);
    }
    console.log();

    // ===========================================
    // RESUMEN FINAL
    // ===========================================
    console.log('🎉 DATOS DE PRUEBA COMPLETOS CREADOS!\n');
    
    console.log('📊 RESUMEN DEL SISTEMA:');
    console.log(`   👑 Superadmin: 1`);
    console.log(`   🏢 Tenants: ${await db.Tenant.count()}`);
    console.log(`   👥 Usuarios: ${await db.User.count()}`);
    console.log(`   👤 Clientes: ${await db.Customer.count()}`);
    console.log(`   📦 Productos: ${await db.Product.count()}`);
    console.log(`   🧾 Facturas: ${await db.Invoice.count()}`);
    console.log(`   💳 Pagos: ${await db.Payment.count()}`);
    console.log(`   🔗 Afiliados: ${await db.Affiliate.count()}`);
    console.log(`   💰 Comisiones: ${await db.Commission.count()}`);
    console.log(`   📝 Logs: ${await db.ActivityLog.count()}\n`);
    
    console.log('🔐 CREDENCIALES DE ACCESO:\n');
    console.log('   👑 SUPERADMIN:');
    console.log('      Email: super@admin.com');
    console.log('      Password: super123\n');
    
    console.log('   🏢 EMPRESAS TENANT:');
    for (let i = 0; i < tenants.length; i++) {
      const tenant = tenants[i];
      console.log(`      ${i + 1}. ${tenant.name}`);
      console.log(`         Email: ${tenant.email}`);
      console.log(`         Password: admin123`);
      console.log(`         Plan: ${await db.Subscription.findOne({ where: { tenantId: tenant.id } }).then(s => s?.plan || 'N/A')}`);
      console.log(`         Status: ${tenant.status}\n`);
    }
    
    console.log('🔗 ENLACES DE AFILIADO:');
    for (const affiliate of affiliates.filter(a => a.status === 'active')) {
      const link = AffiliateService.generateAffiliateLink(affiliate.code);
      console.log(`   ${affiliate.name}: ${link}`);
    }
    console.log();
    
    console.log('🚀 Para iniciar el sistema:');
    console.log('   Backend: cd backend && npm run dev');
    console.log('   Frontend: cd frontend && npm start');
    console.log('   URL: http://localhost:3000\n');
    
    console.log('✅ Sistema listo para pruebas completas!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
    process.exit(1);
  }
};

createCompleteTestData();
