#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 INICIANDO CREACIÓN COMPLETA DE DATOS DE PRUEBA\n');

const scripts = [
  {
    name: 'Datos Completos del Sistema',
    file: 'create-complete-test-data.js',
    description: 'Superadmin, tenants, usuarios, clientes, productos, facturas, pagos, afiliados, comisiones, logs y datos LOPD'
  },
  {
    name: 'Datos de Verifactu',
    file: 'create-verifactu-test-data.js',
    description: 'Certificados, envíos y respuestas de Verifactu'
  },
  {
    name: 'Datos de Stripe',
    file: 'create-stripe-test-data.js',
    description: 'Clientes, suscripciones y webhooks de Stripe'
  }
];

async function runScript(script) {
  try {
    console.log(`\n📋 Ejecutando: ${script.name}`);
    console.log(`   Descripción: ${script.description}`);
    console.log(`   Archivo: ${script.file}\n`);
    
    const scriptPath = path.join(__dirname, script.file);
    execSync(`node "${scriptPath}"`, { 
      stdio: 'inherit',
      cwd: path.dirname(scriptPath)
    });
    
    console.log(`\n✅ ${script.name} completado exitosamente\n`);
    
  } catch (error) {
    console.error(`\n❌ Error ejecutando ${script.name}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    for (const script of scripts) {
      await runScript(script);
    }
    
    console.log('🎉 TODOS LOS DATOS DE PRUEBA CREADOS EXITOSAMENTE!\n');
    
    console.log('📊 RESUMEN FINAL:');
    console.log('   ✅ Sistema completo con datos realistas');
    console.log('   ✅ Integración Verifactu simulada');
    console.log('   ✅ Integración Stripe simulada');
    console.log('   ✅ Sistema multitenant funcional');
    console.log('   ✅ Datos de afiliados y comisiones');
    console.log('   ✅ Cumplimiento LOPD');
    
    console.log('\n🚀 SISTEMA LISTO PARA PRUEBAS COMPLETAS!');
    console.log('\n🔐 CREDENCIALES DE ACCESO:');
    console.log('   👑 Superadmin: super@admin.com / super123');
    console.log('   🏢 Tenants: admin@[empresa].com / admin123');
    
    console.log('\n🌐 Para iniciar:');
    console.log('   Backend: cd backend && npm run dev');
    console.log('   Frontend: cd frontend && npm start');
    console.log('   URL: http://localhost:3000');
    
  } catch (error) {
    console.error('\n❌ Error en la creación de datos:', error.message);
    process.exit(1);
  }
}

main();