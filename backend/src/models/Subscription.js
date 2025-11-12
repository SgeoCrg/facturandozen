module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'tenant_id'
    },
    plan: {
      type: DataTypes.ENUM('starter', 'basic', 'pro'),
      defaultValue: 'starter'
    },
    priceMonthly: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'price_monthly'
    },
    status: {
      type: DataTypes.ENUM('active', 'cancelled', 'expired'),
      defaultValue: 'active'
    },
    trialEndsAt: {
      type: DataTypes.DATE,
      field: 'trial_ends_at'
    },
    currentPeriodStart: {
      type: DataTypes.DATE,
      field: 'current_period_start'
    },
    currentPeriodEnd: {
      type: DataTypes.DATE,
      field: 'current_period_end'
    },
    maxInvoices: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      field: 'max_invoices'
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'stripe_customer_id'
    },
    stripeSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'stripe_subscription_id'
    },
    stripePriceId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'stripe_price_id'
    },
    cancelAtPeriodEnd: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'cancel_at_period_end'
    },
    canceledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'canceled_at'
    }
  }, {
    tableName: 'subscriptions',
    timestamps: true,
    underscored: true
  });

  Subscription.associate = function(models) {
    Subscription.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
    Subscription.hasMany(models.Payment, {
      foreignKey: 'subscriptionId',
      as: 'payments'
    });
  };

  return Subscription;
};
