module.exports = (sequelize, DataTypes) => {
  const Referral = sequelize.define('Referral', {
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
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'tenant_id'
    },
    referralCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'referral_code'
    },
    status: {
      type: DataTypes.ENUM('pending', 'trial', 'converted', 'expired'),
      defaultValue: 'pending'
    },
    conversionDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'conversion_date'
    },
    commissionAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      field: 'commission_amount'
    },
    commissionPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'commission_paid'
    },
    commissionPaidDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'commission_paid_date'
    }
  }, {
    tableName: 'referrals',
    timestamps: true,
    underscored: true
  });

  Referral.associate = (models) => {
    Referral.belongsTo(models.Affiliate, {
      foreignKey: 'affiliateId',
      as: 'affiliate'
    });
    
    Referral.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
    
    Referral.hasMany(models.Commission, {
      foreignKey: 'referralId',
      as: 'commissions'
    });
  };

  return Referral;
};
