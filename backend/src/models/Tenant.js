module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define('Tenant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nif: {
      type: DataTypes.STRING(9),
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT
    },
    subdomain: {
      type: DataTypes.STRING,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('trial', 'active', 'suspended', 'cancelled'),
      defaultValue: 'trial'
    },
    certificateEncrypted: {
      type: DataTypes.TEXT,
      field: 'certificate_encrypted'
    },
    certificatePassword: {
      type: DataTypes.TEXT,
      field: 'certificate_password'
    },
    certificateExpiresAt: {
      type: DataTypes.DATE,
      field: 'certificate_expires_at'
    }
  }, {
    tableName: 'tenants',
    timestamps: true,
    underscored: true
  });

  Tenant.associate = function(models) {
    Tenant.hasMany(models.User, {
      foreignKey: 'tenantId',
      as: 'users'
    });
    Tenant.hasOne(models.Subscription, {
      foreignKey: 'tenantId',
      as: 'subscription'
    });
  };

  return Tenant;
};
