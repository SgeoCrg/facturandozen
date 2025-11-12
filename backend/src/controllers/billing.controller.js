const StripeService = require('../services/StripeService');
const { Tenant, Subscription, Payment } = require('../models');
const logger = require('../utils/logger');

class BillingController {
  /**
   * Crear sesión de checkout para suscripción
   */
  async createCheckoutSession(req, res) {
    try {
      const { plan } = req.body;
      const tenantId = req.user.tenantId;

      if (!plan || !['basic', 'pro'].includes(plan)) {
        return res.status(400).json({
          success: false,
          message: 'Plan inválido. Debe ser "basic" o "pro"'
        });
      }

      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant no encontrado'
        });
      }

      const subscription = await Subscription.findOne({
        where: { tenantId: tenantId }
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Suscripción no encontrada'
        });
      }

      // URLs de éxito y cancelación
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const successUrl = `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/billing/cancel`;

      const session = await StripeService.createCheckoutSession(
        tenant,
        plan,
        successUrl,
        cancelUrl
      );

      res.json({
        success: true,
        sessionId: session.id,
        url: session.url
      });
    } catch (error) {
      logger.error('Error creating checkout session:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Crear sesión del portal de facturación
   */
  async createBillingPortalSession(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const tenant = await Tenant.findByPk(tenantId);

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant no encontrado'
        });
      }

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const returnUrl = `${baseUrl}/billing`;

      const session = await StripeService.createBillingPortalSession(
        tenant,
        returnUrl
      );

      res.json({
        success: true,
        url: session.url
      });
    } catch (error) {
      logger.error('Error creating billing portal session:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Cancelar suscripción
   */
  async cancelSubscription(req, res) {
    try {
      const { cancelAtPeriodEnd = true } = req.body;
      const tenantId = req.user.tenantId;

      const subscription = await Subscription.findOne({
        where: { tenantId: tenantId }
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Suscripción no encontrada'
        });
      }

      if (!subscription.stripeSubscriptionId) {
        return res.status(400).json({
          success: false,
          message: 'Suscripción no está conectada con Stripe'
        });
      }

      await StripeService.cancelSubscription(subscription.id, cancelAtPeriodEnd);

      res.json({
        success: true,
        message: cancelAtPeriodEnd 
          ? 'Suscripción cancelada al final del período actual'
          : 'Suscripción cancelada inmediatamente'
      });
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Reactivar suscripción cancelada
   */
  async reactivateSubscription(req, res) {
    try {
      const tenantId = req.user.tenantId;

      const subscription = await Subscription.findOne({
        where: { tenantId: tenantId }
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Suscripción no encontrada'
        });
      }

      if (!subscription.stripeSubscriptionId) {
        return res.status(400).json({
          success: false,
          message: 'Suscripción no está conectada con Stripe'
        });
      }

      await StripeService.reactivateSubscription(subscription.id);

      res.json({
        success: true,
        message: 'Suscripción reactivada correctamente'
      });
    } catch (error) {
      logger.error('Error reactivating subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Cambiar plan de suscripción
   */
  async changePlan(req, res) {
    try {
      const { plan } = req.body;
      const tenantId = req.user.tenantId;

      if (!plan || !['basic', 'pro'].includes(plan)) {
        return res.status(400).json({
          success: false,
          message: 'Plan inválido. Debe ser "basic" o "pro"'
        });
      }

      const subscription = await Subscription.findOne({
        where: { tenantId: tenantId }
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Suscripción no encontrada'
        });
      }

      if (!subscription.stripeSubscriptionId) {
        return res.status(400).json({
          success: false,
          message: 'Suscripción no está conectada con Stripe'
        });
      }

      await StripeService.changePlan(subscription.id, plan);

      res.json({
        success: true,
        message: `Plan cambiado a ${plan} correctamente`
      });
    } catch (error) {
      logger.error('Error changing plan:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener estado de facturación
   */
  async getBillingStatus(req, res) {
    try {
      const tenantId = req.user.tenantId;

      const subscription = await Subscription.findOne({
        where: { tenantId: tenantId },
        include: [
          {
            model: Payment,
            as: 'payments',
            order: [['createdAt', 'DESC']],
            limit: 10
          }
        ]
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Suscripción no encontrada'
        });
      }

      // Obtener información actualizada de Stripe si existe
      let stripeInfo = null;
      if (subscription.stripeSubscriptionId) {
        try {
          stripeInfo = await StripeService.getSubscriptionInfo(subscription.id);
        } catch (error) {
          logger.warn('Could not fetch Stripe info:', error.message);
        }
      }

      res.json({
        success: true,
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          priceMonthly: subscription.priceMonthly,
          trialEndsAt: subscription.trialEndsAt,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          canceledAt: subscription.canceledAt,
          maxInvoices: subscription.maxInvoices,
          hasStripeSubscription: !!subscription.stripeSubscriptionId,
          stripeInfo: stripeInfo
        },
        payments: subscription.payments || []
      });
    } catch (error) {
      logger.error('Error getting billing status:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Webhook de Stripe
   */
  async handleWebhook(req, res) {
    try {
      const payload = req.body;
      const signature = req.headers['stripe-signature'];

      if (!signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing Stripe signature'
        });
      }

      const result = await StripeService.handleWebhook(payload, signature);

      res.json(result);
    } catch (error) {
      logger.error('Webhook error:', error);
      res.status(400).json({
        success: false,
        message: 'Webhook error',
        error: error.message
      });
    }
  }

  /**
   * Obtener historial de pagos
   */
  async getPaymentHistory(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const { page = 1, limit = 20 } = req.query;

      const subscription = await Subscription.findOne({
        where: { tenantId: tenantId }
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Suscripción no encontrada'
        });
      }

      const offset = (page - 1) * limit;

      const { count, rows: payments } = await Payment.findAndCountAll({
        where: { subscriptionId: subscription.id },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.json({
        success: true,
        payments: payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Error getting payment history:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new BillingController();
