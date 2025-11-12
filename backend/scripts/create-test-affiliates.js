#!/usr/bin/env node

/**
 * Script para crear afiliados de prueba
 * Ejecutar: node scripts/create-test-affiliates.js
 */

const db = require('../src/models');
const AffiliateService = require('../src/services/AffiliateService');

async function createTestAffiliates() {
  console.log('🚀 Creando afiliados de prueba...\n');

  try {
    // Crear afiliados de prueba
    const affiliates = [
      {
        name: 'Juan Pérez',
        email: 'juan@afiliado.com',
        phone: '+34 600 123 456',
        commissionRate: 20
      },
      {
        name: 'María García',
        email: 'maria@afiliado.com',
        phone: '+34 600 789 012',
        commissionRate: 25
      },
      {
        name: 'Carlos López',
        email: 'carlos@afiliado.com',
        phone: '+34 600 345 678',
        commissionRate: 15
      }
    ];

    const createdAffiliates = [];

    for (const affiliateData of affiliates) {
      try {
        const affiliate = await AffiliateService.createAffiliate(affiliateData);
        createdAffiliates.push(affiliate);
        
        console.log(`✅ Afiliado creado: ${affiliate.name}`);
        console.log(`   Código: ${affiliate.code}`);
        console.log(`   Email: ${affiliate.email}`);
        console.log(`   Comisión: ${affiliate.commissionRate}%`);
        console.log('');
      } catch (error) {
        console.log(`❌ Error creando afiliado ${affiliateData.name}:`, error.message);
      }
    }

    console.log('📊 Resumen:');
    console.log(`   Afiliados creados: ${createdAffiliates.length}`);
    console.log(`   Total en BD: ${await db.Affiliate.count()}`);

    console.log('\n🔗 Enlaces de afiliado generados:');
    for (const affiliate of createdAffiliates) {
      const link = AffiliateService.generateAffiliateLink(affiliate.code);
      console.log(`   ${affiliate.name}: ${link}`);
    }

    console.log('\n🎯 Para probar el sistema:');
    console.log('   1. Usa uno de los enlaces para registrarte');
    console.log('   2. Completa el trial y convierte a pago');
    console.log('   3. Ve las comisiones en el panel superadmin');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestAffiliates();
}

module.exports = createTestAffiliates;
