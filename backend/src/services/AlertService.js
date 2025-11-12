/**
 * Servicio de alertas operacionales
 * Envía notificaciones críticas por email/Slack
 */

const logger = require('../utils/logger');
const EmailService = require('./EmailService');

class AlertService {
  static async sendCriticalAlert(type, message, details = {}) {
    try {
      const alertEmail = process.env.ALERT_EMAIL || process.env.SUPERADMIN_EMAIL;
      
      if (!alertEmail) {
        logger.warn('No hay email configurado para alertas críticas');
        return;
      }

      const subject = `🚨 ALERTA CRÍTICA - ${type}`;
      const body = `
        <h2>Alerta Crítica: ${type}</h2>
        <p><strong>Mensaje:</strong> ${message}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        ${details ? `<pre>${JSON.stringify(details, null, 2)}</pre>` : ''}
      `;

      if (process.env.EMAIL_ENABLED === 'true') {
        await EmailService.send({
          to: alertEmail,
          subject,
          html: body
        });
        logger.info(`Alerta crítica enviada: ${type}`);
      } else {
        logger.error(`ALERTA CRÍTICA (email deshabilitado): ${type} - ${message}`, details);
      }
    } catch (error) {
      logger.error('Error enviando alerta crítica', { error: error.message });
    }
  }

  static async sendUptimeAlert(status, details = {}) {
    if (status === 'down') {
      await this.sendCriticalAlert('SERVICIO CAÍDO', 'El servicio no responde', details);
    } else if (status === 'recovered') {
      await this.sendCriticalAlert('SERVICIO RECUPERADO', 'El servicio volvió a funcionar', details);
    }
  }

  static async sendErrorSpikeAlert(errorCount, timeWindow = '5min') {
    await this.sendCriticalAlert(
      'SPIKE DE ERRORES',
      `Se detectaron ${errorCount} errores en los últimos ${timeWindow}`,
      { errorCount, timeWindow }
    );
  }

  static async sendDatabaseAlert(message, details = {}) {
    await this.sendCriticalAlert('ERROR BASE DE DATOS', message, details);
  }

  static async sendDiskSpaceAlert(usage, threshold = 90) {
    await this.sendCriticalAlert(
      'ESPACIO EN DISCO BAJO',
      `Uso de disco: ${usage}% (umbral: ${threshold}%)`,
      { usage, threshold }
    );
  }
}

module.exports = AlertService;




