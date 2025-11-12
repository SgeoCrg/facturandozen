module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
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
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'subscription_id'
    },
    stripePaymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'stripe_payment_intent_id'
    },
    stripeSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'stripe_subscription_id'
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'stripe_customer_id'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'eur'
    },
    status: {
      type: DataTypes.ENUM('pending', 'succeeded', 'failed', 'cancelled'),
      defaultValue: 'pending'
    },
    plan: {
      type: DataTypes.ENUM('basic', 'pro'),
      allowNull: false
    },
    periodStart: {
      type: DataTypes.DATE,
      field: 'period_start'
    },
    periodEnd: {
      type: DataTypes.DATE,
      field: 'period_end'
    },
    failureReason: {
      type: DataTypes.TEXT,
      field: 'failure_reason'
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'retry_count'
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    underscored: true
  });

  Payment.associate = function(models) {
    Payment.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
    Payment.belongsTo(models.Subscription, {
      foreignKey: 'subscriptionId',
      as: 'subscription'
    });
  };

  return Payment;
};
