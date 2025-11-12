module.exports = (sequelize, DataTypes) => {
  const DataRequest = sequelize.define('DataRequest', {
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
    requestType: {
      type: DataTypes.ENUM('access', 'rectification', 'erasure', 'portability', 'restriction', 'objection'),
      allowNull: false,
      field: 'request_type'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    nif: {
      type: DataTypes.STRING(9),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'rejected'),
      defaultValue: 'pending'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    verificationToken: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'verification_token'
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    },
    responseData: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'response_data'
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason'
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
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'assigned_to'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'data_requests',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['tenant_id', 'status']
      },
      {
        fields: ['email', 'request_type']
      },
      {
        fields: ['verification_token']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  DataRequest.associate = function(models) {
    DataRequest.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
    DataRequest.belongsTo(models.User, {
      foreignKey: 'assignedTo',
      as: 'assignedUser'
    });
  };

  return DataRequest;
};
