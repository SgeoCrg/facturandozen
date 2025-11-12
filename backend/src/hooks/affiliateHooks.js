const AffiliateService = require('../services/AffiliateService');
const logger = require('../utils/logger');

/**
 * Hook para procesar conversiones cuando una suscripción cambia a 'active'
 * Se ejecuta automáticamente cuando Stripe confirma un pago
 */
async function processAffiliateConversion(subscriptionId) {
  try {
    const commission = await AffiliateService.processConversion(subscriptionId);
    
    if (commission) {
      logger.info('Affiliate conversion processed', {
        commissionId: commission.id,
        affiliateId: commission.affiliateId,
        amount: commission.amount
      });
      
      // TODO: Enviar email de notificación al afiliado
      // await EmailService.sendCommissionNotification(commission);
    }
    
    return commission;
  } catch (error) {
    logger.error('Error processing affiliate conversion', { 
      error: error.message, 
      subscriptionId 
    });
    throw error;
  }
}

/**
 * Hook para procesar cancelaciones de suscripción
 * Cancela comisiones pendientes si aplica
 */
async function processAffiliateCancellation(subscriptionId) {
  try {
    const db = require('../models');
    
    const commissions = await db.Commission.findAll({
      where: { 
        subscriptionId,
        status: 'pending'
      },
      include: [
        {
          model: db.Affiliate,
          as: 'affiliate'
        }
      ]
    });

    for (const commission of commissions) {
      await commission.update({ status: 'cancelled' });
      
      // Actualizar estadísticas del afiliado
      await db.Affiliate.update(
        {
          totalEarnings: db.sequelize.literal(`total_earnings - ${commission.amount}`),
          pendingEarnings: db.sequelize.literal(`pending_earnings - ${commission.amount}`)
        },
        { where: { id: commission.affiliateId } }
      );
      
      logger.info('Commission cancelled due to subscription cancellation', {
        commissionId: commission.id,
        affiliateId: commission.affiliateId,
        amount: commission.amount
      });
    }
    
    return commissions.length;
  } catch (error) {
    logger.error('Error processing affiliate cancellation', { 
      error: error.message, 
      subscriptionId 
    });
    throw error;
  }
}

module.exports = {
  processAffiliateConversion,
  processAffiliateCancellation
};
