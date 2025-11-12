const AffiliateService = require('../services/AffiliateService');
const logger = require('../utils/logger');

class AffiliateController {
  /**
   * Crear nuevo afiliado
   */
  async createAffiliate(req, res) {
    try {
      const { name, email, phone, commissionRate } = req.body;

      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y email son requeridos'
        });
      }

      const affiliate = await AffiliateService.createAffiliate({
        name,
        email,
        phone,
        commissionRate
      });

      res.status(201).json({
        success: true,
        message: 'Afiliado creado correctamente',
        affiliate: {
          id: affiliate.id,
          code: affiliate.code,
          name: affiliate.name,
          email: affiliate.email,
          commissionRate: affiliate.commissionRate,
          status: affiliate.status
        }
      });
    } catch (error) {
      logger.error('Error creating affiliate', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener lista de afiliados
   */
  async getAffiliates(req, res) {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (status) {
        whereClause.status = status;
      }
      if (search) {
        whereClause[db.Sequelize.Op.or] = [
          { name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
          { email: { [db.Sequelize.Op.iLike]: `%${search}%` } },
          { code: { [db.Sequelize.Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows: affiliates } = await db.Affiliate.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.json({
        success: true,
        affiliates: affiliates.map(affiliate => ({
          id: affiliate.id,
          code: affiliate.code,
          name: affiliate.name,
          email: affiliate.email,
          phone: affiliate.phone,
          commissionRate: affiliate.commissionRate,
          status: affiliate.status,
          totalEarnings: affiliate.totalEarnings,
          paidEarnings: affiliate.paidEarnings,
          pendingEarnings: affiliate.pendingEarnings,
          referralCount: affiliate.referralCount,
          conversionCount: affiliate.conversionCount,
          createdAt: affiliate.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Error getting affiliates', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener detalles de afiliado
   */
  async getAffiliate(req, res) {
    try {
      const { id } = req.params;

      const stats = await AffiliateService.getAffiliateStats(id);

      res.json({
        success: true,
        ...stats
      });
    } catch (error) {
      logger.error('Error getting affiliate', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualizar afiliado
   */
  async updateAffiliate(req, res) {
    try {
      const { id } = req.params;
      const { name, email, phone, commissionRate, status } = req.body;

      const affiliate = await db.Affiliate.findByPk(id);
      if (!affiliate) {
        return res.status(404).json({
          success: false,
          message: 'Afiliado no encontrado'
        });
      }

      // Verificar email único si se está cambiando
      if (email && email !== affiliate.email) {
        const existingAffiliate = await db.Affiliate.findOne({ 
          where: { email, id: { [db.Sequelize.Op.ne]: id } } 
        });
        if (existingAffiliate) {
          return res.status(400).json({
            success: false,
            message: 'Email ya registrado'
          });
        }
      }

      await affiliate.update({
        name: name || affiliate.name,
        email: email || affiliate.email,
        phone: phone !== undefined ? phone : affiliate.phone,
        commissionRate: commissionRate || affiliate.commissionRate,
        status: status || affiliate.status
      });

      res.json({
        success: true,
        message: 'Afiliado actualizado correctamente',
        affiliate: {
          id: affiliate.id,
          code: affiliate.code,
          name: affiliate.name,
          email: affiliate.email,
          phone: affiliate.phone,
          commissionRate: affiliate.commissionRate,
          status: affiliate.status
        }
      });
    } catch (error) {
      logger.error('Error updating affiliate', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Eliminar afiliado
   */
  async deleteAffiliate(req, res) {
    try {
      const { id } = req.params;

      const affiliate = await db.Affiliate.findByPk(id);
      if (!affiliate) {
        return res.status(404).json({
          success: false,
          message: 'Afiliado no encontrado'
        });
      }

      // Verificar si tiene referidos activos
      const activeReferrals = await db.Referral.count({
        where: { affiliateId: id, status: ['pending', 'trial', 'converted'] }
      });

      if (activeReferrals > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar afiliado con referidos activos'
        });
      }

      await affiliate.destroy();

      res.json({
        success: true,
        message: 'Afiliado eliminado correctamente'
      });
    } catch (error) {
      logger.error('Error deleting affiliate', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener estadísticas globales
   */
  async getGlobalStats(req, res) {
    try {
      const stats = await AffiliateService.getGlobalStats();

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      logger.error('Error getting global stats', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Generar enlace de afiliado
   */
  async generateAffiliateLink(req, res) {
    try {
      const { code } = req.params;

      const isValid = await AffiliateService.validateAffiliateCode(code);
      if (!isValid) {
        return res.status(404).json({
          success: false,
          message: 'Código de afiliado inválido'
        });
      }

      const link = AffiliateService.generateAffiliateLink(code);

      res.json({
        success: true,
        link,
        code
      });
    } catch (error) {
      logger.error('Error generating affiliate link', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener comisiones pendientes
   */
  async getPendingCommissions(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows: commissions } = await db.Commission.findAndCountAll({
        where: { status: 'pending' },
        include: [
          {
            model: db.Affiliate,
            as: 'affiliate',
            attributes: ['id', 'code', 'name', 'email']
          },
          {
            model: db.Referral,
            as: 'referral',
            include: [
              {
                model: db.Tenant,
                as: 'tenant',
                attributes: ['id', 'name', 'email']
              }
            ]
          },
          {
            model: db.Subscription,
            as: 'subscription',
            attributes: ['id', 'plan', 'priceMonthly']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.json({
        success: true,
        commissions: commissions.map(commission => ({
          id: commission.id,
          amount: commission.amount,
          commissionRate: commission.commissionRate,
          status: commission.status,
          createdAt: commission.createdAt,
          affiliate: {
            id: commission.affiliate.id,
            code: commission.affiliate.code,
            name: commission.affiliate.name,
            email: commission.affiliate.email
          },
          referral: {
            id: commission.referral.id,
            tenantName: commission.referral.tenant.name,
            tenantEmail: commission.referral.tenant.email,
            conversionDate: commission.referral.conversionDate
          },
          subscription: {
            id: commission.subscription.id,
            plan: commission.subscription.plan,
            priceMonthly: commission.subscription.priceMonthly
          }
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Error getting pending commissions', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Pagar comisión
   */
  async payCommission(req, res) {
    try {
      const { id } = req.params;
      const { paymentMethod, paymentReference, notes } = req.body;

      if (!paymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'Método de pago requerido'
        });
      }

      const commission = await AffiliateService.payCommission(id, {
        paymentMethod,
        paymentReference,
        notes
      });

      res.json({
        success: true,
        message: 'Comisión pagada correctamente',
        commission: {
          id: commission.id,
          amount: commission.amount,
          status: commission.status,
          paymentMethod: commission.paymentMethod,
          paymentReference: commission.paymentReference,
          paidAt: commission.paidAt
        }
      });
    } catch (error) {
      logger.error('Error paying commission', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener afiliados del cliente actual
   */
  async getMyAffiliates(req, res) {
    try {
      const tenantId = req.user.tenantId;
      
      const affiliates = await AffiliateService.getAffiliatesByTenant(tenantId);

      res.json({
        success: true,
        affiliates: affiliates.map(affiliate => ({
          id: affiliate.id,
          code: affiliate.code,
          name: affiliate.name,
          email: affiliate.email,
          phone: affiliate.phone,
          commissionRate: affiliate.commissionRate,
          status: affiliate.status,
          referralCount: affiliate.referralCount || 0,
          totalEarnings: affiliate.totalEarnings || 0,
          createdAt: affiliate.createdAt
        }))
      });
    } catch (error) {
      logger.error('Error getting my affiliates', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener estadísticas del cliente actual
   */
  async getMyStats(req, res) {
    try {
      const tenantId = req.user.tenantId;
      
      const stats = await AffiliateService.getStatsByTenant(tenantId);

      res.json({
        success: true,
        stats: {
          totalAffiliates: stats.totalAffiliates || 0,
          totalReferrals: stats.totalReferrals || 0,
          totalConversions: stats.totalConversions || 0,
          totalCommissions: stats.totalCommissions || 0
        }
      });
    } catch (error) {
      logger.error('Error getting my stats', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Crear afiliado para el cliente actual
   */
  async createMyAffiliate(req, res) {
    try {
      const { name, email, phone, commissionRate } = req.body;
      const tenantId = req.user.tenantId;

      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y email son requeridos'
        });
      }

      const affiliate = await AffiliateService.createAffiliateForTenant({
        tenantId,
        name,
        email,
        phone,
        commissionRate
      });

      res.status(201).json({
        success: true,
        message: 'Afiliado creado correctamente',
        affiliate: {
          id: affiliate.id,
          code: affiliate.code,
          name: affiliate.name,
          email: affiliate.email,
          commissionRate: affiliate.commissionRate,
          status: affiliate.status
        }
      });
    } catch (error) {
      logger.error('Error creating my affiliate', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
}

module.exports = new AffiliateController();
