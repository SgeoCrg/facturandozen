const db = require('../models');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const { Op } = require('sequelize');

/**
 * Dashboard stats mejorado
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const isSuperadmin = req.user.role === 'superadmin';
    const tenantId = req.user.tenantId;
    const cacheKey = `stats:${isSuperadmin ? 'superadmin' : tenantId}`;
    
    // Temporalmente deshabilitar caché para debug
    // const cached = cache.get(cacheKey);
    // if (cached) {
    //   return res.json(cached);
    // }

    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Para superadmin, agregar estadísticas de todas las empresas
    let whereClause, whereClauseWithDate, whereClauseRevenue, whereClauseRevenueMonth, tenantIds = [];
    
    if (isSuperadmin) {
      // Obtener IDs de TODOS los tenants (incluyendo demo)
      const allTenants = await db.Tenant.findAll({
        attributes: ['id', 'name', 'email']
      });
      tenantIds = allTenants.map(t => t.id);
      
      // Si hay tenants, filtrar por ellos; si no, usar array vacío para no contar nada
      // IMPORTANTE: Usar Op.in correctamente
      if (tenantIds.length > 0) {
        whereClause = { tenantId: { [Op.in]: tenantIds } };
      } else {
        whereClause = { tenantId: { [Op.in]: [] } }; // Array vacío = no cuenta nada
      }
      
      // Log para debug
      console.log('\n🔍 DEBUG FILTRO:');
      console.log('tenantIds:', tenantIds);
      console.log('whereClause:', JSON.stringify(whereClause, null, 2));
      
      // Debug: log para verificar
      const tenantNamesForLog = allTenants.map(t => ({ name: t.name, email: t.email }));
      logger.info('Superadmin dashboard stats', { 
        totalTenants: tenantIds.length,
        tenantIds,
        tenantNames: tenantNamesForLog,
        whereClause
      });
      
      // Verificar conteo directo para debug
      const customerCountDebug = await db.Customer.count({ where: whereClause });
      const productCountDebug = await db.Product.count({ 
        where: tenantIds.length > 0 
          ? { tenantId: { [Op.in]: tenantIds }, isActive: true } 
          : { tenantId: { [Op.in]: [] }, isActive: true }
      });
      
      // Verificar TODOS los clientes y sus tenants para debug
      const allCustomersDebug = await db.Customer.findAll({
        include: [{
          model: db.Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'email']
        }],
        attributes: ['id', 'name', 'tenantId']
      });
      
      // Verificar TODOS los tenants para debug
      const allTenantsDebug = await db.Tenant.findAll({
        attributes: ['id', 'name', 'email']
      });
      
      logger.info('Superadmin dashboard debug counts', {
        customerCountDebug,
        productCountDebug,
        tenantIdsCount: tenantIds.length,
        allCustomers: allCustomersDebug.map(c => ({
          name: c.name,
          tenantId: c.tenantId,
          tenantName: c.tenant?.name,
          tenantEmail: c.tenant?.email
        })),
        allTenants: allTenantsDebug.map(t => ({
          id: t.id,
          name: t.name,
          email: t.email
        })),
        filteredTenantIds: tenantIds
      });
      whereClauseWithDate = tenantIds.length > 0 
        ? { tenantId: { [Op.in]: tenantIds }, date: { [Op.between]: [firstDayMonth, lastDayMonth] } }
        : { tenantId: { [Op.in]: [] }, date: { [Op.between]: [firstDayMonth, lastDayMonth] } };
      whereClauseRevenue = tenantIds.length > 0
        ? { tenantId: { [Op.in]: tenantIds }, status: { [Op.in]: ['issued', 'paid'] } }
        : { tenantId: { [Op.in]: [] }, status: { [Op.in]: ['issued', 'paid'] } };
      whereClauseRevenueMonth = tenantIds.length > 0
        ? { tenantId: { [Op.in]: tenantIds }, status: { [Op.in]: ['issued', 'paid'] }, date: { [Op.between]: [firstDayMonth, lastDayMonth] } }
        : { tenantId: { [Op.in]: [] }, status: { [Op.in]: ['issued', 'paid'] }, date: { [Op.between]: [firstDayMonth, lastDayMonth] } };
    } else {
      whereClause = { tenantId };
      whereClauseWithDate = { tenantId, date: { [Op.between]: [firstDayMonth, lastDayMonth] } };
      whereClauseRevenue = { tenantId, status: { [Op.in]: ['issued', 'paid'] } };
      whereClauseRevenueMonth = { tenantId, status: { [Op.in]: ['issued', 'paid'] }, date: { [Op.between]: [firstDayMonth, lastDayMonth] } };
    }

    // Preparar query de top clientes para superadmin
    let topCustomersQuery;
    if (isSuperadmin) {
      if (tenantIds.length === 0) {
        topCustomersQuery = Promise.resolve([]);
      } else {
        // Usar ANY con array de UUIDs para PostgreSQL
        // Crear placeholders dinámicos para cada tenantId
        const placeholders = tenantIds.map((_, idx) => `:tenantId${idx}`).join(', ');
        const replacements = {};
        tenantIds.forEach((id, idx) => {
          replacements[`tenantId${idx}`] = id;
        });
        
        topCustomersQuery = db.sequelize.query(`
          SELECT 
            c.id, 
            c.name,
            COUNT(DISTINCT i.id) as invoice_count,
            SUM(i.total) as total_revenue
          FROM customers c
          LEFT JOIN invoices i ON i.customer_id = c.id AND i.tenant_id = ANY(ARRAY[${placeholders}]::uuid[])
          WHERE c.tenant_id = ANY(ARRAY[${placeholders}]::uuid[])
          GROUP BY c.id, c.name
          HAVING COUNT(DISTINCT i.id) > 0
          ORDER BY total_revenue DESC
          LIMIT 5
        `, {
          replacements,
          type: db.sequelize.QueryTypes.SELECT
        });
      }
    } else {
      topCustomersQuery = db.sequelize.query(`
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
      });
    }

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
      db.Invoice.count({ where: whereClause }),
      
      // Total clientes: para superadmin contar tenants (empresas), para otros contar customers
      isSuperadmin 
        ? db.Tenant.count({ where: tenantIds.length > 0 ? { id: { [Op.in]: tenantIds } } : { id: { [Op.in]: [] } } })
        : db.Customer.count({ where: whereClause }),
      
      // Total productos (solo activos, filtrados por tenant)
      db.Product.count({ where: isSuperadmin 
        ? (tenantIds.length > 0 ? { tenantId: { [Op.in]: tenantIds }, isActive: true } : { tenantId: { [Op.in]: [] }, isActive: true })
        : { ...whereClause, isActive: true } 
      }),
      
      // Facturas este mes
      db.Invoice.count({ where: whereClauseWithDate }),
      
      // Ingresos totales
      db.Invoice.sum('total', { where: whereClauseRevenue }),
      
      // Ingresos este mes
      db.Invoice.sum('total', { where: whereClauseRevenueMonth }),
      
      // Últimas 5 facturas
      db.Invoice.findAll({
        where: whereClause,
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
      topCustomersQuery
    ]);

    // Obtener datos completos para mostrar en consola (solo si es superadmin)
    if (isSuperadmin) {
      console.log('\n\n\n');
      console.log('==========================================');
      console.log('========== DASHBOARD STATS DEBUG ==========');
      console.log('==========================================');
      
      try {
        // Mostrar qué clientes se están contando con el filtro (PRIMERO, antes de otras queries)
        const customersWithFilter = await db.Customer.findAll({
          where: whereClause,
          include: [{
            model: db.Tenant,
            as: 'tenant',
            attributes: ['id', 'name', 'email'],
            required: false
          }],
          attributes: ['id', 'name', 'nif', 'email', 'tenantId']
        });
        
        console.log('\n🔍 WHERE CLAUSE USADO PARA FILTRAR:');
        console.log(JSON.stringify(whereClause, null, 2));
        console.log('\n🔍 TENANT IDs FILTRADOS:');
        console.log(JSON.stringify(tenantIds, null, 2));
        
        console.log('\n🔍 CLIENTES QUE SE ESTÁN CONTANDO CON EL FILTRO:');
        console.log(`Total con filtro: ${customersWithFilter.length}`);
        console.log('\nOBJETOS COMPLETOS DE CLIENTES FILTRADOS (JSON):');
        const customersJSON = customersWithFilter.map(c => ({
          id: c.id,
          name: c.name,
          nif: c.nif,
          email: c.email,
          tenantId: c.tenantId,
          tenant: c.tenant ? {
            id: c.tenant.id,
            name: c.tenant.name,
            email: c.tenant.email
          } : null
        }));
        console.log(JSON.stringify(customersJSON, null, 2));
        
        console.log('\nCLIENTES FILTRADOS (formato legible):');
        customersWithFilter.forEach((customer, idx) => {
          console.log(`  ${idx + 1}. ${customer.name} (${customer.nif})`);
          console.log(`     Tenant: ${customer.tenant?.name || 'N/A'} (${customer.tenant?.email || 'N/A'})`);
          console.log(`     TenantId: ${customer.tenantId}`);
        });
        
        // Obtener TODOS los clientes para comparar
        const allCustomersList = await db.Customer.findAll({
          include: [{
            model: db.Tenant,
            as: 'tenant',
            attributes: ['id', 'name', 'email'],
            required: false
          }],
          attributes: ['id', 'name', 'nif', 'email', 'tenantId']
        });
        
        console.log('\n👥 TODOS LOS CLIENTES EN LA BASE DE DATOS:', allCustomersList.length);
        console.log('OBJETOS COMPLETOS DE TODOS LOS CLIENTES (JSON):');
        const allCustomersJSON = allCustomersList.map(c => ({
          id: c.id,
          name: c.name,
          nif: c.nif,
          email: c.email,
          tenantId: c.tenantId,
          tenant: c.tenant ? {
            id: c.tenant.id,
            name: c.tenant.name,
            email: c.tenant.email
          } : null
        }));
        console.log(JSON.stringify(allCustomersJSON, null, 2));
        
        // Obtener todos los tenants para el log
        const allTenantsForLog = await db.Tenant.findAll({
          attributes: ['id', 'name', 'email']
        });
        
        console.log('\n📊 TODOS LOS TENANTS:', allTenantsForLog.length);
        tenantIds.forEach((id, idx) => {
          const tenant = allTenantsForLog.find(t => t.id === id);
          console.log(`  ${idx + 1}. ${tenant?.name || 'N/A'} (${tenant?.email || 'N/A'}) - ID: ${id}`);
        });
        
        console.log('\n📈 RESUMEN DEL DASHBOARD:');
        console.log(`  Clientes contados (totalCustomers): ${totalCustomers}`);
        console.log(`  Facturas contadas: ${totalInvoices}`);
        console.log(`  Productos contados: ${totalProducts}`);
        console.log('==========================================');
        console.log('\n\n\n');
      } catch (debugError) {
        console.error('\n\nERROR EN DEBUG DE CONSOLA:');
        console.error(debugError);
        console.error('Stack:', debugError.stack);
        console.error('\n\n');
        // No fallar si hay error en el debug
      }
    }

    // Obtener datos de debug para incluir en la respuesta (solo superadmin)
    let debugInfo = null;
    if (isSuperadmin) {
      try {
        // Obtener todos los tenants para el debug
        const allTenantsForDebug = await db.Tenant.findAll({
          attributes: ['id', 'name', 'email']
        });
        
        const customersWithFilter = await db.Customer.findAll({
          where: whereClause,
          include: [{
            model: db.Tenant,
            as: 'tenant',
            attributes: ['id', 'name', 'email'],
            required: false
          }],
          attributes: ['id', 'name', 'nif', 'email', 'tenantId']
        });
        
        const allCustomersList = await db.Customer.findAll({
          include: [{
            model: db.Tenant,
            as: 'tenant',
            attributes: ['id', 'name', 'email'],
            required: false
          }],
          attributes: ['id', 'name', 'nif', 'email', 'tenantId']
        });
        
        const allInvoicesList = await db.Invoice.findAll({
          include: [{
            model: db.Tenant,
            as: 'tenant',
            attributes: ['id', 'name', 'email'],
            required: false
          }],
          attributes: ['id', 'number', 'total', 'status', 'tenantId']
        });
        
        const allProductsList = await db.Product.findAll({
          include: [{
            model: db.Tenant,
            as: 'tenant',
            attributes: ['id', 'name', 'email'],
            required: false
          }],
          attributes: ['id', 'name', 'sku', 'price', 'isActive', 'tenantId']
        });
        
        debugInfo = {
          whereClause,
          tenantIds,
          tenants: allTenantsForDebug.map(t => ({
            id: t.id,
            name: t.name,
            email: t.email
          })),
          customersWithFilter: customersWithFilter.map(c => ({
            id: c.id,
            name: c.name,
            nif: c.nif,
            email: c.email,
            tenantId: c.tenantId,
            tenant: c.tenant ? {
              id: c.tenant.id,
              name: c.tenant.name,
              email: c.tenant.email
            } : null
          })),
          allCustomers: allCustomersList.map(c => ({
            id: c.id,
            name: c.name,
            nif: c.nif,
            email: c.email,
            tenantId: c.tenantId,
            tenant: c.tenant ? {
              id: c.tenant.id,
              name: c.tenant.name,
              email: c.tenant.email
            } : null
          })),
          allInvoices: allInvoicesList.map(i => ({
            id: i.id,
            number: i.number,
            total: i.total,
            status: i.status,
            tenantId: i.tenantId,
            tenant: i.tenant ? {
              id: i.tenant.id,
              name: i.tenant.name,
              email: i.tenant.email
            } : null
          })),
          allProducts: allProductsList.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            price: p.price,
            isActive: p.isActive,
            tenantId: p.tenantId,
            tenant: p.tenant ? {
              id: p.tenant.id,
              name: p.tenant.name,
              email: p.tenant.email
            } : null
          })),
          counts: {
            totalCustomersCounted: totalCustomers,
            customersWithFilterCount: customersWithFilter.length,
            allCustomersCount: allCustomersList.length,
            totalInvoicesCounted: totalInvoices,
            allInvoicesCount: allInvoicesList.length,
            totalProductsCounted: totalProducts,
            allProductsCount: allProductsList.length
          },
          summary: {
            tenantsFiltered: tenantIds.length,
            tenantsTotal: allTenantsForDebug.length,
            customersInFilter: customersWithFilter.length,
            customersTotal: allCustomersList.length,
            customersShownInDashboard: totalCustomers
          }
        };
      } catch (debugError) {
        console.error('Error obteniendo debug info:', debugError);
        debugInfo = {
          error: debugError.message,
          stack: debugError.stack
        };
      }
    }

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
      topCustomers: (topCustomers || []).map(c => ({
        ...c,
        total_revenue: parseFloat(c.total_revenue || 0).toFixed(2)
      })),
      period: {
        month: now.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
      }
    };
    
    // Incluir debug info solo para superadmin (después de crear stats)
    if (isSuperadmin && debugInfo) {
      stats.debug = debugInfo;
      // Log para verificar que debug se está agregando
      console.log('\n\n✅ DEBUG INFO AGREGADO A STATS');
      console.log('Debug tiene:', Object.keys(debugInfo));
      console.log('Total clientes en debug.customersWithFilter:', debugInfo.customersWithFilter?.length);
      console.log('Total clientes en debug.allCustomers:', debugInfo.allCustomers?.length);
      console.log('\n\n');
    } else {
      console.log('\n\n⚠️ DEBUG INFO NO AGREGADO');
      console.log('isSuperadmin:', isSuperadmin);
      console.log('debugInfo existe:', !!debugInfo);
      console.log('\n\n');
    }

    // Temporalmente deshabilitar caché para debug
    // cache.set(cacheKey, stats, 120);

    logger.info('Dashboard stats', { 
      tenantId, 
      isSuperadmin,
      totalCustomers: stats.overview.totalCustomers,
      totalInvoices: stats.overview.totalInvoices,
      tenantIds: isSuperadmin ? tenantIds : undefined,
      hasDebug: !!stats.debug
    });
    
    // Log del objeto stats antes de enviarlo
    if (isSuperadmin) {
      console.log('\n\n📤 ENVIANDO STATS CON DEBUG:', {
        hasDebug: !!stats.debug,
        debugKeys: stats.debug ? Object.keys(stats.debug) : null,
        overview: stats.overview
      });
      console.log('\n\n');
    }
    
    res.json(stats);
  } catch (error) {
    logger.error('Error dashboard stats', { 
      error: error.message, 
      stack: error.stack,
      tenantId: req.user.tenantId, 
      role: req.user.role 
    });
    console.error('Error completo en dashboard stats:', error);
    res.status(500).json({ 
      error: 'Error obteniendo estadísticas',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
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



