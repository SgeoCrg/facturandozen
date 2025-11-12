module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define('Invoice', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'tenant_id'
    },
    number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    series: {
      type: DataTypes.STRING(10),
      defaultValue: 'A'
    },
    fullNumber: {
      type: DataTypes.STRING(50),
      unique: true,
      field: 'full_number'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    customerId: {
      type: DataTypes.UUID,
      field: 'customer_id'
    },
    customerName: {
      type: DataTypes.STRING,
      field: 'customer_name'
    },
    customerNif: {
      type: DataTypes.STRING(9),
      field: 'customer_nif'
    },
    customerAddress: {
      type: DataTypes.TEXT,
      field: 'customer_address'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    totalIva: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_iva'
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'issued', 'paid', 'cancelled'),
      defaultValue: 'issued'
    },
    notes: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'invoices',
    timestamps: true,
    underscored: true
  });

  Invoice.associate = function(models) {
    Invoice.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
    Invoice.belongsTo(models.Customer, {
      foreignKey: 'customerId',
      as: 'customer'
    });
    Invoice.hasMany(models.InvoiceLine, {
      foreignKey: 'invoiceId',
      as: 'lines'
    });
    Invoice.hasOne(models.VerifactuRecord, {
      foreignKey: 'invoiceId',
      as: 'verifactuRecord'
    });
  };

  return Invoice;
};

