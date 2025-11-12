#!/usr/bin/env node

/**
 * Script para aplicar migraciones del sistema de afiliados
 * Ejecutar: node scripts/apply-affiliate-migrations.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Aplicando migraciones del sistema de afiliados...\n');

try {
  // Cambiar al directorio backend
  process.chdir(path.join(__dirname, '..'));

  // Aplicar migración
  console.log('📦 Aplicando migración: create-affiliate-system...');
  execSync('npx sequelize-cli db:migrate --name 20240101000013-create-affiliate-system.js', {
    stdio: 'inherit'
  });

  console.log('\n✅ Migraciones aplicadas correctamente');
  console.log('\n📋 Tablas creadas:');
  console.log('   - affiliates (afiliados)');
  console.log('   - referrals (referidos)');
  console.log('   - commissions (comisiones)');
  
  console.log('\n🔗 Endpoints disponibles:');
  console.log('   POST   /api/affiliates - Crear afiliado');
  console.log('   GET    /api/affiliates - Listar afiliados');
  console.log('   GET    /api/affiliates/stats - Estadísticas');
  console.log('   GET    /api/affiliates/pending-commissions - Comisiones pendientes');
  console.log('   GET    /api/public/affiliate/:code/validate - Validar código');
  console.log('   GET    /api/public/affiliate/:code/link - Generar enlace');

  console.log('\n🎯 Próximos pasos:');
  console.log('   1. Crear afiliados desde el panel superadmin');
  console.log('   2. Generar enlaces de afiliado');
  console.log('   3. Integrar en el registro de usuarios');
  console.log('   4. Configurar webhooks de Stripe para conversiones');

} catch (error) {
  console.error('❌ Error aplicando migraciones:', error.message);
  process.exit(1);
}
