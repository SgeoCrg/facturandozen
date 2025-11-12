const db = require('../models');

exports.get = async (req, res) => {
  try {
    let settings = await db.Settings.findOne();
    
    if (!settings) {
      settings = await db.Settings.create({
        companyName: 'Mi Empresa',
        companyNif: '',
        companyAddress: ''
      });
    }

    res.json({ settings });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({ error: 'Error obteniendo configuración' });
  }
};

exports.update = async (req, res) => {
  try {
    const { companyName, companyNif, companyAddress, logoUrl } = req.body;

    let settings = await db.Settings.findOne();
    
    if (!settings) {
      settings = await db.Settings.create({});
    }

    if (companyName !== undefined) settings.companyName = companyName;
    if (companyNif !== undefined) settings.companyNif = companyNif;
    if (companyAddress !== undefined) settings.companyAddress = companyAddress;
    if (logoUrl !== undefined) settings.logoUrl = logoUrl;

    await settings.save();

    res.json({ settings });
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    res.status(500).json({ error: 'Error actualizando configuración' });
  }
};



