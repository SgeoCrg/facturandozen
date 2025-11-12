const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function configureWebhook() {
  try {
    console.log('🔗 Configurando webhook en Stripe...\n');

    // URL del webhook (ajustar según tu dominio)
    const webhookUrl = process.env.WEBHOOK_URL || 'https://tu-dominio.com/api/billing/webhook';
    
    console.log(`📡 URL del webhook: ${webhookUrl}\n`);

    // Eventos que queremos escuchar
    const events = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated', 
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
      'customer.subscription.trial_will_end'
    ];

    console.log('📋 Eventos a configurar:');
    events.forEach(event => {
      console.log(`   - ${event}`);
    });
    console.log('');

    // Crear webhook endpoint
    const webhookEndpoint = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: events,
      description: 'Facturando Zen - Webhook para suscripciones y pagos'
    });

    console.log('✅ Webhook creado exitosamente!');
    console.log(`   ID: ${webhookEndpoint.id}`);
    console.log(`   URL: ${webhookEndpoint.url}`);
    console.log(`   Secret: ${webhookEndpoint.secret}\n`);

    // Generar archivo de configuración
    const configContent = `# Webhook Configuration - Generated ${new Date().toISOString()}

# Webhook Secret (añadir a tu .env)
STRIPE_WEBHOOK_SECRET=${webhookEndpoint.secret}

# Webhook URL (ya configurada en Stripe)
WEBHOOK_URL=${webhookUrl}

# Eventos configurados:
${events.map(event => `# - ${event}`).join('\n')}

# Instrucciones:
# 1. Copia STRIPE_WEBHOOK_SECRET a tu archivo .env
# 2. Actualiza WEBHOOK_URL con tu dominio real
# 3. Reinicia tu servidor backend
# 4. Prueba el webhook con: node scripts/test-webhook.js
`;

    require('fs').writeFileSync('.env.webhook', configContent);
    console.log('📄 Archivo .env.webhook creado con la configuración\n');

    console.log('🎉 ¡Webhook configurado exitosamente!');
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('1. Copia STRIPE_WEBHOOK_SECRET a tu archivo .env');
    console.log('2. Actualiza WEBHOOK_URL con tu dominio real');
    console.log('3. Reinicia tu servidor backend');
    console.log('4. Prueba el webhook: node scripts/test-webhook.js');

    return webhookEndpoint;

  } catch (error) {
    console.error('❌ Error configurando webhook:', error.message);
    
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
  configureWebhook()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = configureWebhook;
