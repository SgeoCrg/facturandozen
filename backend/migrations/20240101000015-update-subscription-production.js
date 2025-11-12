'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Actualizar enum de planes para incluir 'starter'
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_subscriptions_plan" ADD VALUE 'starter';
    `);

    // Actualizar enum de status para eliminar 'trial'
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_subscriptions_status" DROP VALUE 'trial';
    `);

    // Actualizar registros existentes
    await queryInterface.sequelize.query(`
      UPDATE subscriptions 
      SET plan = 'starter', 
          status = 'active',
          price_monthly = 9,
          max_invoices = 100
      WHERE plan = 'basic' AND status = 'trial';
    `);

    await queryInterface.sequelize.query(`
      UPDATE subscriptions 
      SET status = 'active'
      WHERE status = 'trial';
    `);

    // Actualizar tenants con status 'trial' a 'active'
    await queryInterface.sequelize.query(`
      UPDATE tenants 
      SET status = 'active'
      WHERE status = 'trial';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revertir cambios
    await queryInterface.sequelize.query(`
      UPDATE subscriptions 
      SET plan = 'basic', 
          status = 'trial',
          price_monthly = 19,
          max_invoices = 50
      WHERE plan = 'starter';
    `);

    await queryInterface.sequelize.query(`
      UPDATE tenants 
      SET status = 'trial'
      WHERE status = 'active';
    `);
  }
};
