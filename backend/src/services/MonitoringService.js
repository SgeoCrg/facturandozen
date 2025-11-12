/**
 * Servicio de monitoreo con Sentry + alertas
 */

const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const logger = require('../utils/logger');
const db = require('../models');
const AlertService = require('./AlertService');

class MonitoringService {
  constructor() {
    this.isEnabled = process.env.SENTRY_ENABLED === 'true';
    this.sentryDSN = process.env.SENTRY_DSN;

    if (this.isEnabled && this.sentryDSN && !this.sentryDSN.includes('CHANGE_THIS')) {
      this.initSentry();
    } else {
      logger.warn('Sentry deshabilitado o DSN no configurado');
    }
  }

  initSentry() {
    try {
      Sentry.init({
        dsn: this.sentryDSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0,
        profilesSampleRate: 1.0,
        integrations: [
          new ProfilingIntegration()
        ],
        beforeSend(event, hint) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Sentry event:', event);
          }
          return event;
        }
      });

      logger.info('Sentry initialized successfully');
    } catch (error) {
      logger.error('Error initializing Sentry', { error: error.message });
    }
  }

  captureException(error, context = {}) {
    if (this.isEnabled) {
      Sentry.captureException(error, context);
    }
    logger.error('Exception captured', { error: error.message, context });
  }

  requestHandler() {
    if (this.isEnabled && Sentry.Handlers) {
      return Sentry.Handlers.requestHandler();
    }
    return (req, res, next) => next();
  }

  errorHandler() {
    if (this.isEnabled && Sentry.Handlers) {
      return Sentry.Handlers.errorHandler();
    }
    return (err, req, res, next) => next(err);
  }

  async getHealthMetrics() {
    try {
      const dbHealthy = await this.checkDatabase();
      const memory = process.memoryUsage();
      
      const status = dbHealthy ? 'healthy' : 'unhealthy';

      // Alerta si DB está caída
      if (!dbHealthy) {
        await AlertService.sendDatabaseAlert('Base de datos no responde', {
          timestamp: new Date().toISOString()
        });
      }

      return {
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          message: dbHealthy ? 'Connected' : 'Connection failed'
        },
        memory: {
          rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`
        }
      };
    } catch (error) {
      this.captureException(error, { tags: { endpoint: 'health' } });
      await AlertService.sendCriticalAlert('HEALTH_CHECK_FAILED', error.message);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async checkDatabase() {
    try {
      await db.sequelize.authenticate();
      return true;
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return false;
    }
  }
}

module.exports = new MonitoringService();
