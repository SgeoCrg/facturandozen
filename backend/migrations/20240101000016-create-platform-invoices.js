'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Crear tabla platform_invoices (facturas que la plataforma emite a sus clientes)
    await queryInterface.createTable('platform_invoices', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      payment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'payments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      subscription_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'subscriptions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      series: {
        type: Sequelize.STRING(10),
        defaultValue: 'PLAT',
        allowNull: false
      },
      full_number: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      // Datos del cliente (tenant)
      customer_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      customer_nif: {
        type: Sequelize.STRING(9),
        allowNull: false
      },
      customer_address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      customer_email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      // Datos de la factura
      plan: {
        type: Sequelize.ENUM('basic', 'pro'),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: 'Suscripción mensual'
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 1.00,
        allowNull: false
      },
      unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      iva_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 21.00,
        allowNull: false
      },
      iva_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      period_start: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      period_end: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('issued', 'paid', 'cancelled'),
        defaultValue: 'issued'
      },
      stripe_invoice_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      stripe_payment_intent_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices
    await queryInterface.addIndex('platform_invoices', ['tenant_id']);
    await queryInterface.addIndex('platform_invoices', ['payment_id']);
    await queryInterface.addIndex('platform_invoices', ['subscription_id']);
    await queryInterface.addIndex('platform_invoices', ['full_number']);
    await queryInterface.addIndex('platform_invoices', ['date']);
    await queryInterface.addIndex('platform_invoices', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('platform_invoices');
  }
};

