const db = require('../models');
const DataStandardizationService = require('../services/DataStandardizationService');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const { Op } = require('sequelize');

exports.list = async (req, res) => {
  try {
    const { search } = req.query;
    const cacheKey = cache.getProductsKey(req.user.tenantId) + (search || '');
    
    // Caché
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ products: cached });
    }

    const where = { 
      tenantId: req.user.tenantId,
      isActive: true
    };

    // Búsqueda por nombre, descripción o SKU
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const products = await db.Product.findAll({
      where,
      order: [['name', 'ASC']]
    });

    cache.set(cacheKey, products, 180); // 3 min
    res.json({ products });
  } catch (error) {
    logger.error('Error listando productos', { error: error.message });
    res.status(500).json({ error: 'Error obteniendo productos' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, sku, price, ivaRate } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Nombre y precio requeridos' });
    }

    const normalizedPrice = DataStandardizationService.normalizePrice(price);
    const normalizedIva = DataStandardizationService.validateIVARate(ivaRate || 21);

    const product = await db.Product.create({
      tenantId: req.user.tenantId,
      name,
      description,
      sku,
      price: normalizedPrice,
      ivaRate: normalizedIva
    });

    // Invalidar caché
    cache.del(cache.getProductsKey(req.user.tenantId));

    logger.info('Producto creado', { productId: product.id, tenantId: req.user.tenantId });
    res.status(201).json({ product });
  } catch (error) {
    logger.error('Error creando producto', { error: error.message });
    res.status(400).json({ error: error.message || 'Error creando producto' });
  }
};

exports.get = async (req, res) => {
  try {
    const product = await db.Product.findOne({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId
      }
    });
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ product });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({ error: 'Error obteniendo producto' });
  }
};

exports.update = async (req, res) => {
  try {
    const product = await db.Product.findOne({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId
      }
    });
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const { name, description, sku, price, ivaRate } = req.body;

    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (sku !== undefined) product.sku = sku;
    if (price !== undefined) {
      product.price = DataStandardizationService.normalizePrice(price);
    }
    if (ivaRate !== undefined) {
      product.ivaRate = DataStandardizationService.validateIVARate(ivaRate);
    }

    await product.save();

    res.json({ product });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(400).json({ error: error.message || 'Error actualizando producto' });
  }
};

exports.delete = async (req, res) => {
  try {
    const product = await db.Product.findOne({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId
      }
    });
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    product.isActive = false;
    await product.save();

    res.json({ message: 'Producto desactivado' });
  } catch (error) {
    console.error('Error desactivando producto:', error);
    res.status(500).json({ error: 'Error desactivando producto' });
  }
};

