'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Tabla de consentimientos
    await queryInterface.createTable('consents', {
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
        }
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id'
        }
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      consent_type: {
        type: Sequelize.ENUM('marketing', 'newsletter', 'data_processing', 'third_party'),
        allowNull: false
      },
      granted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      granted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      source: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      version: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: '1.0'
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

    // Tabla de logs de actividad
    await queryInterface.createTable('activity_logs', {
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
        }
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      entity_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      risk_level: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'low'
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

    // Tabla de solicitudes de derechos
    await queryInterface.createTable('data_requests', {
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
        }
      },
      request_type: {
        type: Sequelize.ENUM('access', 'rectification', 'erasure', 'portability', 'restriction', 'objection'),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      nif: {
        type: Sequelize.STRING(9),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'rejected'),
        defaultValue: 'pending'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      verification_token: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      response_data: {
        type: Sequelize.JSON,
        allowNull: true
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      assigned_to: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
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

    // Tabla de políticas de privacidad
    await queryInterface.createTable('privacy_policies', {
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
        }
      },
      version: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      effective_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      language: {
        type: Sequelize.STRING(5),
        defaultValue: 'es'
      },
      data_controller: {
        type: Sequelize.JSON,
        allowNull: true
      },
      purposes: {
        type: Sequelize.JSON,
        allowNull: true
      },
      legal_basis: {
        type: Sequelize.JSON,
        allowNull: true
      },
      retention_period: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      third_parties: {
        type: Sequelize.JSON,
        allowNull: true
      },
      rights: {
        type: Sequelize.JSON,
        allowNull: true
      },
      dpo_contact: {
        type: Sequelize.JSON,
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

    // Índices para optimizar consultas
    await queryInterface.addIndex('consents', ['tenant_id', 'email', 'consent_type']);
    await queryInterface.addIndex('consents', ['email', 'consent_type']);
    
    await queryInterface.addIndex('activity_logs', ['tenant_id', 'created_at']);
    await queryInterface.addIndex('activity_logs', ['user_id', 'created_at']);
    await queryInterface.addIndex('activity_logs', ['action', 'created_at']);
    await queryInterface.addIndex('activity_logs', ['risk_level', 'created_at']);
    
    await queryInterface.addIndex('data_requests', ['tenant_id', 'status']);
    await queryInterface.addIndex('data_requests', ['email', 'request_type']);
    await queryInterface.addIndex('data_requests', ['verification_token']);
    await queryInterface.addIndex('data_requests', ['created_at']);
    
    await queryInterface.addIndex('privacy_policies', ['tenant_id', 'is_active']);
    await queryInterface.addIndex('privacy_policies', ['version']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('privacy_policies');
    await queryInterface.dropTable('data_requests');
    await queryInterface.dropTable('activity_logs');
    await queryInterface.dropTable('consents');
  }
};
