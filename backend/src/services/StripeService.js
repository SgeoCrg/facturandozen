const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Tenant, Subscription, Payment } = require('../models');
const logger = require('../utils/logger');

class StripeService {
  constructor() {
    this.stripe = stripe;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  }

  /**
   * Crear cliente en Stripe
   */
  async createCustomer(tenant) {
    try {
      const customer = await this.stripe.customers.create({
        email: tenant.email,
        name: tenant.name,
        metadata: {
          tenantId: tenant.id,
          nif: tenant.nif
        }
      });

      logger.info(`Stripe customer created: ${customer.id} for tenant: ${tenant.id}`);
      return customer;
    } catch (error) {
      logger.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Crear sesión de checkout para suscripción
   */
  async createCheckoutSession(tenant, plan, successUrl, cancelUrl) {
    try {
      const subscription = await Subscription.findOne({
        where: { tenantId: tenant.id }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Precios Stripe (configurar en dashboard)
      const priceIds = {
        basic: process.env.STRIPE_BASIC_PRICE_ID,
        pro: process.env.STRIPE_PRO_PRICE_ID
      };

      const priceId = priceIds[plan];
      if (!priceId) {
        throw new Error(`Price ID not found for plan: ${plan}`);
      }

      const session = await this.stripe.checkout.sessions.create({
        customer_email: tenant.email,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          tenantId: tenant.id,
          subscriptionId: subscription.id,
          plan: plan
        },
        subscription_data: {
          metadata: {
            tenantId: tenant.id,
            subscriptionId: subscription.id,
            plan: plan
          }
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        tax_id_collection: {
          enabled: true,
        }
      });

      logger.info(`Checkout session created: ${session.id} for tenant: ${tenant.id}`);
      return session;
    } catch (error) {
      logger.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Crear portal de facturación para gestión de suscripción
   */
  async createBillingPortalSession(tenant, returnUrl) {
    try {
      const subscription = await Subscription.findOne({
        where: { tenantId: tenant.id }
      });

      if (!subscription || !subscription.stripeCustomerId) {
        throw new Error('Stripe customer not found');
      }

      const session = await this.stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: returnUrl,
      });

      logger.info(`Billing portal session created for tenant: ${tenant.id}`);
      return session;
    } catch (error) {
      logger.error('Error creating billing portal session:', error);
      throw error;
    }
  }

  /**
   * Cancelar suscripción
   */
  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    try {
      const subscription = await Subscription.findByPk(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (!subscription.stripeSubscriptionId) {
        throw new Error('Stripe subscription not found');
      }

      let stripeSubscription;
      if (cancelAtPeriodEnd) {
        // Cancelar al final del período
        stripeSubscription = await this.stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          {
            cancel_at_period_end: true,
          }
        );
      } else {
        // Cancelar inmediatamente
        stripeSubscription = await this.stripe.subscriptions.cancel(
          subscription.stripeSubscriptionId
        );
      }

      // Actualizar en BD
      await subscription.update({
        cancelAtPeriodEnd: cancelAtPeriodEnd,
        canceledAt: cancelAtPeriodEnd ? null : new Date(),
        status: cancelAtPeriodEnd ? 'active' : 'cancelled'
      });

      logger.info(`Subscription ${subscriptionId} cancelled (at period end: ${cancelAtPeriodEnd})`);
      return stripeSubscription;
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Reactivar suscripción cancelada
   */
  async reactivateSubscription(subscriptionId) {
    try {
      const subscription = await Subscription.findByPk(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (!subscription.stripeSubscriptionId) {
        throw new Error('Stripe subscription not found');
      }

      const stripeSubscription = await this.stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: false,
        }
      );

      // Actualizar en BD
      await subscription.update({
        cancelAtPeriodEnd: false,
        canceledAt: null,
        status: 'active'
      });

      logger.info(`Subscription ${subscriptionId} reactivated`);
      return stripeSubscription;
    } catch (error) {
      logger.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  /**
   * Cambiar plan de suscripción
   */
  async changePlan(subscriptionId, newPlan) {
    try {
      const subscription = await Subscription.findByPk(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (!subscription.stripeSubscriptionId) {
        throw new Error('Stripe subscription not found');
      }

      const priceIds = {
        basic: process.env.STRIPE_BASIC_PRICE_ID,
        pro: process.env.STRIPE_PRO_PRICE_ID
      };

      const newPriceId = priceIds[newPlan];
      if (!newPriceId) {
        throw new Error(`Price ID not found for plan: ${newPlan}`);
      }

      // Obtener suscripción actual de Stripe
      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      // Actualizar suscripción con nuevo precio
      const updatedSubscription = await this.stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          proration_behavior: 'create_prorations',
        }
      );

      // Actualizar en BD
      const newPrice = newPlan === 'basic' ? 19.00 : 49.00;
      await subscription.update({
        plan: newPlan,
        priceMonthly: newPrice,
        stripePriceId: newPriceId
      });

      logger.info(`Subscription ${subscriptionId} changed to plan: ${newPlan}`);
      return updatedSubscription;
    } catch (error) {
      logger.error('Error changing plan:', error);
      throw error;
    }
  }

  /**
   * Procesar webhook de Stripe
   */
  async handleWebhook(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );

      logger.info(`Processing Stripe webhook: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object);
          break;

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      logger.error('Error processing webhook:', error);
      throw error;
    }
  }

  /**
   * Manejar checkout completado
   */
  async handleCheckoutCompleted(session) {
    const { tenantId, subscriptionId, plan } = session.metadata;
    
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Actualizar suscripción con datos de Stripe
    await subscription.update({
      stripeCustomerId: session.customer,
      status: 'active',
      plan: plan,
      priceMonthly: plan === 'basic' ? 19.00 : 49.00,
      currentPeriodStart: new Date(session.subscription_details?.current_period_start * 1000),
      currentPeriodEnd: new Date(session.subscription_details?.current_period_end * 1000)
    });

    logger.info(`Checkout completed for tenant: ${tenantId}`);
  }

  /**
   * Manejar suscripción creada
   */
  async handleSubscriptionCreated(stripeSubscription) {
    const { tenantId, subscriptionId } = stripeSubscription.metadata;
    
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    await subscription.update({
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: stripeSubscription.customer,
      status: 'active',
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
    });

    logger.info(`Subscription created for tenant: ${tenantId}`);
  }

  /**
   * Manejar suscripción actualizada
   */
  async handleSubscriptionUpdated(stripeSubscription) {
    const { tenantId } = stripeSubscription.metadata;
    
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const status = stripeSubscription.status === 'active' ? 'active' : 
                   stripeSubscription.status === 'canceled' ? 'cancelled' : 'expired';

    await subscription.update({
      status: status,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
    });

    logger.info(`Subscription updated for tenant: ${tenantId}`);
  }

  /**
   * Manejar suscripción eliminada
   */
  async handleSubscriptionDeleted(stripeSubscription) {
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    await subscription.update({
      status: 'cancelled',
      canceledAt: new Date()
    });

    logger.info(`Subscription deleted: ${stripeSubscription.id}`);
  }

  /**
   * Manejar pago exitoso
   */
  async handlePaymentSucceeded(invoice) {
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: invoice.subscription }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Crear registro de pago
    const payment = await Payment.create({
      tenantId: subscription.tenantId,
      subscriptionId: subscription.id,
      stripePaymentIntentId: invoice.payment_intent,
      stripeSubscriptionId: invoice.subscription,
      stripeCustomerId: invoice.customer,
      amount: invoice.amount_paid / 100, // Convertir de centavos
      currency: invoice.currency,
      status: 'succeeded',
      plan: subscription.plan,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000)
    });

    // Actualizar período de suscripción
    await subscription.update({
      currentPeriodStart: new Date(invoice.period_start * 1000),
      currentPeriodEnd: new Date(invoice.period_end * 1000),
      status: 'active'
    });

    // Generar factura de plataforma automáticamente
    try {
      const PlatformInvoiceService = require('./PlatformInvoiceService');
      await PlatformInvoiceService.generateInvoiceFromPayment(payment);
      logger.info(`Platform invoice generated for payment: ${payment.id}`);
    } catch (invoiceError) {
      logger.error('Error generating platform invoice', {
        error: invoiceError.message,
        paymentId: payment.id
      });
      // No fallar el pago por error en factura
    }

    logger.info(`Payment succeeded for subscription: ${subscription.id}`);
  }

  /**
   * Manejar pago fallido
   */
  async handlePaymentFailed(invoice) {
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: invoice.subscription }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Crear registro de pago fallido
    await Payment.create({
      tenantId: subscription.tenantId,
      subscriptionId: subscription.id,
      stripePaymentIntentId: invoice.payment_intent,
      stripeSubscriptionId: invoice.subscription,
      stripeCustomerId: invoice.customer,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: 'failed',
      plan: subscription.plan,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      failureReason: invoice.last_payment_error?.message || 'Payment failed'
    });

    logger.info(`Payment failed for subscription: ${subscription.id}`);
  }

  /**
   * Manejar fin de trial próximo
   */
  async handleTrialWillEnd(stripeSubscription) {
    const { tenantId } = stripeSubscription.metadata;
    
    // Aquí podrías enviar un email de recordatorio
    logger.info(`Trial will end soon for tenant: ${tenantId}`);
  }

  /**
   * Obtener información de suscripción desde Stripe
   */
  async getSubscriptionInfo(subscriptionId) {
    try {
      const subscription = await Subscription.findByPk(subscriptionId);
      if (!subscription || !subscription.stripeSubscriptionId) {
        return null;
      }

      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      return {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
        plan: subscription.plan,
        priceMonthly: subscription.priceMonthly
      };
    } catch (error) {
      logger.error('Error getting subscription info:', error);
      throw error;
    }
  }
}

module.exports = new StripeService();
