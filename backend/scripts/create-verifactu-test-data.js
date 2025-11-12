const { db } = require('../src/models');
const bcrypt = require('bcryptjs');

async function createVerifactuTestData() {
  try {
    console.log('🔐 Creando datos de prueba para Verifactu...\n');

    // Obtener tenants existentes
    const tenants = await db.Tenant.findAll();
    
    for (const tenant of tenants) {
      // Crear certificados de prueba para cada tenant
      const certificateData = {
        tenantId: tenant.id,
        certificateEncrypted: '-----BEGIN CERTIFICATE-----\nMIIFjTCCA3WgAwIBAgIJAK...\n-----END CERTIFICATE-----',
        certificatePassword: 'password123',
        certificateExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
        status: Math.random() > 0.3 ? 'active' : 'expired'
      };

      await db.Tenant.update(certificateData, {
        where: { id: tenant.id }
      });

      // Crear registros de Verifactu para algunas facturas
      const invoices = await db.Invoice.findAll({
        where: { tenantId: tenant.id },
        limit: 3
      });

      for (const invoice of invoices) {
        await db.VerifactuSubmission.create({
          tenantId: tenant.id,
          invoiceId: invoice.id,
          status: Math.random() > 0.2 ? 'submitted' : 'failed',
          submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          responseCode: Math.random() > 0.2 ? '200' : '400',
          responseMessage: Math.random() > 0.2 ? 'Factura enviada correctamente' : 'Error en el envío',
          retryCount: Math.floor(Math.random() * 3),
          lastRetryAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        });
      }

      console.log(`✅ Datos Verifactu creados para ${tenant.name}`);
    }

    console.log('\n🎉 Datos de Verifactu creados exitosamente!');
    
  } catch (error) {
    console.error('❌ Error creando datos de Verifactu:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createVerifactuTestData()
    .then(() => {
      console.log('✅ Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = createVerifactuTestData;