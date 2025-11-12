#!/usr/bin/env node

/**
 * Script para verificar estado de facturas y Verifactu
 */

const db = require('./src/models');

async function checkInvoicesAndVerifactu() {
  try {
    console.log('🔍 Verificando facturas y estado Verifactu...\n');
    
    // 1. Contar facturas totales
    const totalInvoices = await db.Invoice.count();
    console.log(`📊 Total facturas: ${totalInvoices}`);
    
    // 2. Verificar registros Verifactu
    const verifactuRecords = await db.VerifactuRecord.findAll({
      include: [
        { model: db.Invoice }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`📊 Registros Verifactu: ${verifactuRecords.length}\n`);
    
    if (verifactuRecords.length === 0) {
      console.log('❌ NO HAY REGISTROS VERIFACTU');
      console.log('💡 Necesitas:');
      console.log('   1. Crear una factura');
      console.log('   2. Ir a Settings → Verifactu → Subir certificado');
      console.log('   3. Enviar la factura a Verifactu');
      return;
    }
    
    // 3. Mostrar estado de cada registro
    console.log('📋 ESTADO VERIFACTU:');
    verifactuRecords.forEach((record, index) => {
      console.log(`\n${index + 1}. Factura: ${record.Invoice?.fullNumber || 'N/A'}`);
      console.log(`   Estado: ${record.status}`);
      console.log(`   CSV: ${record.aeatCsv || 'N/A'}`);
      console.log(`   Hash: ${record.hash ? record.hash.substring(0, 16) + '...' : 'N/A'}`);
      console.log(`   QR: ${record.qrCode ? '✅ Sí' : '❌ No'}`);
      console.log(`   Enviado: ${record.sentAt ? new Date(record.sentAt).toLocaleDateString('es-ES') : 'N/A'}`);
      if (record.errorMessage) {
        console.log(`   Error: ${record.errorMessage}`);
      }
    });
    
    // 4. Buscar facturas SIN Verifactu
    const invoicesWithoutVerifactu = await db.Invoice.findAll({
      include: [
        { model: db.VerifactuRecord, as: 'verifactu', required: false }
      ],
      where: {
        '$verifactu.id$': null
      },
      limit: 5
    });
    
    console.log(`\n📋 FACTURAS SIN VERIFACTU (${invoicesWithoutVerifactu.length}):`);
    invoicesWithoutVerifactu.forEach((invoice, index) => {
      console.log(`   ${index + 1}. ${invoice.fullNumber} - ${invoice.date}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

checkInvoicesAndVerifactu();
