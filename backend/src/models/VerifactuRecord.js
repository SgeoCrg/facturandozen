module.exports = (sequelize, DataTypes) => {
  const VerifactuRecord = sequelize.define('VerifactuRecord', {
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
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'invoice_id'
    },
    hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    previousHash: {
      type: DataTypes.STRING,
      field: 'previous_hash'
    },
    xmlUnsigned: {
      type: DataTypes.TEXT,
      field: 'xml_unsigned'
    },
    xmlSigned: {
      type: DataTypes.TEXT,
      field: 'xml_signed'
    },
    aeatResponse: {
      type: DataTypes.JSONB,
      field: 'aeat_response'
    },
    aeatCsv: {
      type: DataTypes.STRING,
      field: 'aeat_csv'
    },
    sentAt: {
      type: DataTypes.DATE,
      field: 'sent_at'
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'accepted', 'rejected', 'error'),
      defaultValue: 'pending'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      field: 'error_message'
    },
    qrCode: {
      type: DataTypes.TEXT,
      field: 'qr_code'
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'retry_count'
    }
  }, {
    tableName: 'verifactu_records',
    timestamps: true,
    underscored: true
  });

  VerifactuRecord.associate = function(models) {
    VerifactuRecord.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
    VerifactuRecord.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId',
      as: 'invoice'
    });
  };

  return VerifactuRecord;
};



