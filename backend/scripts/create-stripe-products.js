const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createStripeProducts() {
  try {
    console.log('🚀 Creando productos Stripe...\n');

    // Crear producto BASIC
    console.log('📦 Creando producto BASIC...');
    const basicProduct = await stripe.products.create({
      name: 'Facturando Zen - BASIC',
      description: 'Plan básico con facturas ilimitadas, clientes, productos y PDF profesional',
      metadata: {
        plan: 'basic',
        features: 'unlimited_invoices,clients,products,pdf,support'
      }
    });

    // Crear precio BASIC (€19/mes)
    const basicPrice = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 1900, // €19.00 en centavos
      currency: 'eur',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan: 'basic'
      }
    });

    console.log(`✅ BASIC creado:`);
    console.log(`   Product ID: ${basicProduct.id}`);
    console.log(`   Price ID: ${basicPrice.id}`);
    console.log(`   Precio: €19/mes\n`);

    // Crear producto PRO
    console.log('📦 Creando producto PRO...');
    const proProduct = await stripe.products.create({
      name: 'Facturando Zen - PRO',
      description: 'Plan profesional con Verifactu integrado, firma digital y soporte prioritario',
      metadata: {
        plan: 'pro',
        features: 'unlimited_invoices,clients,products,pdf,verifactu,digital_signature,priority_support'
      }
    });

    // Crear precio PRO (€49/mes)
    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 4900, // €49.00 en centavos
      currency: 'eur',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan: 'pro'
      }
    });

    console.log(`✅ PRO creado:`);
    console.log(`   Product ID: ${proProduct.id}`);
    console.log(`   Price ID: ${proPrice.id}`);
    console.log(`   Precio: €49/mes\n`);

    // Crear precios anuales con descuento (10%)
    console.log('📦 Creando precios anuales...');
    
    const basicAnnualPrice = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 20520, // €205.20 (10% descuento)
      currency: 'eur',
      recurring: {
        interval: 'year'
      },
      metadata: {
        plan: 'basic',
        interval: 'year'
      }
    });

    const proAnnualPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 52920, // €529.20 (10% descuento)
      currency: 'eur',
      recurring: {
        interval: 'year'
      },
      metadata: {
        plan: 'pro',
        interval: 'year'
      }
    });

    console.log(`✅ Precios anuales creados:`);
    console.log(`   BASIC anual: ${basicAnnualPrice.id} (€205.20/año)`);
    console.log(`   PRO anual: ${proAnnualPrice.id} (€529.20/año)\n`);

    // Generar archivo .env.stripe
    const envContent = `# Stripe Configuration - Generated ${new Date().toISOString()}
STRIPE_SECRET_KEY=${process.env.STRIPE_SECRET_KEY}
STRIPE_BASIC_PRICE_ID=${basicPrice.id}
STRIPE_PRO_PRICE_ID=${proPrice.id}
STRIPE_BASIC_ANNUAL_PRICE_ID=${basicAnnualPrice.id}
STRIPE_PRO_ANNUAL_PRICE_ID=${proAnnualPrice.id}

# Frontend
REACT_APP_STRIPE_PUBLISHABLE_KEY=${process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_PUBLISHABLE_KEY_HERE'}

# Webhook (configurar después)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
`;

    require('fs').writeFileSync('.env.stripe', envContent);
    console.log('📄 Archivo .env.stripe creado con las configuraciones\n');

    console.log('🎉 ¡Productos Stripe creados exitosamente!');
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('1. Copia las variables de .env.stripe a tu archivo .env');
    console.log('2. Configura el webhook en Stripe Dashboard');
    console.log('3. Ejecuta: node scripts/test-stripe.js');

    return {
      basic: { product: basicProduct.id, price: basicPrice.id, annual: basicAnnualPrice.id },
      pro: { product: proProduct.id, price: proPrice.id, annual: proAnnualPrice.id }
    };

  } catch (error) {
    console.error('❌ Error creando productos Stripe:', error.message);
    
    if (error.message.includes('Invalid API Key')) {
      console.log('\n💡 Solución:');
      console.log('1. Verifica que STRIPE_SECRET_KEY sea correcta');
      console.log('2. Asegúrate de que la clave empiece con sk_test_ o sk_live_');
      console.log('3. Obtén tu clave en: https://dashboard.stripe.com/apikeys');
    }
    
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createStripeProducts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = createStripeProducts;
