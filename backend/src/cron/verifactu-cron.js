const cron = require('node-cron');
const VerifactuRetryService = require('../services/VerifactuRetryService');
const logger = require('../utils/logger');

/**
 * Cron Jobs para VERI*FACTU
 * Cumple requisitos AEAT de procesamiento automático
 */

// Procesar facturas pendientes cada 5 minutos
cron.schedule('*/5 * * * *', async () => {
  try {
    logger.info('🔄 Ejecutando cron: Procesar facturas pendientes Verifactu');
    await VerifactuRetryService.processPendingInvoices();
  } catch (error) {
    logger.error('❌ Error en cron facturas pendientes', { error: error.message });
  }
}, {
  scheduled: true,
  timezone: "Europe/Madrid"
});

// Procesar facturas nuevas cada 10 minutos
cron.schedule('*/10 * * * *', async () => {
  try {
    logger.info('🔄 Ejecutando cron: Procesar facturas nuevas Verifactu');
    await VerifactuRetryService.processNewInvoices();
  } catch (error) {
    logger.error('❌ Error en cron facturas nuevas', { error: error.message });
  }
}, {
  scheduled: true,
  timezone: "Europe/Madrid"
});

// Limpiar logs antiguos cada día a las 2:00 AM
cron.schedule('0 2 * * *', async () => {
  try {
    logger.info('🧹 Ejecutando limpieza logs Verifactu');
    // Aquí se podría implementar limpieza de logs antiguos
  } catch (error) {
    logger.error('❌ Error en limpieza logs', { error: error.message });
  }
}, {
  scheduled: true,
  timezone: "Europe/Madrid"
});

logger.info('✅ Cron jobs Verifactu iniciados');

module.exports = {
  VerifactuRetryService
};
