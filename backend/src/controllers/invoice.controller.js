const db = require('../models');
const DataStandardizationService = require('../services/DataStandardizationService');
const PDFService = require('../services/PDFService');
const VerifactuService = require('../services/VerifactuService');
const CertificateService = require('../services/CertificateService');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const { Op } = require('sequelize');

exports.list = async (req, res) => {
  try {
    const { search, status, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const cacheKey = cache.getInvoicesKey(req.user.tenantId) + JSON.stringify(req.query);
    
    // Intentar desde caché
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.info('Invoices from cache', { tenantId: req.user.tenantId });
      return res.json(cached);
    }

    const where = { tenantId: req.user.tenantId };

    // Búsqueda por número o cliente
    if (search) {
      where[Op.or] = [
        { fullNumber: { [Op.iLike]: `%${search}%` } },
        { customerName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filtro por estado
    if (status) {
      where.status = status;
    }

    // Filtro por fechas
    if (dateFrom) {
      where.date = { ...where.date, [Op.gte]: dateFrom };
    }
    if (dateTo) {
      where.date = { ...where.date, [Op.lte]: dateTo };
    }

    // Paginación
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: invoices } = await db.Invoice.findAndCountAll({
      where,
      include: [{
        model: db.Customer,
        as: 'customer',
        attributes: ['name', 'nif'],
        required: false
      }],
      order: [['date', 'DESC'], ['number', 'DESC']],
      limit: limitNum,
      offset: offset
    });

    const result = {
      invoices,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum)
      }
    };

    // Guardar en caché 2 minutos
    cache.set(cacheKey, result, 120);

    res.json(result);
  } catch (error) {
    logger.error('Error listando facturas', { error: error.message, tenantId: req.user.tenantId });
    res.status(500).json({ error: 'Error obteniendo facturas' });
  }
};

exports.create = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { customerId, customerManual, date, series, lines, notes } = req.body;

    if (!date || !lines || lines.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Validar que tenga cliente ID O datos manuales
    if (!customerId && (!customerManual || !customerManual.name || !customerManual.nif)) {
      return res.status(400).json({ error: 'Debe seleccionar un cliente o proporcionar datos manualmente' });
    }

    // Obtener siguiente número (por tenant y serie)
    const lastInvoice = await db.Invoice.findOne({
      where: { 
        tenantId: req.user.tenantId,
        series: series || 'A'
      },
      order: [['number', 'DESC']],
      transaction
    });

    const nextNumber = (lastInvoice?.number || 0) + 1;
    const year = new Date(date).getFullYear();
    const fullNumber = DataStandardizationService.formatInvoiceNumber(
      series || 'A',
      nextNumber,
      year
    );

    // Calcular totales
    const totals = DataStandardizationService.calculateInvoiceTotals(lines);

    // Crear factura (con o sin cliente asociado)
    const invoiceData = {
      tenantId: req.user.tenantId,
      number: nextNumber,
      series: series || 'A',
      fullNumber,
      date,
      subtotal: totals.subtotal,
      totalIva: totals.totalIVA,
      total: totals.total,
      notes
    };

    // Si tiene customerId, usarlo
    if (customerId) {
      invoiceData.customerId = customerId;
    }
    
    // Si tiene datos manuales, guardarlos
    if (customerManual) {
      invoiceData.customerName = customerManual.name;
      invoiceData.customerNif = customerManual.nif;
      invoiceData.customerAddress = customerManual.address || null;
    }

    const invoice = await db.Invoice.create(invoiceData, { transaction });

    // Crear líneas (productos o manual)
    for (const line of lines) {
      const lineTotal = DataStandardizationService.normalizePrice(
        line.quantity * line.price * (1 + line.ivaRate / 100)
      );

      await db.InvoiceLine.create({
        invoiceId: invoice.id,
        description: line.description,
        quantity: line.quantity,
        price: line.price,
        ivaRate: line.ivaRate,
        total: lineTotal
      }, { transaction });
    }

    await transaction.commit();

    // Invalidar caché
    cache.del(cache.getInvoicesKey(req.user.tenantId));

    const fullInvoice = await db.Invoice.findByPk(invoice.id, {
      include: [
        { model: db.Customer, as: 'customer', required: false },
        { model: db.InvoiceLine, as: 'lines' }
      ]
    });

    // ENVÍO AUTOMÁTICO VERI*FACTU (REQUISITO AEAT)
    try {
      await sendToVerifactuAutomatically(fullInvoice, req.user.tenantId);
    } catch (verifactuError) {
      logger.error('Error envío automático Verifactu', { 
        error: verifactuError.message, 
        invoiceId: invoice.id,
        tenantId: req.user.tenantId 
      });
      // No fallar la creación de factura por error Verifactu
    }

    logger.info('Factura creada', { invoiceId: invoice.id, tenantId: req.user.tenantId });
    res.status(201).json({ invoice: fullInvoice });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creando factura', { error: error.message, tenantId: req.user.tenantId });
    res.status(400).json({ error: error.message || 'Error creando factura' });
  }
};

