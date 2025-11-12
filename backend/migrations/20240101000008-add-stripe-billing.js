'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Crear tabla payments
    await queryInterface.createTable('payments', {
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
      stripe_payment_intent_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      stripe_subscription_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      stripe_customer_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'eur'
      },
      status: {
        type: Sequelize.ENUM('pending', 'succeeded', 'failed', 'cancelled'),
        defaultValue: 'pending'
      },
      plan: {
        type: Sequelize.ENUM('basic', 'pro'),
        allowNull: false
      },
      period_start: {
        type: Sequelize.DATE,
        allowNull: true
      },
      period_end: {
        type: Sequelize.DATE,
        allowNull: true
      },
      failure_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      retry_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Añadir índices para payments
    await queryInterface.addIndex('payments', ['tenant_id']);
    await queryInterface.addIndex('payments', ['subscription_id']);
    await queryInterface.addIndex('payments', ['stripe_payment_intent_id']);
    await queryInterface.addIndex('payments', ['stripe_subscription_id']);
    await queryInterface.addIndex('payments', ['status']);
    await queryInterface.addIndex('payments', ['created_at']);

    // Añadir campos Stripe a subscriptions
    await queryInterface.addColumn('subscriptions', 'stripe_customer_id', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('subscriptions', 'stripe_subscription_id', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('subscriptions', 'stripe_price_id', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('subscriptions', 'cancel_at_period_end', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('subscriptions', 'canceled_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Añadir índices para subscriptions
    await queryInterface.addIndex('subscriptions', ['stripe_customer_id']);
    await queryInterface.addIndex('subscriptions', ['stripe_subscription_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Eliminar tabla payments
    await queryInterface.dropTable('payments');

    // Eliminar campos Stripe de subscriptions
    await queryInterface.removeColumn('subscriptions', 'stripe_customer_id');
    await queryInterface.removeColumn('subscriptions', 'stripe_subscription_id');
    await queryInterface.removeColumn('subscriptions', 'stripe_price_id');
    await queryInterface.removeColumn('subscriptions', 'cancel_at_period_end');
    await queryInterface.removeColumn('subscriptions', 'canceled_at');
  }
};
