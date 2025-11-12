module.exports = (sequelize, DataTypes) => {
  const PrivacyPolicy = sequelize.define('PrivacyPolicy', {
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
    version: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_active'
    },
    effectiveDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'effective_date'
    },
    language: {
      type: DataTypes.STRING(5),
      defaultValue: 'es'
    },
    dataController: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'data_controller' // Información del responsable
    },
    purposes: {
      type: DataTypes.JSON,
      allowNull: true // Propósitos del tratamiento
    },
    legalBasis: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'legal_basis' // Base legal
    },
    retentionPeriod: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'retention_period'
    },
    thirdParties: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'third_parties' // Terceros con acceso
    },
    rights: {
      type: DataTypes.JSON,
      allowNull: true // Derechos del interesado
    },
    dpoContact: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'dpo_contact' // Contacto DPO
    }
  }, {
    tableName: 'privacy_policies',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['tenant_id', 'is_active']
      },
      {
        fields: ['version']
      }
    ]
  });

  return PrivacyPolicy;
};
