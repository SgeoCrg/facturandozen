#!/usr/bin/env node

/**
 * Tareas automáticas (CRON)
 * 
 * Ejecutar con:
 *   node scripts/cron-tasks.js
 * 
 * O con PM2:
 *   pm2 start scripts/cron-tasks.js --name cron-tasks
 */

require('dotenv').config();
const cron = require('node-cron');
const db = require('../src/models');
const EmailService = require('../src/services/EmailService');
const logger = require('../src/utils/logger');
const { Op } = require('sequelize');

// Conectar a DB
const initDatabase = async () => {
  try {
    await db.sequelize.authenticate();
    logger.info('✅ Cron tasks: DB connected');
    return true;
  } catch (error) {
    logger.error('❌ Cron tasks: DB connection failed', { error: error.message });
    return false;
  }
};

// Tarea 1: Revisar trials expirando
const checkTrialsExpiring = async () => {
  logger.info('🔔 Checking trials expiring...');
  
  const daysToCheck = [7, 3, 1]; // Avisar 7, 3 y 1 día antes
  let emailsSent = 0;
  
  try {
    for (const days of daysToCheck) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      
      // Rango: inicio y fin del día target
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      
      const subscriptions = await db.Subscription.findAll({
        where: {
          status: 'trial',
          trialEndsAt: {
            [Op.between]: [startOfDay, endOfDay]
          }
        },
        include: [{ 
          model: db.Tenant, 
          as: 'tenant',
          required: true
        }]
      });
      
      for (const sub of subscriptions) {
        // Verificar que no hayamos enviado email hoy
        const lastEmailKey = `trial_email_${sub.tenant.id}_${days}d`;
        const lastEmailDate = await db.sequelize.query(
          `SELECT value FROM cron_state WHERE key = :key`,
          {
            replacements: { key: lastEmailKey },
            type: db.sequelize.QueryTypes.SELECT
          }
        ).catch(() => []);
        
        const today = new Date().toISOString().split('T')[0];
        if (lastEmailDate[0]?.value === today) {
          logger.info(`Email ya enviado hoy: ${sub.tenant.name} (${days} días)`);
          continue;
        }
        
        // Enviar email
        await EmailService.sendTrialExpiring(sub.tenant, sub, days);
        
        // Guardar que enviamos email hoy
        await db.sequelize.query(
          `INSERT INTO cron_state (key, value) VALUES (:key, :value)
           ON CONFLICT (key) DO UPDATE SET value = :value, updated_at = NOW()`,
          {
            replacements: { key: lastEmailKey, value: today }
          }
        ).catch(() => {
          // Tabla no existe, ignorar (crear manual si se necesita tracking)
        });
        
        emailsSent++;
        logger.info(`📧 Email enviado: ${sub.tenant.name} (${days} días restantes)`);
      }
    }
    
    logger.info(`✅ Trials check completed: ${emailsSent} emails sent`);
  } catch (error) {
    logger.error('Error checking trials', { error: error.message });
  }
};

// Tarea 2: Suspender trials expirados
const suspendExpiredTrials = async () => {
  logger.info('🔒 Checking expired trials...');
  
  try {
    const now = new Date();
    
    const expiredSubscriptions = await db.Subscription.findAll({
      where: {
        status: 'trial',
        trialEndsAt: {
          [Op.lt]: now
        }
      },
      include: [{ 
        model: db.Tenant, 
        as: 'tenant',
        required: true
      }]
    });
    
    for (const sub of expiredSubscriptions) {
      // Suspender tenant
      await db.Tenant.update(
        { status: 'suspended' },
        { where: { id: sub.tenant.id } }
      );
      
      // Actualizar subscription
      await sub.update({ status: 'expired' });
      
      logger.info(`🔒 Trial expired and suspended: ${sub.tenant.name}`);
    }
    
    logger.info(`✅ Expired trials check completed: ${expiredSubscriptions.length} suspended`);
  } catch (error) {
    logger.error('Error suspending expired trials', { error: error.message });
  }
};

