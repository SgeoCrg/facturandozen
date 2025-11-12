module.exports = (sequelize, DataTypes) => {
  const Commission = sequelize.define('Commission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    affiliateId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'affiliate_id'
    },
    referralId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'referral_id'
    },
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'subscription_id'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      field: 'commission_rate'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'paid', 'cancelled'),
      defaultValue: 'pending'
    },
    paymentMethod: {
      type: DataTypes.ENUM('bank_transfer', 'paypal', 'stripe'),
      allowNull: true,
      field: 'payment_method'
    },
    paymentReference: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'payment_reference'
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'paid_at'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'commissions',
    timestamps: true,
    underscored: true
  });

  Commission.associate = (models) => {
    Commission.belongsTo(models.Affiliate, {
      foreignKey: 'affiliateId',
      as: 'affiliate'
    });
    
    Commission.belongsTo(models.Referral, {
      foreignKey: 'referralId',
      as: 'referral'
    });
    
    Commission.belongsTo(models.Subscription, {
      foreignKey: 'subscriptionId',
      as: 'subscription'
    });
  };

  return Commission;
};
