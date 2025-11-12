'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('affiliates', 'tenant_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'tenants',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Crear índice para mejorar performance
    await queryInterface.addIndex('affiliates', ['tenant_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('affiliates', ['tenant_id']);
    await queryInterface.removeColumn('affiliates', 'tenant_id');
  }
};