// Tarea 3: Limpiar logs antiguos
const cleanOldLogs = async () => {
  logger.info('🧹 Cleaning old logs...');
  
  try {
    const fs = require('fs');
    const path = require('path');
    const logsDir = path.join(__dirname, '../logs');
    
    if (!fs.existsSync(logsDir)) {
      logger.info('No logs directory found');
      return;
    }
    
    const files = fs.readdirSync(logsDir);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    let deleted = 0;
    
    for (const file of files) {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtimeMs < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        deleted++;
        logger.info(`Deleted old log: ${file}`);
      }
    }
    
    logger.info(`✅ Old logs cleaned: ${deleted} files deleted`);
  } catch (error) {
    logger.error('Error cleaning logs', { error: error.message });
  }
};

// Tarea 4: Reportar estadísticas diarias
const dailyStats = async () => {
  logger.info('📊 Generating daily stats...');
  
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [newTenants, newInvoices, totalTenants, totalInvoices] = await Promise.all([
      db.Tenant.count({
        where: {
          createdAt: {
            [Op.between]: [yesterday, today]
          }
        }
      }),
      db.Invoice.count({
        where: {
          createdAt: {
            [Op.between]: [yesterday, today]
          }
        }
      }),
      db.Tenant.count(),
      db.Invoice.count()
    ]);
    
    const stats = {
      date: yesterday.toISOString().split('T')[0],
      newTenants,
      newInvoices,
      totalTenants,
      totalInvoices
    };
    
    logger.info('📊 Daily stats', stats);
    
    // Opcional: Enviar email con stats al superadmin
    // await EmailService.send('admin@tuapp.com', 'Daily Stats', ...);
    
  } catch (error) {
    logger.error('Error generating daily stats', { error: error.message });
  }
};

// Programar tareas
const scheduleTasks = async () => {
  const dbConnected = await initDatabase();
  
  if (!dbConnected) {
    logger.error('Cannot start cron tasks without DB connection');
    process.exit(1);
  }
  
  logger.info('🚀 Starting cron tasks...');
  
  // Cada día a las 9:00 AM - Revisar trials expirando
  cron.schedule('0 9 * * *', checkTrialsExpiring, {
    timezone: 'Europe/Madrid'
  });
  logger.info('✅ Scheduled: checkTrialsExpiring (9:00 AM daily)');
  
  // Cada día a las 2:00 AM - Suspender trials expirados
  cron.schedule('0 2 * * *', suspendExpiredTrials, {
    timezone: 'Europe/Madrid'
  });
  logger.info('✅ Scheduled: suspendExpiredTrials (2:00 AM daily)');
  
  // Cada semana domingo 3:00 AM - Limpiar logs antiguos
  cron.schedule('0 3 * * 0', cleanOldLogs, {
    timezone: 'Europe/Madrid'
  });
  logger.info('✅ Scheduled: cleanOldLogs (3:00 AM Sunday)');
  
  // Cada día a las 8:00 AM - Stats diarias
  cron.schedule('0 8 * * *', dailyStats, {
    timezone: 'Europe/Madrid'
  });
  logger.info('✅ Scheduled: dailyStats (8:00 AM daily)');
  
  logger.info('✅ All cron tasks scheduled and running');
  
  // Ejecutar checks iniciales (opcional)
  if (process.env.RUN_ON_START === 'true') {
    setTimeout(async () => {
      logger.info('Running initial checks...');
      await checkTrialsExpiring();
      await suspendExpiredTrials();
    }, 5000);
  }
};

// Manejo de señales
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing cron tasks...');
  await db.sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing cron tasks...');
  await db.sequelize.close();
  process.exit(0);
});

// Iniciar
scheduleTasks().catch((error) => {
  logger.error('Fatal error starting cron tasks', { error: error.message });
  process.exit(1);
});


