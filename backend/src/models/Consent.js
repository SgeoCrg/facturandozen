module.exports = (sequelize, DataTypes) => {
  const Consent = sequelize.define('Consent', {
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
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id'
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'customer_id'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    consentType: {
      type: DataTypes.ENUM('marketing', 'newsletter', 'data_processing', 'third_party'),
      allowNull: false,
      field: 'consent_type'
    },
    granted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    grantedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'granted_at'
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'revoked_at'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },
    source: {
      type: DataTypes.STRING(100),
      allowNull: true // 'registration', 'settings', 'api', etc.
    },
    version: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: '1.0'
    }
  }, {
    tableName: 'consents',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['tenant_id', 'email', 'consent_type']
      },
      {
        fields: ['email', 'consent_type']
      }
    ]
  });

  return Consent;
};
