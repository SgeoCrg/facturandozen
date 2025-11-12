const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Añadir campos certificado a tenants
    await queryInterface.addColumn('tenants', 'certificate_encrypted', {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('tenants', 'certificate_password', {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('tenants', 'certificate_expires_at', {
      type: DataTypes.DATE,
      allowNull: true
    });

    // Crear tabla verifactu_records
    await queryInterface.createTable('verifactu_records', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      invoice_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'invoices',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      hash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      previous_hash: {
        type: DataTypes.STRING,
        allowNull: true
      },
      xml_unsigned: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      xml_signed: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      aeat_response: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      aeat_csv: {
        type: DataTypes.STRING,
        allowNull: true
      },
      sent_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('pending', 'sent', 'accepted', 'rejected', 'error'),
        defaultValue: 'pending'
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      qr_code: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices
    await queryInterface.addIndex('verifactu_records', ['tenant_id']);
    await queryInterface.addIndex('verifactu_records', ['invoice_id']);
    await queryInterface.addIndex('verifactu_records', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('verifactu_records');
    await queryInterface.removeColumn('tenants', 'certificate_encrypted');
    await queryInterface.removeColumn('tenants', 'certificate_password');
    await queryInterface.removeColumn('tenants', 'certificate_expires_at');
  }
};



