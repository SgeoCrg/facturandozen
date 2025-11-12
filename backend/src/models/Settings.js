module.exports = (sequelize, DataTypes) => {
  const Settings = sequelize.define('Settings', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyName: {
      type: DataTypes.STRING,
      field: 'company_name'
    },
    companyNif: {
      type: DataTypes.STRING(9),
      field: 'company_nif'
    },
    companyAddress: {
      type: DataTypes.TEXT,
      field: 'company_address'
    },
    logoUrl: {
      type: DataTypes.STRING,
      field: 'logo_url'
    }
  }, {
    tableName: 'settings',
    timestamps: true,
    underscored: true
  });

  return Settings;
};



