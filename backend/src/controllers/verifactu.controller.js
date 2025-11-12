const db = require('../models');
const VerifactuService = require('../services/VerifactuService');
const VerifactuRetryService = require('../services/VerifactuRetryService');
const CertificateService = require('../services/CertificateService');

/**
 * Subir certificado digital
 */
exports.uploadCertificate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo certificado requerido' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Contraseña requerida' });
    }

    const certificateBuffer = req.file.buffer;

    // Validar certificado
    const certInfo = CertificateService.validateCertificate(certificateBuffer, password);

    // Cifrar
    const encryptedCert = CertificateService.encryptCertificate(certificateBuffer, password);
    const encryptedPassword = CertificateService.encryptPassword(password);

    // Guardar en tenant
    const tenant = await db.Tenant.findByPk(req.user.tenantId);
    tenant.certificateEncrypted = encryptedCert;
    tenant.certificatePassword = encryptedPassword;
    tenant.certificateExpiresAt = certInfo.validTo;
    await tenant.save();

    console.log(`📜 Certificado subido: ${tenant.name}`);

    res.json({
      message: 'Certificado subido correctamente',
      certificate: {
        subject: certInfo.subject,
        validFrom: certInfo.validFrom,
        validTo: certInfo.validTo
      }
    });
  } catch (error) {
    console.error('Error subiendo certificado:', error);
    res.status(400).json({ 
      error: error.message || 'Error procesando certificado' 
    });
  }
};

/**
 * Estado certificado
 */
exports.getCertificateStatus = async (req, res) => {
  try {
    const tenant = await db.Tenant.findByPk(req.user.tenantId);

    if (!tenant.certificateEncrypted) {
      return res.json({
        hasCertificate: false,
        message: 'No hay certificado configurado'
      });
    }

    const isExpired = CertificateService.isExpired(tenant.certificateExpiresAt);
    const isExpiringSoon = CertificateService.isExpiringSoon(tenant.certificateExpiresAt);

    res.json({
      hasCertificate: true,
      expiresAt: tenant.certificateExpiresAt,
      isExpired,
      isExpiringSoon,
      daysUntilExpiration: Math.ceil(
        (new Date(tenant.certificateExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)
      )
    });
  } catch (error) {
    console.error('Error verificando certificado:', error);
    res.status(500).json({ error: 'Error verificando certificado' });
  }
};

/**
 * Eliminar certificado
 */
exports.deleteCertificate = async (req, res) => {
  try {
    const tenant = await db.Tenant.findByPk(req.user.tenantId);
    tenant.certificateEncrypted = null;
    tenant.certificatePassword = null;
    tenant.certificateExpiresAt = null;
    await tenant.save();

    res.json({ message: 'Certificado eliminado' });
  } catch (error) {
    console.error('Error eliminando certificado:', error);
    res.status(500).json({ error: 'Error eliminando certificado' });
  }
};

/**
 * Enviar factura a Verifactu
 */
exports.sendInvoice = async (req, res) => {
  try {
    // Obtener tenant con certificado
    const tenant = await db.Tenant.findByPk(req.user.tenantId);

    if (!tenant.certificateEncrypted) {
      return res.status(400).json({ error: 'Certificado no configurado' });
    }

    if (CertificateService.isExpired(tenant.certificateExpiresAt)) {
      return res.status(400).json({ error: 'Certificado expirado' });
    }

    // Obtener factura completa
    const invoice = await db.Invoice.findOne({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId
      },
      include: [
        { model: db.Customer, as: 'customer', required: false },
        { model: db.InvoiceLine, as: 'lines' }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    // Verificar no enviada ya
    const existing = await db.VerifactuRecord.findOne({
      where: { invoiceId: invoice.id }
    });

    if (existing && existing.status === 'accepted') {
      return res.status(400).json({ error: 'Factura ya enviada y aceptada' });
    }

    // Obtener hash anterior
    const prevRecord = await db.VerifactuRecord.findOne({
      where: { tenantId: req.user.tenantId },
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
    const record = await db.VerifactuRecord.create({
      tenantId: req.user.tenantId,
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

    console.log(`✅ Verifactu: ${invoice.fullNumber} - ${aeatResponse.code}`);

    res.json({
      message: aeatResponse.success ? 'Factura enviada y aceptada' : 'Error en envío',
      success: aeatResponse.success,
      hash,
      csv: aeatResponse.csv,
      qrCode,
      aeatResponse
    });
  } catch (error) {
    console.error('Error enviando Verifactu:', error);
    res.status(500).json({ 
      error: error.message || 'Error procesando Verifactu' 
    });
  }
};

/**
 * Obtener estadísticas Verifactu
 */
exports.getStats = async (req, res) => {
  try {
    const stats = await VerifactuRetryService.getStats(req.user.tenantId);
    res.json({ stats });
  } catch (error) {
    console.error('Error obteniendo estadísticas Verifactu:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
};

/**
 * Reintentar factura manualmente
 */
exports.retryInvoice = async (req, res) => {
  try {
    const record = await db.VerifactuRecord.findOne({
      where: {
        invoiceId: req.params.id,
        tenantId: req.user.tenantId
      },
      include: [{
        model: db.Invoice,
        as: 'invoice',
        include: [
          { model: db.Customer, as: 'customer', required: false },
          { model: db.InvoiceLine, as: 'lines' }
        ]
      }]
    });

    if (!record) {
      return res.status(404).json({ error: 'Registro Verifactu no encontrado' });
    }

    await VerifactuRetryService.retryInvoice(record);

    // Obtener registro actualizado
    const updatedRecord = await db.VerifactuRecord.findByPk(record.id);

    res.json({
      message: 'Reintento completado',
      record: updatedRecord
    });
  } catch (error) {
    console.error('Error reintentando factura:', error);
    res.status(500).json({ error: 'Error reintentando factura' });
  }
};

/**
 * Procesar facturas pendientes manualmente
 */
exports.processPending = async (req, res) => {
  try {
    await VerifactuRetryService.processPendingInvoices();
    res.json({ message: 'Procesamiento de facturas pendientes completado' });
  } catch (error) {
    console.error('Error procesando facturas pendientes:', error);
    res.status(500).json({ error: 'Error procesando facturas pendientes' });
  }
};



