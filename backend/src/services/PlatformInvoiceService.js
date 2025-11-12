const db = require('../models');
const DataStandardizationService = require('./DataStandardizationService');
const logger = require('../utils/logger');

class PlatformInvoiceService {
  /**
   * Genera factura automáticamente cuando hay un pago exitoso
   */
  static async generateInvoiceFromPayment(payment) {
    try {
      // Verificar si ya existe factura para este pago
      const existing = await db.PlatformInvoice.findOne({
        where: { paymentId: payment.id }
      });

      if (existing) {
        logger.info('Factura ya existe para este pago', { paymentId: payment.id });
        return existing;
      }

      // Obtener tenant y subscription
      const tenant = await db.Tenant.findByPk(payment.tenantId);
      const subscription = await db.Subscription.findByPk(payment.subscriptionId);

      if (!tenant || !subscription) {
        throw new Error('Tenant o Subscription no encontrado');
      }

      // Obtener siguiente número de factura
      const lastInvoice = await db.PlatformInvoice.findOne({
        order: [['number', 'DESC']],
        where: { series: 'PLAT' }
      });

      const nextNumber = (lastInvoice?.number || 0) + 1;
      const year = new Date().getFullYear();
      const fullNumber = `PLAT${year}/${String(nextNumber).padStart(6, '0')}`;

      // Calcular importes
      const unitPrice = parseFloat(payment.amount);
      const quantity = 1.00;
      const ivaRate = 21.00; // IVA estándar para servicios SaaS
      const subtotal = DataStandardizationService.normalizePrice(unitPrice * quantity);
      const ivaAmount = DataStandardizationService.normalizePrice(subtotal * (ivaRate / 100));
      const total = DataStandardizationService.normalizePrice(subtotal + ivaAmount);

      // Descripción según plan
      const planNames = {
        basic: 'Suscripción mensual - Plan BASIC',
        pro: 'Suscripción mensual - Plan PRO'
      };
      const description = planNames[payment.plan] || 'Suscripción mensual';

      // Crear factura
      const platformInvoice = await db.PlatformInvoice.create({
        tenantId: payment.tenantId,
        paymentId: payment.id,
        subscriptionId: payment.subscriptionId,
        number: nextNumber,
        series: 'PLAT',
        fullNumber: fullNumber,
        date: new Date().toISOString().split('T')[0],
        customerName: tenant.name,
        customerNif: tenant.nif,
        customerAddress: tenant.address || null,
        customerEmail: tenant.email,
        plan: payment.plan,
        description: description,
        quantity: quantity,
        unitPrice: unitPrice,
        subtotal: subtotal,
        ivaRate: ivaRate,
        ivaAmount: ivaAmount,
        total: total,
        periodStart: payment.periodStart ? new Date(payment.periodStart).toISOString().split('T')[0] : null,
        periodEnd: payment.periodEnd ? new Date(payment.periodEnd).toISOString().split('T')[0] : null,
        status: payment.status === 'succeeded' ? 'paid' : 'issued',
        stripePaymentIntentId: payment.stripePaymentIntentId || null,
        notes: `Factura generada automáticamente por pago de suscripción ${payment.plan.toUpperCase()}`
      });

      logger.info('Factura de plataforma generada', {
        invoiceId: platformInvoice.id,
        fullNumber: platformInvoice.fullNumber,
        tenantId: payment.tenantId,
        amount: total
      });

      return platformInvoice;
    } catch (error) {
      logger.error('Error generando factura de plataforma', {
        error: error.message,
        paymentId: payment.id
      });
      throw error;
    }
  }
}

module.exports = PlatformInvoiceService;

