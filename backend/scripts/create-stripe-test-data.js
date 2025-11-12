const { db } = require('../src/models');

async function createStripeTestData() {
  try {
    console.log('💳 Creando datos de prueba para Stripe...\n');

    // Obtener suscripciones existentes
    const subscriptions = await db.Subscription.findAll();
    
    for (const subscription of subscriptions) {
      // Actualizar suscripciones con datos de Stripe
      const stripeData = {
        stripeCustomerId: `cus_${Math.random().toString(36).substr(2, 14)}`,
        stripeSubscriptionId: `sub_${Math.random().toString(36).substr(2, 14)}`,
        stripePriceId: subscription.plan === 'pro' ? 'price_pro_monthly' : 'price_basic_monthly',
        cancelAtPeriodEnd: Math.random() > 0.8, // 20% canceladas
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
      };

      await db.Subscription.update(stripeData, {
        where: { id: subscription.id }
      });

      // Crear eventos de webhook de Stripe
      const webhookEvents = [
        {
          tenantId: subscription.tenantId,
          subscriptionId: subscription.id,
          eventType: 'invoice.payment_succeeded',
          stripeEventId: `evt_${Math.random().toString(36).substr(2, 14)}`,
          processed: true,
          data: JSON.stringify({
            id: `in_${Math.random().toString(36).substr(2, 14)}`,
            amount_paid: subscription.priceMonthly * 100, // Stripe usa centavos
            currency: 'eur',
            status: 'paid'
          })
        },
        {
          tenantId: subscription.tenantId,
          subscriptionId: subscription.id,
          eventType: 'customer.subscription.updated',
          stripeEventId: `evt_${Math.random().toString(36).substr(2, 14)}`,
          processed: true,
          data: JSON.stringify({
            id: subscription.stripeSubscriptionId,
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
          })
        }
      ];

      for (const event of webhookEvents) {
        await db.StripeWebhookEvent.create(event);
      }

      console.log(`✅ Datos Stripe creados para suscripción ${subscription.id}`);
    }

    console.log('\n🎉 Datos de Stripe creados exitosamente!');
    
  } catch (error) {
    console.error('❌ Error creando datos de Stripe:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createStripeTestData()
    .then(() => {
      console.log('✅ Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = createStripeTestData;