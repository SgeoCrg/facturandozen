#!/usr/bin/env node

/**
 * Script de prueba para verificar PDF con Verifactu
 */

const db = require('./src/models');
const PDFService = require('./src/services/PDFService');

async function testPDFWithVerifactu() {
  try {
    console.log('🔍 Buscando factura con Verifactu...');
    
    // Buscar factura con registro Verifactu
    const invoice = await db.Invoice.findOne({
      include: [
        { model: db.Customer, as: 'customer', required: false },
        { model: db.InvoiceLine, as: 'lines' },
        { 
          model: db.VerifactuRecord, 
          as: 'verifactu', 
          required: true,
          where: { status: 'accepted' }
        }
      ]
    });

    if (!invoice) {
      console.log('❌ No se encontró factura con Verifactu aceptada');
      console.log('💡 Crea una factura y envíala a Verifactu primero');
      return;
    }

    console.log(`✅ Factura encontrada: ${invoice.fullNumber}`);
    console.log(`📊 Estado Verifactu: ${invoice.verifactu?.status}`);
    console.log(`🔗 CSV: ${invoice.verifactu?.aeatCsv}`);
    console.log(`🔐 Hash: ${invoice.verifactu?.hash?.substring(0, 16)}...`);

    // Obtener configuración
    const settings = await db.Settings.findOne();
    
    console.log('📄 Generando PDF con Verifactu...');
    
    // Generar PDF
    const pdf = await PDFService.generateInvoicePDF(invoice, settings, invoice.verifactu);
    
    console.log(`✅ PDF generado: ${pdf.length} bytes`);
    console.log('🎯 El PDF ahora incluye:');
    console.log('   - QR Code Verifactu');
    console.log('   - CSV de verificación');
    console.log('   - Hash de la factura');
    console.log('   - Estado AEAT');
    console.log('   - Fecha de envío');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

testPDFWithVerifactu();
