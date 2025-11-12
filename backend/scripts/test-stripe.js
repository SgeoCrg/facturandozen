#!/usr/bin/env node

/**
 * Script para probar la integración de Stripe
 * 
 * Uso:
 * node scripts/test-stripe.js
 */

require('dotenv').config();
const StripeService = require('../src/services/StripeService');
const { Tenant, Subscription } = require('../src/models');

async function testStripe() {
  try {
    console.log('🧪 Probando integración de Stripe...\n');

    // Verificar configuración
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY no encontrada en .env');
    }

    if (!process.env.STRIPE_BASIC_PRICE_ID) {
      throw new Error('STRIPE_BASIC_PRICE_ID no encontrada en .env');
    }

    console.log('✅ Configuración verificada\n');

    // Crear tenant de prueba
    console.log('👤 Creando tenant de prueba...');
    
    const testTenant = await Tenant.create({
      name: 'Empresa Test Stripe',
      nif: 'B12345678',
      email: 'test@stripe.com',
      address: 'Calle Test 123, Madrid',
      status: 'trial'
    });

    console.log(`✅ Tenant creado: ${testTenant.id}`);

    // Crear suscripción de prueba
    console.log('📋 Creando suscripción de prueba...');
    
    const testSubscription = await Subscription.create({
      tenantId: testTenant.id,
      plan: 'basic',
      priceMonthly: 19.00,
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      maxInvoices: 50
    });

    console.log(`✅ Suscripción creada: ${testSubscription.id}`);

    // Probar creación de cliente Stripe
    console.log('🏢 Probando creación de cliente Stripe...');
    
    const stripeCustomer = await StripeService.createCustomer(testTenant);
    console.log(`✅ Cliente Stripe creado: ${stripeCustomer.id}`);

    // Actualizar suscripción con customer ID
    await testSubscription.update({
      stripeCustomerId: stripeCustomer.id
    });

    // Probar creación de sesión de checkout
    console.log('💳 Probando creación de sesión de checkout...');
    
    const checkoutSession = await StripeService.createCheckoutSession(
      testTenant,
      'basic',
      'http://localhost:3000/billing/success',
      'http://localhost:3000/billing/cancel'
    );

    console.log(`✅ Sesión de checkout creada: ${checkoutSession.id}`);
    console.log(`🔗 URL de checkout: ${checkoutSession.url}`);

    // Probar portal de facturación
    console.log('⚙️ Probando portal de facturación...');
    
    const portalSession = await StripeService.createBillingPortalSession(
      testTenant,
      'http://localhost:3000/billing'
    );

    console.log(`✅ Portal de facturación creado: ${portalSession.url}`);

    console.log('\n🎉 ¡Todas las pruebas pasaron correctamente!');
    console.log('\n📋 Resumen:');
    console.log(`- Tenant: ${testTenant.name} (${testTenant.id})`);
    console.log(`- Suscripción: ${testSubscription.plan} (${testSubscription.id})`);
    console.log(`- Cliente Stripe: ${stripeCustomer.id}`);
    console.log(`- Checkout URL: ${checkoutSession.url}`);
    console.log(`- Portal URL: ${portalSession.url}`);

    console.log('\n🧹 Limpiando datos de prueba...');
    await testSubscription.destroy();
    await testTenant.destroy();
    console.log('✅ Datos de prueba eliminados');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testStripe();
}

module.exports = testStripe;
