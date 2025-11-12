const db = require('../models');
const VerifactuService = require('./VerifactuService');
const CertificateService = require('./CertificateService');
const logger = require('../utils/logger');

/**
 * Servicio de Retry Automático VERI*FACTU
 * Cumple requisito AEAT de reintentos automáticos
 */
class VerifactuRetryService {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 30000; // 30 segundos
    this.maxDelay = 300000; // 5 minutos
  }

  /**
   * Procesa facturas pendientes de envío
   */
  async processPendingInvoices() {
    try {
      logger.info('🔄 Iniciando procesamiento facturas pendientes Verifactu');

      // Obtener facturas con errores o pendientes
      const pendingRecords = await db.VerifactuRecord.findAll({
        where: {
          status: ['error', 'rejected'],
          // Solo reintentar si han pasado al menos 5 minutos desde último intento
          updatedAt: {
            [db.Sequelize.Op.lt]: new Date(Date.now() - 5 * 60 * 1000)
          }
        },
        include: [{
          model: db.Invoice,
          as: 'invoice',
          include: [
            { model: db.Customer, as: 'customer', required: false },
            { model: db.InvoiceLine, as: 'lines' }
          ]
        }],
        limit: 10 // Procesar máximo 10 por vez
      });

      logger.info(`📋 Encontradas ${pendingRecords.length} facturas para reintentar`);

      for (const record of pendingRecords) {
        await this.retryInvoice(record);
        // Delay entre reintentos para no saturar AEAT
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      logger.info('✅ Procesamiento facturas pendientes completado');
    } catch (error) {
      logger.error('❌ Error procesando facturas pendientes', { error: error.message });
    }
  }

  /**
   * Reintenta envío de una factura específica
   */
  async retryInvoice(record) {
    try {
      const invoice = record.invoice;
      const tenant = await db.Tenant.findByPk(record.tenantId);

      // Verificar requisitos
      if (!tenant.certificateEncrypted) {
        logger.warn('Retry: Certificado no configurado', { invoiceId: invoice.id });
        return;
      }

      if (CertificateService.isExpired(tenant.certificateExpiresAt)) {
        logger.warn('Retry: Certificado expirado', { invoiceId: invoice.id });
        return;
      }

      // Verificar modo producción
      if (process.env.VERIFACTU_ENVIRONMENT !== 'production') {
        logger.info('Retry: Modo test - reintento deshabilitado', { invoiceId: invoice.id });
        return;
      }

      logger.info(`🔄 Reintentando factura ${invoice.fullNumber}`, { 
        invoiceId: invoice.id,
        previousStatus: record.status,
        attempts: record.retryCount || 0
      });

      // Obtener hash anterior
      const prevRecord = await db.VerifactuRecord.findOne({
        where: { 
          tenantId: record.tenantId,
          createdAt: { [db.Sequelize.Op.lt]: record.createdAt }
        },
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

      // Actualizar registro
      await record.update({
        hash,
        previousHash,
        xmlUnsigned: xml,
        xmlSigned: signedXML,
        aeatResponse: aeatResponse,
        aeatCsv: aeatResponse.csv,
        sentAt: new Date(),
        status: aeatResponse.success ? 'accepted' : 'rejected',
        errorMessage: aeatResponse.success ? null : aeatResponse.message,
        qrCode,
        retryCount: (record.retryCount || 0) + 1
      });

      // Actualizar estado factura
      if (aeatResponse.success) {
        await invoice.update({ status: 'issued' });
      }

      logger.info(`✅ Retry exitoso: ${invoice.fullNumber}`, { 
        invoiceId: invoice.id,
        status: aeatResponse.success ? 'accepted' : 'rejected'
      });

    } catch (error) {
      logger.error(`❌ Error en retry: ${record.invoice?.fullNumber}`, { 
        error: error.message,
        invoiceId: record.invoice?.id
      });

      // Actualizar contador de reintentos
      await record.update({
        retryCount: (record.retryCount || 0) + 1,
        errorMessage: error.message,
        updatedAt: new Date()
      });
    }
  }

  /**
   * Procesa facturas nuevas sin registro Verifactu
   */
  async processNewInvoices() {
    try {
      logger.info('🔄 Procesando facturas nuevas sin Verifactu');

      // Obtener facturas creadas en las últimas 24h sin registro Verifactu
      const newInvoices = await db.Invoice.findAll({
        where: {
          createdAt: {
            [db.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          },
          status: 'draft'
        },
        include: [
          { model: db.Customer, as: 'customer', required: false },
          { model: db.InvoiceLine, as: 'lines' },
          { 
            model: db.VerifactuRecord, 
            as: 'verifactu', 
            required: false 
          }
        ],
        limit: 20
      });

      // Filtrar solo las que no tienen registro Verifactu
      const invoicesWithoutVerifactu = newInvoices.filter(inv => !inv.verifactu);

      logger.info(`📋 Encontradas ${invoicesWithoutVerifactu.length} facturas nuevas sin Verifactu`);

      for (const invoice of invoicesWithoutVerifactu) {
        const tenant = await db.Tenant.findByPk(invoice.tenantId);
        
        // Solo procesar si tiene plan PRO y certificado
        if (tenant.plan === 'PRO' && tenant.certificateEncrypted && 
            !CertificateService.isExpired(tenant.certificateExpiresAt)) {
          
          await this.sendNewInvoice(invoice, tenant);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

    } catch (error) {
      logger.error('❌ Error procesando facturas nuevas', { error: error.message });
    }
  }

  /**
   * Envía factura nueva a Verifactu
   */
  async sendNewInvoice(invoice, tenant) {
    try {
      logger.info(`📤 Enviando factura nueva: ${invoice.fullNumber}`);

      // Obtener hash anterior
      const prevRecord = await db.VerifactuRecord.findOne({
        where: { tenantId: tenant.id },
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

      // Crear registro
      await db.VerifactuRecord.create({
        tenantId: tenant.id,
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

      logger.info(`✅ Factura nueva enviada: ${invoice.fullNumber}`, { 
        status: aeatResponse.success ? 'accepted' : 'rejected'
      });

    } catch (error) {
      logger.error(`❌ Error enviando factura nueva: ${invoice.fullNumber}`, { 
        error: error.message,
        invoiceId: invoice.id
      });

      // Crear registro de error
      await db.VerifactuRecord.create({
        tenantId: tenant.id,
        invoiceId: invoice.id,
        status: 'error',
        errorMessage: error.message,
        sentAt: new Date()
      });
    }
  }

  /**
   * Estadísticas de Verifactu
   */
  async getStats(tenantId) {
    try {
      const stats = await db.VerifactuRecord.findAll({
        where: { tenantId },
        attributes: [
          'status',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      const result = {
        total: 0,
        accepted: 0,
        rejected: 0,
        error: 0,
        pending: 0
      };

      stats.forEach(stat => {
        result.total += parseInt(stat.count);
        result[stat.status] = parseInt(stat.count);
      });

      return result;
    } catch (error) {
      logger.error('Error obteniendo estadísticas Verifactu', { error: error.message });
      return null;
    }
  }
}

module.exports = new VerifactuRetryService();
