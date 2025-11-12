'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Tabla de afiliados
    await queryInterface.createTable('affiliates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      commission_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 20.00, // 20% por defecto
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
      },
      total_earnings: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      paid_earnings: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      pending_earnings: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      referral_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      conversion_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Tabla de referidos
    await queryInterface.createTable('referrals', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      affiliate_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'affiliates',
          key: 'id'
        }
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        }
      },
      referral_code: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'trial', 'converted', 'expired'),
        defaultValue: 'pending'
      },
      conversion_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      commission_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      commission_paid: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      commission_paid_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Tabla de comisiones
    await queryInterface.createTable('commissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      affiliate_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'affiliates',
          key: 'id'
        }
      },
      referral_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'referrals',
          key: 'id'
        }
      },
      subscription_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'subscriptions',
          key: 'id'
        }
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      commission_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'paid', 'cancelled'),
        defaultValue: 'pending'
      },
      payment_method: {
        type: Sequelize.ENUM('bank_transfer', 'paypal', 'stripe'),
        allowNull: true
      },
      payment_reference: {
        type: Sequelize.STRING,
        allowNull: true
      },
      paid_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Índices para optimización
    await queryInterface.addIndex('affiliates', ['code']);
    await queryInterface.addIndex('affiliates', ['email']);
    await queryInterface.addIndex('affiliates', ['status']);
    
    await queryInterface.addIndex('referrals', ['affiliate_id']);
    await queryInterface.addIndex('referrals', ['tenant_id']);
    await queryInterface.addIndex('referrals', ['referral_code']);
    await queryInterface.addIndex('referrals', ['status']);
    
    await queryInterface.addIndex('commissions', ['affiliate_id']);
    await queryInterface.addIndex('commissions', ['status']);
    await queryInterface.addIndex('commissions', ['paid_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('commissions');
    await queryInterface.dropTable('referrals');
    await queryInterface.dropTable('affiliates');
  }
};
