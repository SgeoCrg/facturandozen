#!/usr/bin/env node

require('dotenv').config({ path: require('path').join(__dirname, '..', 'env.facturando-zen.production') });

const db = require('./src/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function verify() {
  console.log('🔐 VERIFICANDO CONFIGURACIÓN DE LOGIN\n');
  
  // 1. Verificar JWT_SECRET
  const hasJwt = process.env.JWT_SECRET && !process.env.JWT_SECRET.includes('CHANGE_THIS');
  console.log(`${hasJwt ? '✅' : '❌'} JWT_SECRET: ${hasJwt ? 'Configurado' : 'NO configurado'}`);
  
  if (!hasJwt) {
    console.log('   ⚠️  Configura JWT_SECRET en env.facturando-zen.production\n');
    process.exit(1);
  }
  
  // 2. Verificar DB
  try {
    await db.sequelize.authenticate();
    console.log('✅ Base de datos: Conectada');
    
    const userCount = await db.User.count();
    console.log(`📊 Usuarios en DB: ${userCount}`);
    
    if (userCount === 0) {
      console.log('\n⚠️  NO HAY USUARIOS');
      console.log('   💡 Ejecuta: npm run seed\n');
      await db.sequelize.close();
      process.exit(1);
    }
    
    // 3. Probar login
    const user = await db.User.findOne({ 
      where: { email: 'super@admin.com' },
      attributes: ['id', 'email', 'password', 'role', 'tenantId', 'name']
    });
    
    if (user) {
      const isValid = await bcrypt.compare('super123', user.password);
      if (isValid) {
        const token = jwt.sign(
          { id: user.id, tenantId: user.tenantId, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        console.log('✅ Login: Funcional');
        console.log(`✅ JWT: Generado correctamente`);
        console.log('\n🎉 SISTEMA LISTO PARA LOGIN');
        console.log('\n📝 Credenciales:');
        console.log('   Email: super@admin.com');
        console.log('   Password: super123');
        console.log('\n📡 Endpoint: POST /api/auth/login\n');
      } else {
        console.log('⚠️  Password no coincide');
        console.log('   💡 Ejecuta: npm run seed para resetear\n');
      }
    } else {
      console.log('⚠️  Usuario super@admin.com no encontrado');
      console.log('   💡 Ejecuta: npm run seed\n');
    }
    
  } catch (error) {
    console.log(`❌ Base de datos: Error - ${error.message}`);
    if (error.message.includes('connect')) {
      console.log('   💡 Verifica variables DB_* en env.facturando-zen.production\n');
    }
  }
  
  await db.sequelize.close();
}

verify().catch(console.error);

