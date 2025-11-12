module.exports = (sequelize, DataTypes) => {
  const PlatformInvoice = sequelize.define('PlatformInvoice', {
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
    paymentId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'payment_id'
    },
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'subscription_id'
    },
    number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    series: {
      type: DataTypes.STRING(10),
      defaultValue: 'PLAT'
    },
    fullNumber: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      field: 'full_number'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'customer_name'
    },
    customerNif: {
      type: DataTypes.STRING(9),
      allowNull: false,
      field: 'customer_nif'
    },
    customerAddress: {
      type: DataTypes.TEXT,
      field: 'customer_address'
    },
    customerEmail: {
      type: DataTypes.STRING,
      field: 'customer_email'
    },
    plan: {
      type: DataTypes.ENUM('basic', 'pro'),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: 'Suscripción mensual'
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 1.00
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'unit_price'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    ivaRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 21.00,
      field: 'iva_rate'
    },
    ivaAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'iva_amount'
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    periodStart: {
      type: DataTypes.DATEONLY,
      field: 'period_start'
    },
    periodEnd: {
      type: DataTypes.DATEONLY,
      field: 'period_end'
    },
    status: {
      type: DataTypes.ENUM('issued', 'paid', 'cancelled'),
      defaultValue: 'issued'
    },
    stripeInvoiceId: {
      type: DataTypes.STRING,
      field: 'stripe_invoice_id'
    },
    stripePaymentIntentId: {
      type: DataTypes.STRING,
      field: 'stripe_payment_intent_id'
    },
    notes: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'platform_invoices',
    timestamps: true,
    underscored: true
  });

  PlatformInvoice.associate = function(models) {
    PlatformInvoice.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
    PlatformInvoice.belongsTo(models.Payment, {
      foreignKey: 'paymentId',
      as: 'payment'
    });
    PlatformInvoice.belongsTo(models.Subscription, {
      foreignKey: 'subscriptionId',
      as: 'subscription'
    });
  };

  return PlatformInvoice;
};
