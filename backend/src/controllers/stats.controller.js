const db = require('../models');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const { Op } = require('sequelize');

/**
 * Dashboard stats mejorado
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const cacheKey = `stats:${req.user.tenantId}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const tenantId = req.user.tenantId;
    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Queries en paralelo
    const [
      totalInvoices,
      totalCustomers,
      totalProducts,
      monthInvoices,
      totalRevenue,
      monthRevenue,
      recentInvoices,
      topCustomers
    ] = await Promise.all([
      // Total facturas
      db.Invoice.count({ where: { tenantId } }),
      
      // Total clientes
      db.Customer.count({ where: { tenantId } }),
      
      // Total productos
      db.Product.count({ where: { tenantId, isActive: true } }),
      
      // Facturas este mes
      db.Invoice.count({
        where: {
          tenantId,
          date: {
            [Op.between]: [firstDayMonth, lastDayMonth]
          }
        }
      }),
      
      // Ingresos totales
      db.Invoice.sum('total', {
        where: { 
          tenantId,
          status: { [Op.in]: ['issued', 'paid'] }
        }
      }),
      
      // Ingresos este mes
      db.Invoice.sum('total', {
        where: {
          tenantId,
          status: { [Op.in]: ['issued', 'paid'] },
          date: {
            [Op.between]: [firstDayMonth, lastDayMonth]
          }
        }
      }),
      
      // Últimas 5 facturas
      db.Invoice.findAll({
        where: { tenantId },
        include: [{
          model: db.Customer,
          as: 'customer',
          attributes: ['name', 'nif'],
          required: false
        }],
        order: [['createdAt', 'DESC']],
        limit: 5
      }),
      
      // Top 5 clientes (por ingresos)
      db.sequelize.query(`
        SELECT 
          c.id, 
          c.name,
          COUNT(DISTINCT i.id) as invoice_count,
          SUM(i.total) as total_revenue
        FROM customers c
        LEFT JOIN invoices i ON i.customer_id = c.id AND i.tenant_id = :tenantId
        WHERE c.tenant_id = :tenantId
        GROUP BY c.id, c.name
        HAVING COUNT(DISTINCT i.id) > 0
        ORDER BY total_revenue DESC
        LIMIT 5
      `, {
        replacements: { tenantId },
        type: db.sequelize.QueryTypes.SELECT
      })
    ]);

    const stats = {
      overview: {
        totalInvoices,
        totalCustomers,
        totalProducts,
        monthInvoices,
        totalRevenue: parseFloat(totalRevenue || 0).toFixed(2),
        monthRevenue: parseFloat(monthRevenue || 0).toFixed(2)
      },
      recentInvoices,
      topCustomers: topCustomers.map(c => ({
        ...c,
        total_revenue: parseFloat(c.total_revenue).toFixed(2)
      })),
      period: {
        month: now.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
      }
    };

    // Caché 2 minutos
    cache.set(cacheKey, stats, 120);

    logger.info('Dashboard stats', { tenantId });
    res.json(stats);
  } catch (error) {
    logger.error('Error dashboard stats', { error: error.message, tenantId: req.user.tenantId });
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
};

/**
 * Gráfico evolución facturas (últimos 6 meses)
 */
exports.getInvoicesTrend = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const months = 6;
    
    const data = await db.sequelize.query(`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        COUNT(*) as count,
        SUM(total) as revenue
      FROM invoices
      WHERE tenant_id = :tenantId
        AND date >= NOW() - INTERVAL '${months} months'
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month ASC
    `, {
      replacements: { tenantId },
      type: db.sequelize.QueryTypes.SELECT
    });

    const trend = data.map(d => ({
      month: d.month,
      count: parseInt(d.count),
      revenue: parseFloat(d.revenue).toFixed(2)
    }));

    res.json({ trend });
  } catch (error) {
    logger.error('Error invoices trend', { error: error.message });
    res.status(500).json({ error: 'Error obteniendo tendencia' });
  }
};



