/**
 * Configuración Swagger/OpenAPI
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Facturando Zen API',
      version: '1.0.0',
      description: 'API REST para sistema de facturación SaaS multi-tenant',
      contact: {
        name: 'Facturando Zen',
        email: 'info@facturandozen.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://facturandozen.com'
      }
    },
    servers: [
      {
        url: process.env.FRONTEND_URL || 'http://localhost:3001',
        description: 'Servidor de producción'
      },
      {
        url: 'http://localhost:3001',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/**/*.js',
    './src/routes/v1/**/*.js',
    './src/controllers/**/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs;




