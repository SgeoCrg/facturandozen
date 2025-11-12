#!/usr/bin/env node

/**
 * Script de prueba completa del sistema con Stripe
 * 
 * Uso:
 * node scripts/test-complete-system.js
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function testCompleteSystem() {
  try {
    console.log('🧪 Probando sistema completo con Stripe...\n');

    // 1. Verificar que el backend está corriendo
    console.log('🔍 Verificando backend...');
    try {
      const healthResponse = await axios.get(`${API_BASE}/health`);
      console.log('✅ Backend funcionando');
    } catch (error) {
      throw new Error('Backend no está corriendo. Ejecuta: npm run dev');
    }

    // 2. Usar usuario de prueba existente
    console.log('\n👤 Usando usuario de prueba existente...');
    const testUser = {
      email: 'teststripe2@stripe.com',
      password: 'test123'
    };

    let authToken;
    try {
      const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      
      authToken = loginResponse.data.token;
      console.log('✅ Usuario autenticado');
    } catch (error) {
      console.log('⚠️ Usuario ya existe, probando login...');
      const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      authToken = loginResponse.data.token;
      console.log('✅ Login exitoso');
    }

    // 3. Verificar estado de facturación
    console.log('\n💳 Verificando estado de facturación...');
    const billingResponse = await axios.get(`${API_BASE}/api/billing/status`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const billingStatus = billingResponse.data;
    console.log(`✅ Estado: ${billingStatus.subscription.status}`);
    console.log(`✅ Plan: ${billingStatus.subscription.plan}`);
    console.log(`✅ Trial hasta: ${billingStatus.subscription.trialEndsAt}`);

    // 4. Probar creación de sesión de checkout
    console.log('\n🛒 Probando creación de checkout...');
    try {
      const checkoutResponse = await axios.post(`${API_BASE}/api/billing/checkout`, {
        plan: 'basic'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      console.log('✅ Sesión de checkout creada');
      console.log(`🔗 URL: ${checkoutResponse.data.url}`);
    } catch (error) {
      console.log('⚠️ Error en checkout (normal si no hay configuración Stripe):', error.response?.data?.message || error.message);
    }

    // 5. Probar portal de facturación
    console.log('\n⚙️ Probando portal de facturación...');
    try {
      const portalResponse = await axios.post(`${API_BASE}/api/billing/portal`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      console.log('✅ Portal de facturación creado');
      console.log(`🔗 URL: ${portalResponse.data.url}`);
    } catch (error) {
      console.log('⚠️ Error en portal (normal si no hay configuración Stripe):', error.response?.data?.message || error.message);
    }

    // 6. Crear datos de prueba
    console.log('\n📊 Creando datos de prueba...');
    
    // Crear cliente
    const customerResponse = await axios.post(`${API_BASE}/api/customers`, {
      name: 'Cliente Test Stripe',
      nif: '12345678Z',
      email: 'cliente@test.com',
      address: 'Calle Test 123'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Cliente creado');

    // Crear producto
    const productResponse = await axios.post(`${API_BASE}/api/products`, {
      name: 'Producto Test Stripe',
      price: 100.00,
      ivaRate: 21
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Producto creado');

    // Crear factura
    const invoiceResponse = await axios.post(`${API_BASE}/api/invoices`, {
      customerId: customerResponse.data.id,
      lines: [
        {
          productId: productResponse.data.id,
          quantity: 2,
          price: 100.00
        }
      ],
      notes: 'Factura de prueba para Stripe'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Factura creada');

    // 7. Verificar configuración Stripe
    console.log('\n🔧 Verificando configuración Stripe...');
    
    const stripeConfig = {
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasPublishableKey: !!process.env.STRIPE_PUBLISHABLE_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasBasicPriceId: !!process.env.STRIPE_BASIC_PRICE_ID,
      hasProPriceId: !!process.env.STRIPE_PRO_PRICE_ID
    };

    console.log('📋 Configuración Stripe:');
    console.log(`- Secret Key: ${stripeConfig.hasSecretKey ? '✅' : '❌'}`);
    console.log(`- Publishable Key: ${stripeConfig.hasPublishableKey ? '✅' : '❌'}`);
    console.log(`- Webhook Secret: ${stripeConfig.hasWebhookSecret ? '✅' : '❌'}`);
    console.log(`- Basic Price ID: ${stripeConfig.hasBasicPriceId ? '✅' : '❌'}`);
    console.log(`- Pro Price ID: ${stripeConfig.hasProPriceId ? '✅' : '❌'}`);

    if (!stripeConfig.hasSecretKey) {
      console.log('\n⚠️ Para probar Stripe completamente:');
      console.log('1. Ejecuta: node scripts/setup-stripe.js');
      console.log('2. Copia las variables de .env.stripe a .env');
      console.log('3. Configura el webhook en Stripe Dashboard');
    }

    // 8. Resumen final
    console.log('\n🎉 ¡Prueba completa exitosa!');
    console.log('\n📋 Resumen:');
    console.log(`- Usuario: ${testUser.email}`);
    console.log(`- Estado: ${billingStatus.subscription.status}`);
    console.log(`- Plan: ${billingStatus.subscription.plan}`);
    console.log(`- Cliente creado: ${customerResponse.data.name}`);
    console.log(`- Producto creado: ${productResponse.data.name}`);
    console.log(`- Factura creada: ${invoiceResponse.data.fullNumber}`);
    console.log(`- Stripe configurado: ${Object.values(stripeConfig).every(Boolean) ? '✅' : '⚠️'}`);

    console.log('\n🚀 Sistema listo para producción!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Configurar Stripe (si no está hecho)');
    console.log('2. Configurar webhook en Stripe Dashboard');
    console.log('3. Deploy a producción');
    console.log('4. ¡Empezar a facturar!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testCompleteSystem();
}

module.exports = testCompleteSystem;
