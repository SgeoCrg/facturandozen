#!/usr/bin/env node

/**
 * Script para crear usuarios BETA con trial extendido
 * 
 * Uso:
 *   node scripts/create-beta-user.js "Empresa SL" "B12345678" "email@empresa.com" "password123" 60
 * 
 * Parámetros:
 *   1. Nombre empresa
 *   2. NIF
 *   3. Email
 *   4. Contraseña
 *   5. Días de trial (default: 60)
 */

const db = require('../src/models');
const bcrypt = require('bcryptjs');

const createBetaUser = async () => {
  try {
    const [companyName, nif, email, password, trialDays = '60'] = process.argv.slice(2);

    if (!companyName || !nif || !email || !password) {
      console.error(`
❌ Faltan parámetros

Uso:
  node scripts/create-beta-user.js "Empresa SL" "B12345678" "email@empresa.com" "password123" [60]

Ejemplo:
  node scripts/create-beta-user.js "Panadería López" "B11111111" "lopez@panaderia.com" "pan123" 60
      `);
      process.exit(1);
    }

    const days = parseInt(trialDays);
    if (isNaN(days) || days < 1) {
      console.error('❌ Días de trial debe ser un número positivo');
      process.exit(1);
    }

    await db.sequelize.authenticate();
    console.log('✅ Conectado a base de datos\n');

    // Verificar si ya existe
    const existingTenant = await db.Tenant.findOne({ where: { email } });
    if (existingTenant) {
      console.error(`❌ Ya existe un tenant con email: ${email}`);
      process.exit(1);
    }

    const existingNif = await db.Tenant.findOne({ where: { nif } });
    if (existingNif) {
      console.error(`❌ Ya existe un tenant con NIF: ${nif}`);
      process.exit(1);
    }

    // Crear tenant
    const tenant = await db.Tenant.create({
      name: companyName,
      nif: nif.toUpperCase(),
      email: email.toLowerCase(),
      address: '',
      status: 'trial'
    });

    console.log(`✅ Tenant creado: ${tenant.name} (ID: ${tenant.id})`);

    // Crear subscription con trial extendido
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + days);

    const subscription = await db.Subscription.create({
      tenantId: tenant.id,
      plan: 'basic',
      status: 'trial',
      trialEndsAt,
      maxInvoices: 50
    });

    console.log(`✅ Suscripción creada: basic Trial (${days} días)`);
    console.log(`   Expira: ${trialEndsAt.toLocaleDateString('es-ES')}`);

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.User.create({
      tenantId: tenant.id,
      name: 'Admin',
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin'
    });

    console.log(`✅ Usuario admin creado: ${user.email}\n`);

    // Crear settings por defecto
    await db.Settings.create({
      tenantId: tenant.id,
      companyName: companyName,
      nif: nif.toUpperCase(),
      address: '',
      phone: '',
      email: email.toLowerCase(),
      website: '',
      logo: null,
      invoicePrefix: 'F',
      nextInvoiceNumber: 1,
      defaultIva: 21,
      verifactuEnabled: false
    });

    console.log('✅ Settings creados\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 USUARIO BETA CREADO EXITOSAMENTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 CREDENCIALES PARA ENVIAR AL CLIENTE:\n');
    console.log('┌─────────────────────────────────────────────┐');
    console.log(`│ Empresa:    ${companyName.padEnd(29, ' ')} │`);
    console.log(`│ NIF:        ${nif.padEnd(29, ' ')} │`);
    console.log(`│ Email:      ${email.padEnd(29, ' ')} │`);
    console.log(`│ Contraseña: ${password.padEnd(29, ' ')} │`);
    console.log(`│ URL Login:  http://localhost:3000/login    │`);
    console.log(`│ Plan:       basic (Trial ${days} días)${' '.repeat(11 - String(days).length)}│`);
    console.log(`│ Expira:     ${trialEndsAt.toLocaleDateString('es-ES').padEnd(29, ' ')} │`);
    console.log('└─────────────────────────────────────────────┘\n');

    console.log('📧 TEMPLATE EMAIL:\n');
    console.log(`
Hola ${companyName.split(' ')[0]},

Bienvenido a la Beta Privada de [Nombre App] 🎉

Aquí están tus credenciales de acceso:

🔐 URL: http://localhost:3000/login
📧 Email: ${email}
🔑 Contraseña: ${password}

⏰ Tu prueba dura ${days} días (hasta ${trialEndsAt.toLocaleDateString('es-ES')})

📘 Empieza aquí:
1. Entra con tus credenciales
2. Ve a Configuración → Empresa para completar tus datos
3. Añade 2-3 clientes habituales (o escríbelos manual)
4. Crea tu primera factura (¡super rápido!)

💬 ¿Dudas? Responde este email o WhatsApp [TU_NÚMERO]

¡Gracias por ser beta tester!

Saludos,
[Tu Nombre]
    `);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando usuario beta:', error.message);
    process.exit(1);
  }
};

createBetaUser();
