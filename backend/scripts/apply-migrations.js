#!/usr/bin/env node

/**
 * Script para aplicar migraciones manualmente
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Configurar conexión a base de datos
const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'facturando_zen',
  username: process.env.DB_USER || 'facturando_zen_user',
  password: process.env.DB_PASSWORD || 'FacturandoZen2024!Secure',
  dialect: 'postgres',
  logging: false
});

const applyMigrations = async () => {
  try {
    console.log('🔄 Aplicando migraciones...\n');

    await sequelize.authenticate();
    console.log('✅ Conectado a base de datos\n');

    // Aplicar migración de campos de seguridad de usuarios
    console.log('📝 Aplicando migración: campos de seguridad de usuarios...');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // Verificar si las columnas ya existen
    const tableDescription = await queryInterface.describeTable('users');
    
    if (!tableDescription.is_temporary_password) {
      await queryInterface.addColumn('users', 'is_temporary_password', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      });
      console.log('✅ Campo is_temporary_password añadido');
    } else {
      console.log('⚠️ Campo is_temporary_password ya existe');
    }

    if (!tableDescription.last_login_at) {
      await queryInterface.addColumn('users', 'last_login_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('✅ Campo last_login_at añadido');
    } else {
      console.log('⚠️ Campo last_login_at ya existe');
    }

    if (!tableDescription.login_attempts) {
      await queryInterface.addColumn('users', 'login_attempts', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
      console.log('✅ Campo login_attempts añadido');
    } else {
      console.log('⚠️ Campo login_attempts ya existe');
    }

    if (!tableDescription.locked_until) {
      await queryInterface.addColumn('users', 'locked_until', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('✅ Campo locked_until añadido');
    } else {
      console.log('⚠️ Campo locked_until ya existe');
    }

    // Crear tabla activity_logs si no existe
    console.log('\n📝 Creando tabla activity_logs...');
    
    try {
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
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        action: {
          type: Sequelize.STRING,
          allowNull: false
        },
        details: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        ip_address: {
          type: Sequelize.STRING,
          allowNull: true
        },
        user_agent: {
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

      // Crear índices
      await queryInterface.addIndex('activity_logs', ['tenant_id']);
      await queryInterface.addIndex('activity_logs', ['user_id']);
      await queryInterface.addIndex('activity_logs', ['action']);
      await queryInterface.addIndex('activity_logs', ['created_at']);
      
      console.log('✅ Tabla activity_logs creada con índices');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ Tabla activity_logs ya existe');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 Migraciones aplicadas correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error aplicando migraciones:', error.message);
    process.exit(1);
  }
};

applyMigrations();
