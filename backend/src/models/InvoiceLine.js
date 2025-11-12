module.exports = (sequelize, DataTypes) => {
  const InvoiceLine = sequelize.define('InvoiceLine', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'invoice_id'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    ivaRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      field: 'iva_rate'
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    tableName: 'invoice_lines',
    timestamps: true,
    underscored: true
  });

  InvoiceLine.associate = function(models) {
    InvoiceLine.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId',
      as: 'invoice'
    });
  };

  return InvoiceLine;
};

