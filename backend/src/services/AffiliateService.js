const db = require('../models');
const logger = require('../utils/logger');
const crypto = require('crypto');

class AffiliateService {
  /**
   * Generar código de afiliado único
   */
  generateAffiliateCode(name) {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${cleanName.substring(0, 6)}${randomSuffix}`;
  }

  /**
   * Crear nuevo afiliado
   */
  async createAffiliate(affiliateData) {
    try {
      const { name, email, phone, commissionRate = 20 } = affiliateData;

      // Verificar email único
      const existingAffiliate = await db.Affiliate.findOne({ where: { email } });
      if (existingAffiliate) {
        throw new Error('Email ya registrado como afiliado');
      }

      // Generar código único
      let code;
      let attempts = 0;
      do {
        code = this.generateAffiliateCode(name);
        attempts++;
        if (attempts > 10) {
          throw new Error('No se pudo generar código único');
        }
      } while (await db.Affiliate.findOne({ where: { code } }));

      const affiliate = await db.Affiliate.create({
        code,
        name,
        email,
        phone,
        commissionRate
      });

      logger.info('Affiliate created', { 
        affiliateId: affiliate.id, 
        code: affiliate.code, 
        email: affiliate.email 
      });

      return affiliate;
    } catch (error) {
      logger.error('Error creating affiliate', { error: error.message });
      throw error;
    }
  }

  /**
   * Registrar referido
   */
  async registerReferral(affiliateCode, tenantId) {
    try {
      const affiliate = await db.Affiliate.findOne({ 
        where: { code: affiliateCode, status: 'active' } 
      });

      if (!affiliate) {
        throw new Error('Código de afiliado inválido o inactivo');
      }

      // Verificar que el tenant no esté ya referido
      const existingReferral = await db.Referral.findOne({ 
        where: { tenantId } 
      });

      if (existingReferral) {
        throw new Error('Este tenant ya tiene un referido asociado');
      }

      const referral = await db.Referral.create({
        affiliateId: affiliate.id,
        tenantId,
        referralCode: affiliateCode,
        status: 'pending'
      });

      // Actualizar contador de referidos
      await affiliate.increment('referralCount');

      logger.info('Referral registered', { 
        referralId: referral.id, 
        affiliateId: affiliate.id, 
        tenantId 
      });

      return { referral, affiliate };
    } catch (error) {
      logger.error('Error registering referral', { error: error.message });
      throw error;
    }
  }

  /**
   * Procesar conversión (trial → paid)
   */
  async processConversion(subscriptionId) {
    try {
      const subscription = await db.Subscription.findByPk(subscriptionId, {
        include: [
          {
            model: db.Tenant,
            as: 'tenant'
          }
        ]
      });

      if (!subscription || subscription.status !== 'active') {
        return null;
      }

      const referral = await db.Referral.findOne({
        where: { 
          tenantId: subscription.tenantId,
          status: 'pending'
        },
        include: [
          {
            model: db.Affiliate,
            as: 'affiliate'
          }
        ]
      });

      if (!referral) {
        return null;
      }

      // Calcular comisión
      const commissionAmount = (subscription.priceMonthly * referral.affiliate.commissionRate) / 100;

      // Crear comisión
      const commission = await db.Commission.create({
        affiliateId: referral.affiliateId,
        referralId: referral.id,
        subscriptionId: subscription.id,
        amount: commissionAmount,
        commissionRate: referral.affiliate.commissionRate,
        status: 'pending'
      });

      // Actualizar referral
      await referral.update({
        status: 'converted',
        conversionDate: new Date(),
        commissionAmount
      });

      // Actualizar estadísticas del afiliado
      await db.Affiliate.update(
        {
          conversionCount: db.sequelize.literal('conversion_count + 1'),
          totalEarnings: db.sequelize.literal(`total_earnings + ${commissionAmount}`),
          pendingEarnings: db.sequelize.literal(`pending_earnings + ${commissionAmount}`)
        },
        { where: { id: referral.affiliateId } }
      );

      logger.info('Conversion processed', { 
        commissionId: commission.id, 
        affiliateId: referral.affiliateId,
        amount: commissionAmount 
      });

      return commission;
    } catch (error) {
      logger.error('Error processing conversion', { error: error.message });
      throw error;
    }
  }

  /**
   * Pagar comisión
   */
  async payCommission(commissionId, paymentData) {
    try {
      const { paymentMethod, paymentReference, notes } = paymentData;

      const commission = await db.Commission.findByPk(commissionId, {
        include: [
          {
            model: db.Affiliate,
            as: 'affiliate'
          }
        ]
      });

      if (!commission) {
        throw new Error('Comisión no encontrada');
      }

      if (commission.status === 'paid') {
        throw new Error('Comisión ya pagada');
      }

      // Actualizar comisión
      await commission.update({
        status: 'paid',
        paymentMethod,
        paymentReference,
        paidAt: new Date(),
        notes
      });

      // Actualizar estadísticas del afiliado
      await db.Affiliate.update(
        {
          paidEarnings: db.sequelize.literal(`paid_earnings + ${commission.amount}`),
          pendingEarnings: db.sequelize.literal(`pending_earnings - ${commission.amount}`)
        },
        { where: { id: commission.affiliateId } }
      );

      logger.info('Commission paid', { 
        commissionId, 
        affiliateId: commission.affiliateId,
        amount: commission.amount 
      });

      return commission;
    } catch (error) {
      logger.error('Error paying commission', { error: error.message });
      throw error;
    }
  }

  /**
   * Obtener estadísticas de afiliado
   */
  async getAffiliateStats(affiliateId) {
    try {
      const affiliate = await db.Affiliate.findByPk(affiliateId, {
        include: [
          {
            model: db.Referral,
            as: 'referrals',
            include: [
              {
                model: db.Tenant,
                as: 'tenant'
              }
            ]
          },
          {
            model: db.Commission,
            as: 'commissions'
          }
        ]
      });

      if (!affiliate) {
        throw new Error('Afiliado no encontrado');
      }

      const stats = {
        affiliate: {
          id: affiliate.id,
          code: affiliate.code,
          name: affiliate.name,
          email: affiliate.email,
          status: affiliate.status,
          commissionRate: affiliate.commissionRate,
          totalEarnings: affiliate.totalEarnings,
          paidEarnings: affiliate.paidEarnings,
          pendingEarnings: affiliate.pendingEarnings,
          referralCount: affiliate.referralCount,
          conversionCount: affiliate.conversionCount
        },
        referrals: affiliate.referrals.map(r => ({
          id: r.id,
          tenantName: r.tenant?.name,
          status: r.status,
          conversionDate: r.conversionDate,
          commissionAmount: r.commissionAmount
        })),
        commissions: affiliate.commissions.map(c => ({
          id: c.id,
          amount: c.amount,
          status: c.status,
          paidAt: c.paidAt,
          paymentMethod: c.paymentMethod
        }))
      };

      return stats;
    } catch (error) {
      logger.error('Error getting affiliate stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Obtener estadísticas globales del sistema de afiliados
   */
  async getGlobalStats() {
    try {
      const [
        totalAffiliates,
        activeAffiliates,
        totalReferrals,
        totalConversions,
        totalCommissions,
        pendingCommissions
      ] = await Promise.all([
        db.Affiliate.count(),
        db.Affiliate.count({ where: { status: 'active' } }),
        db.Referral.count(),
        db.Referral.count({ where: { status: 'converted' } }),
        db.Commission.sum('amount'),
        db.Commission.sum('amount', { where: { status: 'pending' } })
      ]);

      const conversionRate = totalReferrals > 0 ? (totalConversions / totalReferrals) * 100 : 0;

      return {
        totalAffiliates,
        activeAffiliates,
        totalReferrals,
        totalConversions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalCommissions: totalCommissions || 0,
        pendingCommissions: pendingCommissions || 0
      };
    } catch (error) {
      logger.error('Error getting global stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Generar enlace de afiliado
   */
  generateAffiliateLink(affiliateCode, baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000') {
    return `${baseUrl}/register?ref=${affiliateCode}`;
  }

  /**
   * Validar código de afiliado
   */
  async validateAffiliateCode(code) {
    try {
      const affiliate = await db.Affiliate.findOne({ 
        where: { code, status: 'active' } 
      });
      return !!affiliate;
    } catch (error) {
      logger.error('Error validating affiliate code', { error: error.message });
      return false;
    }
  }

  /**
   * Obtener afiliados por tenant
   */
  async getAffiliatesByTenant(tenantId) {
    try {
      const affiliates = await db.Affiliate.findAll({
        where: { tenantId },
        include: [
          {
            model: db.Referral,
            as: 'referrals',
            attributes: ['id', 'status']
          },
          {
            model: db.Commission,
            as: 'commissions',
            attributes: ['id', 'amount', 'status']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return affiliates.map(affiliate => {
        const referralCount = affiliate.referrals ? affiliate.referrals.length : 0;
        const totalEarnings = affiliate.commissions 
          ? affiliate.commissions.reduce((sum, comm) => sum + parseFloat(comm.amount || 0), 0)
          : 0;

        return {
          ...affiliate.toJSON(),
          referralCount,
          totalEarnings
        };
      });
    } catch (error) {
      logger.error('Error getting affiliates by tenant', { error: error.message });
      throw error;
    }
  }

  /**
   * Obtener estadísticas por tenant
   */
  async getStatsByTenant(tenantId) {
    try {
      const [
        totalAffiliates,
        totalReferrals,
        totalConversions,
        totalCommissions
      ] = await Promise.all([
        db.Affiliate.count({ where: { tenantId } }),
        db.Referral.count({ 
          include: [{ model: db.Affiliate, where: { tenantId } }]
        }),
        db.Referral.count({ 
          where: { status: 'converted' },
          include: [{ model: db.Affiliate, where: { tenantId } }]
        }),
        db.Commission.sum('amount', {
          include: [{ model: db.Affiliate, where: { tenantId } }]
        })
      ]);

      return {
        totalAffiliates,
        totalReferrals,
        totalConversions,
        totalCommissions: totalCommissions || 0
      };
    } catch (error) {
      logger.error('Error getting stats by tenant', { error: error.message });
      throw error;
    }
  }

  /**
   * Crear afiliado para un tenant específico
   */
  async createAffiliateForTenant({ tenantId, name, email, phone, commissionRate = 20 }) {
    try {
      // Verificar que el tenant existe
      const tenant = await db.Tenant.findByPk(tenantId);
      if (!tenant) {
        throw new Error('Tenant no encontrado');
      }

      // Verificar que el email no esté en uso
      const existingAffiliate = await db.Affiliate.findOne({
        where: { email }
      });

      if (existingAffiliate) {
        throw new Error('El email ya está en uso por otro afiliado');
      }

      // Generar código único
      const code = this.generateAffiliateCode(name);

      const affiliate = await db.Affiliate.create({
        tenantId,
        code,
        name,
        email,
        phone,
        commissionRate,
        status: 'active'
      });

      logger.info('Affiliate created for tenant', { 
        affiliateId: affiliate.id, 
        tenantId, 
        code: affiliate.code 
      });

      return affiliate;
    } catch (error) {
      logger.error('Error creating affiliate for tenant', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AffiliateService();
