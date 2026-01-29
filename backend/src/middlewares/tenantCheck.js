const tenantCheck = (getTenantFromReq) => {
  return (req, res, next) => {
    const tenantIdFromUser = req.user?.tenantId;
    const tenantIdFromReq = getTenantFromReq ? getTenantFromReq(req) : null;

    if (!tenantIdFromUser) {
      return res.status(400).json({ message: 'Tenant information missing' });
    }

    if (tenantIdFromReq && tenantIdFromReq !== tenantIdFromUser) {
      return res.status(403).json({ message: 'Forbidden: tenant mismatch' });
    }

    // Attach tenantId for downstream queries
    req.tenantId = tenantIdFromUser;
    next();
  };
};

module.exports = tenantCheck;

