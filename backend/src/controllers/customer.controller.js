const db = require('../models');
const DataStandardizationService = require('../services/DataStandardizationService');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const { Op } = require('sequelize');

exports.list = async (req, res) => {
  try {
    const { search } = req.query;
    const cacheKey = cache.getCustomersKey(req.user.tenantId) + (search || '');
    
    // Caché
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ customers: cached });
    }

    const where = { tenantId: req.user.tenantId };

    // Búsqueda por nombre, NIF o email
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { nif: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const customers = await db.Customer.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    cache.set(cacheKey, customers, 180); // 3 min
    res.json({ customers });
  } catch (error) {
    logger.error('Error listando clientes', { error: error.message });
    res.status(500).json({ error: 'Error obteniendo clientes' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, nif, email, phone, address, city, postalCode } = req.body;

    if (!name || !nif) {
      return res.status(400).json({ error: 'Nombre y NIF requeridos' });
    }

    const normalizedNif = DataStandardizationService.normalizeNIF(nif);
    if (!DataStandardizationService.validateNIF(normalizedNif)) {
      return res.status(400).json({ error: 'NIF/CIF inválido' });
    }

    const customer = await db.Customer.create({
      tenantId: req.user.tenantId,
      name,
      nif: normalizedNif,
      email,
      phone,
      address,
      city,
      postalCode
    });

    // Invalidar caché
    cache.del(cache.getCustomersKey(req.user.tenantId));

    logger.info('Cliente creado', { customerId: customer.id, tenantId: req.user.tenantId });
    res.status(201).json({ customer });
  } catch (error) {
    logger.error('Error creando cliente', { error: error.message });
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Cliente con ese NIF ya existe' });
    }
    res.status(400).json({ error: error.message || 'Error creando cliente' });
  }
};

exports.get = async (req, res) => {
  try {
    const customer = await db.Customer.findOne({
      where: { 
        id: req.params.id,
        tenantId: req.user.tenantId
      }
    });
    if (!customer) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json({ customer });
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({ error: 'Error obteniendo cliente' });
  }
};

exports.update = async (req, res) => {
  try {
    const customer = await db.Customer.findOne({
      where: { 
        id: req.params.id,
        tenantId: req.user.tenantId
      }
    });
    if (!customer) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const { name, nif, email, phone, address, city, postalCode } = req.body;

    if (nif && nif !== customer.nif) {
      const normalizedNif = DataStandardizationService.normalizeNIF(nif);
      if (!DataStandardizationService.validateNIF(normalizedNif)) {
        return res.status(400).json({ error: 'NIF/CIF inválido' });
      }
      customer.nif = normalizedNif;
    }

    if (name) customer.name = name;
    if (email !== undefined) customer.email = email;
    if (phone !== undefined) customer.phone = phone;
    if (address !== undefined) customer.address = address;
    if (city !== undefined) customer.city = city;
    if (postalCode !== undefined) customer.postalCode = postalCode;

    await customer.save();

    res.json({ customer });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(400).json({ error: error.message || 'Error actualizando cliente' });
  }
};

exports.delete = async (req, res) => {
  try {
    const customer = await db.Customer.findOne({
      where: { 
        id: req.params.id,
        tenantId: req.user.tenantId
      }
    });
    if (!customer) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    await customer.destroy();
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: 'No se puede eliminar cliente con facturas' });
    }
    res.status(500).json({ error: 'Error eliminando cliente' });
  }
};

