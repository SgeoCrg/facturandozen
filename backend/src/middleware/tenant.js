/**
 * Middleware para contexto multi-tenant
 */

const setTenantContext = async (req, res, next) => {
  try {
    // Superadmin puede ver todo
    if (req.user.role === 'superadmin') {
      req.tenant = null; // Sin restricción tenant
      return next();
    }

    // Usuario normal debe tener tenant
    if (!req.user.tenantId) {
      return res.status(403).json({ error: 'Usuario sin tenant asignado' });
    }

    req.tenant = {
      id: req.user.tenantId,
      name: req.user.tenant?.name,
      status: req.user.tenant?.status
    };

    // Verificar tenant activo
    if (req.tenant.status === 'suspended' || req.tenant.status === 'cancelled') {
      return res.status(403).json({ 
        error: 'Cuenta suspendida. Contacta con soporte.',
        status: req.tenant.status
      });
    }

    next();
  } catch (error) {
    console.error('Error middleware tenant:', error);
    return res.status(500).json({ error: 'Error contexto tenant' });
  }
};

const requireSuperadmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Solo superadministradores' });
  }
  next();
};

module.exports = {
  setTenantContext,
  requireSuperadmin
};
