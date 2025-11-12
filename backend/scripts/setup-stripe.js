#!/usr/bin/env node

/**
 * Script para configurar Stripe - Crear productos y precios
 * 
 * Uso:
 * node scripts/setup-stripe.js
 * 
 * Requiere:
 * - STRIPE_SECRET_KEY en .env
 * - Cuenta Stripe configurada
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupStripe() {
  try {
    console.log('🚀 Configurando Stripe...\n');

    // Verificar que tenemos la clave
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY no encontrada en .env');
    }

    // Crear productos
    console.log('📦 Creando productos...');

    const basicProduct = await stripe.products.create({
      name: 'Plan BASIC',
      description: 'Plan básico de facturación - Facturas ilimitadas, clientes, productos, PDF profesional',
      metadata: {
        plan: 'basic',
        features: 'unlimited_invoices,clients,products,pdf,support'
      }
    });

    const proProduct = await stripe.products.create({
      name: 'Plan PRO',
      description: 'Plan profesional con Verifactu integrado - Todo de BASIC + Verifactu, firma digital, soporte prioritario',
      metadata: {
        plan: 'pro',
        features: 'unlimited_invoices,clients,products,pdf,support,verifactu,digital_signature,priority_support'
      }
    });

    console.log(`✅ Producto BASIC creado: ${basicProduct.id}`);
    console.log(`✅ Producto PRO creado: ${proProduct.id}\n`);

    // Crear precios mensuales
    console.log('💰 Creando precios mensuales...');

    const basicPrice = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 1900, // €19.00 en centavos
      currency: 'eur',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan: 'basic',
        interval: 'monthly'
      }
    });

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 4900, // €49.00 en centavos
      currency: 'eur',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan: 'pro',
        interval: 'monthly'
      }
    });

    console.log(`✅ Precio BASIC mensual creado: ${basicPrice.id}`);
    console.log(`✅ Precio PRO mensual creado: ${proPrice.id}\n`);

    // Crear precios anuales (con descuento)
    console.log('💰 Creando precios anuales (10% descuento)...');

    const basicPriceAnnual = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 20520, // €19.00 * 12 * 0.9 = €205.20 en centavos
      currency: 'eur',
      recurring: {
        interval: 'year'
      },
      metadata: {
        plan: 'basic',
        interval: 'annual',
        discount: '10%'
      }
    });

    const proPriceAnnual = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 52920, // €49.00 * 12 * 0.9 = €529.20 en centavos
      currency: 'eur',
      recurring: {
        interval: 'year'
      },
      metadata: {
        plan: 'pro',
        interval: 'annual',
        discount: '10%'
      }
    });

    console.log(`✅ Precio BASIC anual creado: ${basicPriceAnnual.id}`);
    console.log(`✅ Precio PRO anual creado: ${proPriceAnnual.id}\n`);

    // Generar archivo .env actualizado
    console.log('📝 Generando configuración...');

    const envConfig = `
# Stripe Configuration
STRIPE_SECRET_KEY=${process.env.STRIPE_SECRET_KEY}
STRIPE_PUBLISHABLE_KEY=${process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_...'}
STRIPE_WEBHOOK_SECRET=${process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...'}

# Stripe Price IDs
STRIPE_BASIC_PRICE_ID=${basicPrice.id}
STRIPE_PRO_PRICE_ID=${proPrice.id}
STRIPE_BASIC_PRICE_ANNUAL_ID=${basicPriceAnnual.id}
STRIPE_PRO_PRICE_ANNUAL_ID=${proPriceAnnual.id}

# Stripe Product IDs
STRIPE_BASIC_PRODUCT_ID=${basicProduct.id}
STRIPE_PRO_PRODUCT_ID=${proProduct.id}
`;

    console.log('📋 Configuración generada:');
    console.log(envConfig);

    // Guardar en archivo
    const fs = require('fs');
    const path = require('path');
    
    const envPath = path.join(__dirname, '..', '.env.stripe');
    fs.writeFileSync(envPath, envConfig);
    
    console.log(`✅ Configuración guardada en: ${envPath}`);
    console.log('\n🎉 ¡Stripe configurado correctamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Copia las variables de .env.stripe a tu .env');
    console.log('2. Configura el webhook en Stripe Dashboard:');
    console.log('   - URL: https://tu-dominio.com/api/billing/webhook');
    console.log('   - Eventos: checkout.session.completed, customer.subscription.*, invoice.payment_*');
    console.log('3. Actualiza STRIPE_WEBHOOK_SECRET en .env');
    console.log('4. ¡Listo para facturar! 🚀');

  } catch (error) {
    console.error('❌ Error configurando Stripe:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('\n💡 Solución:');
      console.log('1. Verifica que STRIPE_SECRET_KEY sea correcta');
      console.log('2. Asegúrate de que la clave empiece con sk_test_ o sk_live_');
      console.log('3. Obtén tu clave en: https://dashboard.stripe.com/apikeys');
    }
    
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupStripe();
}

module.exports = setupStripe;
