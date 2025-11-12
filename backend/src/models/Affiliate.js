module.exports = (sequelize, DataTypes) => {
  const Affiliate = sequelize.define('Affiliate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 20.00,
      field: 'commission_rate'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    totalEarnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      field: 'total_earnings'
    },
    paidEarnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      field: 'paid_earnings'
    },
    pendingEarnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      field: 'pending_earnings'
    },
    referralCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'referral_count'
    },
    conversionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'conversion_count'
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'tenant_id',
      references: {
        model: 'tenants',
        key: 'id'
      }
    }
  }, {
    tableName: 'affiliates',
    timestamps: true,
    underscored: true
  });

  Affiliate.associate = (models) => {
    Affiliate.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
    
    Affiliate.hasMany(models.Referral, {
      foreignKey: 'affiliateId',
      as: 'referrals'
    });
    
    Affiliate.hasMany(models.Commission, {
      foreignKey: 'affiliateId',
      as: 'commissions'
    });
  };

  return Affiliate;
};
