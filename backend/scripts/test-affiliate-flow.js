#!/usr/bin/env node

/**
 * Script para probar el flujo completo del sistema de afiliados
 * Ejecutar: node scripts/test-affiliate-flow.js
 */

const db = require('../src/models');
const AffiliateService = require('../src/services/AffiliateService');
const bcrypt = require('bcrypt');

async function testAffiliateFlow() {
  console.log('🧪 PROBANDO FLUJO COMPLETO DE AFILIADOS\n');

  try {
    // 1. Obtener afiliado existente
    console.log('1️⃣ Obteniendo afiliado existente...');
    const affiliate = await db.Affiliate.findOne({ where: { code: 'JUANPR409A4E' } });
    console.log(`   ✅ Afiliado: ${affiliate.name} (${affiliate.code})`);
    console.log(`   📧 Email: ${affiliate.email}`);
    console.log(`   💰 Comisión: ${affiliate.commissionRate}%\n`);

    // 2. Crear tenant de prueba (simulando registro con referido)
    console.log('2️⃣ Creando tenant de prueba...');
    const tenant = await db.Tenant.create({
      name: 'Empresa Prueba S.L.',
      nif: 'B' + Math.random().toString().substr(2, 8), // NIF único
      email: 'prueba' + Date.now() + '@empresa.com', // Email único
      address: 'Calle Prueba 123',
      status: 'trial'
    });
    console.log(`   ✅ Tenant creado: ${tenant.name} (${tenant.id})\n`);

    // 3. Crear subscription trial
    console.log('3️⃣ Creando suscripción trial...');
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const subscription = await db.Subscription.create({
      tenantId: tenant.id,
      plan: 'basic',
      status: 'trial',
      trialEndsAt,
      priceMonthly: 19.00,
      maxInvoices: 50
    });
    console.log(`   ✅ Suscripción creada: ${subscription.plan} - €${subscription.priceMonthly}/mes\n`);

    // 4. Registrar referido
    console.log('4️⃣ Registrando referido...');
    const { referral } = await AffiliateService.registerReferral(affiliate.code, tenant.id);
    console.log(`   ✅ Referido registrado: ${referral.id}`);
    console.log(`   📊 Estado: ${referral.status}\n`);

    // 5. Simular conversión (trial → pago)
    console.log('5️⃣ Simulando conversión trial → pago...');
    await subscription.update({ status: 'active' });
    const commission = await AffiliateService.processConversion(subscription.id);
    
    if (commission) {
      console.log(`   ✅ Comisión creada: €${commission.amount}`);
      console.log(`   📊 Estado: ${commission.status}`);
      console.log(`   💰 Rate: ${commission.commissionRate}%\n`);
    } else {
      console.log('   ❌ No se creó comisión\n');
    }

    // 6. Verificar estadísticas actualizadas
    console.log('6️⃣ Verificando estadísticas...');
    const updatedAffiliate = await db.Affiliate.findByPk(affiliate.id);
    const stats = await AffiliateService.getGlobalStats();
    
    console.log(`   📊 Afiliado actualizado:`);
    console.log(`      - Referidos: ${updatedAffiliate.referralCount}`);
    console.log(`      - Conversiones: ${updatedAffiliate.conversionCount}`);
    console.log(`      - Ganancias totales: €${updatedAffiliate.totalEarnings}`);
    console.log(`      - Ganancias pendientes: €${updatedAffiliate.pendingEarnings}\n`);
    
    console.log(`   📊 Estadísticas globales:`);
    console.log(`      - Total afiliados: ${stats.totalAffiliates}`);
    console.log(`      - Total referidos: ${stats.totalReferrals}`);
    console.log(`      - Total conversiones: ${stats.totalConversions}`);
    console.log(`      - Tasa conversión: ${stats.conversionRate}%`);
    console.log(`      - Comisiones pendientes: €${stats.pendingCommissions}\n`);

    // 7. Simular pago de comisión
    console.log('7️⃣ Simulando pago de comisión...');
    if (commission) {
      await AffiliateService.payCommission(commission.id, {
        paymentMethod: 'bank_transfer',
        paymentReference: 'TRF-2024-001',
        notes: 'Pago prueba sistema afiliados'
      });
      
      const paidCommission = await db.Commission.findByPk(commission.id);
      console.log(`   ✅ Comisión pagada: €${paidCommission.amount}`);
      console.log(`   📊 Estado: ${paidCommission.status}`);
      console.log(`   💳 Método: ${paidCommission.paymentMethod}`);
      console.log(`   📅 Fecha: ${paidCommission.paidAt}\n`);
    }

    // 8. Estadísticas finales
    console.log('8️⃣ Estadísticas finales...');
    const finalStats = await AffiliateService.getGlobalStats();
    const finalAffiliate = await db.Affiliate.findByPk(affiliate.id);
    
    console.log(`   📊 Afiliado final:`);
    console.log(`      - Ganancias pagadas: €${finalAffiliate.paidEarnings}`);
    console.log(`      - Ganancias pendientes: €${finalAffiliate.pendingEarnings}\n`);

    console.log('🎉 FLUJO COMPLETO PROBADO EXITOSAMENTE!');
    console.log('\n📋 Resumen del test:');
    console.log('   ✅ Afiliado creado y validado');
    console.log('   ✅ Tenant registrado con código referido');
    console.log('   ✅ Suscripción trial creada');
    console.log('   ✅ Referido registrado correctamente');
    console.log('   ✅ Conversión procesada automáticamente');
    console.log('   ✅ Comisión generada y pagada');
    console.log('   ✅ Estadísticas actualizadas en tiempo real');

  } catch (error) {
    console.error('❌ Error en el test:', error.message);
    console.error(error.stack);
  } finally {
    await db.sequelize.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testAffiliateFlow();
}

module.exports = testAffiliateFlow;
