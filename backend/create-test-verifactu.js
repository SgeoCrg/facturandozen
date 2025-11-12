#!/usr/bin/env node

/**
 * Script para crear registro Verifactu de prueba
 */

const db = require('./src/models');

async function createTestVerifactuRecord() {
  try {
    console.log('🔍 Buscando factura para crear Verifactu de prueba...');
    
    // Buscar cualquier factura
    const invoice = await db.Invoice.findOne({
      include: [
        { model: db.Customer, as: 'customer', required: false },
        { model: db.InvoiceLine, as: 'lines' }
      ]
    });

    if (!invoice) {
      console.log('❌ No hay facturas para probar');
      return;
    }

    console.log(`✅ Factura encontrada: ${invoice.fullNumber}`);

    // Crear registro Verifactu de prueba
    const testRecord = await db.VerifactuRecord.create({
      tenantId: invoice.tenantId,
      invoiceId: invoice.id,
      hash: 'test123456789abcdef123456789abcdef12345678',
      previousHash: '',
      xmlUnsigned: '<?xml version="1.0"?><test>XML de prueba</test>',
      xmlSigned: '<?xml version="1.0"?><test>XML firmado de prueba</test>',
      aeatResponse: { success: true, code: 'TEST123' },
      aeatCsv: 'TEST1234567890XYZ',
      sentAt: new Date(),
      status: 'accepted',
      errorMessage: null,
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    });

    console.log('✅ Registro Verifactu de prueba creado:');
    console.log(`   ID: ${testRecord.id}`);
    console.log(`   Estado: ${testRecord.status}`);
    console.log(`   CSV: ${testRecord.aeatCsv}`);
    console.log(`   Hash: ${testRecord.hash.substring(0, 16)}...`);
    console.log(`   QR: ${testRecord.qrCode ? '✅ Sí' : '❌ No'}`);

    console.log('\n🎯 Ahora puedes:');
    console.log('   1. Ir al frontend');
    console.log('   2. Descargar el PDF de esta factura');
    console.log('   3. Verificar que incluye Verifactu');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

createTestVerifactuRecord();
