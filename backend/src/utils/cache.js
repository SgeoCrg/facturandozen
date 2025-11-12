const NodeCache = require('node-cache');

/**
 * Caché en memoria para queries frecuentes
 * TTL: 5 minutos por defecto
 */

const cache = new NodeCache({
  stdTTL: 300, // 5 minutos
  checkperiod: 60, // Limpiar cada 60s
  useClones: false
});

module.exports = {
  get: (key) => cache.get(key),
  set: (key, value, ttl) => cache.set(key, value, ttl),
  del: (key) => cache.del(key),
  flush: () => cache.flushAll(),
  
  // Helpers específicos
  getUserKey: (userId) => `user:${userId}`,
  getTenantKey: (tenantId) => `tenant:${tenantId}`,
  getCustomersKey: (tenantId) => `customers:${tenantId}`,
  getProductsKey: (tenantId) => `products:${tenantId}`,
  getInvoicesKey: (tenantId) => `invoices:${tenantId}`,
  
  // Invalidar por tenant
  invalidateTenant: (tenantId) => {
    cache.del(cache.getTenantKey(tenantId));
    cache.del(cache.getCustomersKey(tenantId));
    cache.del(cache.getProductsKey(tenantId));
    cache.del(cache.getInvoicesKey(tenantId));
  }
};