exports.get = async (req, res) => {
  try {
    const invoice = await db.Invoice.findOne({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId
      },
      include: [
        { model: db.Customer, as: 'customer', required: false },
        { model: db.InvoiceLine, as: 'lines' },
        { model: db.VerifactuRecord, as: 'verifactu', required: false }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    res.json({ invoice });
  } catch (error) {
    logger.error('Error obteniendo factura', { error: error.message, invoiceId: req.params.id });
    res.status(500).json({ error: 'Error obteniendo factura' });
  }
};

exports.generatePDF = async (req, res) => {
  try {
    const invoice = await db.Invoice.findOne({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId
      },
      include: [
        { model: db.Customer, as: 'customer', required: false },
        { model: db.InvoiceLine, as: 'lines' },
        { model: db.VerifactuRecord, as: 'verifactu', required: false }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    const settings = await db.Settings.findOne();

    const pdf = await PDFService.generateInvoicePDF(invoice, settings, invoice.verifactu);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=factura-${invoice.fullNumber}.pdf`);
    res.send(pdf);
  } catch (error) {
    logger.error('Error generando PDF', { error: error.message, invoiceId: req.params.id });
    res.status(500).json({ error: 'Error generando PDF' });
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const invoices = await db.Invoice.findAll({
      where: { tenantId: req.user.tenantId },
      include: [{
        model: db.Customer,
        as: 'customer',
        attributes: ['name', 'nif'],
        required: false
      }],
      order: [['date', 'DESC'], ['number', 'DESC']]
    });

    // Generar CSV
    const headers = ['Número', 'Fecha', 'Cliente', 'NIF', 'Subtotal', 'IVA', 'Total', 'Estado'];
    const rows = invoices.map(inv => [
      inv.fullNumber,
      new Date(inv.date).toLocaleDateString('es-ES'),
      inv.customer?.name || inv.customerName || '',
      inv.customer?.nif || inv.customerNif || '',
      parseFloat(inv.subtotal).toFixed(2),
      parseFloat(inv.totalIva).toFixed(2),
      parseFloat(inv.total).toFixed(2),
      inv.status
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=facturas.csv');
    res.send('\uFEFF' + csv); // BOM para Excel
    
    logger.info('CSV exported', { tenantId: req.user.tenantId, count: invoices.length });
  } catch (error) {
    logger.error('Error exportando CSV', { error: error.message, tenantId: req.user.tenantId });
    res.status(500).json({ error: 'Error exportando CSV' });
  }
};

/**
 * ENVÍO AUTOMÁTICO VERI*FACTU - REQUISITO AEAT
 * Se ejecuta automáticamente al crear factura si:
 * - Tenant tiene plan PRO
 * - Certificado configurado y válido
 * - Modo producción activo
 */
async function sendToVerifactuAutomatically(invoice, tenantId) {
  try {
    // Obtener tenant con certificado
    const tenant = await db.Tenant.findByPk(tenantId);
    
    // Verificar requisitos
    if (tenant.plan !== 'PRO') {
      logger.info('Verifactu: Tenant no tiene plan PRO', { tenantId });
      return;
    }
    
    if (!tenant.certificateEncrypted) {
      logger.info('Verifactu: Certificado no configurado', { tenantId });
      return;
    }
    
    if (CertificateService.isExpired(tenant.certificateExpiresAt)) {
      logger.warn('Verifactu: Certificado expirado', { tenantId });
      return;
    }
    
    // Verificar modo producción
    if (process.env.VERIFACTU_ENVIRONMENT !== 'production') {
      logger.info('Verifactu: Modo test - envío automático deshabilitado', { tenantId });
      return;
    }
    
    // Verificar si ya existe registro
    const existing = await db.VerifactuRecord.findOne({
      where: { invoiceId: invoice.id }
    });
    
    if (existing) {
      logger.info('Verifactu: Factura ya enviada', { invoiceId: invoice.id });
      return;
    }
    
    // Obtener hash anterior
    const prevRecord = await db.VerifactuRecord.findOne({
      where: { tenantId },
      order: [['createdAt', 'DESC']]
    });
    
    const previousHash = prevRecord?.hash || '';
    
    // Generar hash actual
    const hash = VerifactuService.generateInvoiceHash(
      {
        fullNumber: invoice.fullNumber,
        date: invoice.date,
        total: parseFloat(invoice.total),
        customerNif: invoice.customer?.nif || invoice.customerNif
      },
      previousHash
    );
    
    // Generar XML
    const xml = VerifactuService.generateVerifactuXML(invoice, tenant, hash, previousHash);
    
    // Firmar XML
    const signedXML = await VerifactuService.signXML(
      xml,
      tenant.certificateEncrypted,
      tenant.certificatePassword,
      CertificateService
    );
    
    // Enviar a AEAT
    const aeatResponse = await VerifactuService.sendToAEAT(signedXML);
    
    // Generar QR
    const verifactuData = {
      hash,
      aeatCsv: aeatResponse.csv
    };
    const qrCode = await VerifactuService.generateQRCode(invoice, tenant, verifactuData);
    
    // Guardar registro
    await db.VerifactuRecord.create({
      tenantId,
      invoiceId: invoice.id,
      hash,
      previousHash,
      xmlUnsigned: xml,
      xmlSigned: signedXML,
      aeatResponse: aeatResponse,
      aeatCsv: aeatResponse.csv,
      sentAt: new Date(),
      status: aeatResponse.success ? 'accepted' : 'rejected',
      errorMessage: aeatResponse.success ? null : aeatResponse.message,
      qrCode
    });
    
    // Actualizar estado factura
    if (aeatResponse.success) {
      await invoice.update({ status: 'issued' });
    }
    
    logger.info('✅ Verifactu automático exitoso', { 
      invoiceId: invoice.id,
      fullNumber: invoice.fullNumber,
      status: aeatResponse.success ? 'accepted' : 'rejected'
    });
    
  } catch (error) {
    logger.error('❌ Error envío automático Verifactu', { 
      error: error.message,
      invoiceId: invoice.id,
      tenantId
    });
    
    // Guardar registro de error para retry posterior
    try {
      await db.VerifactuRecord.create({
        tenantId,
        invoiceId: invoice.id,
        status: 'error',
        errorMessage: error.message,
        sentAt: new Date()
      });
    } catch (dbError) {
      logger.error('Error guardando registro Verifactu error', { error: dbError.message });
    }
    
    throw error;
  }
}

