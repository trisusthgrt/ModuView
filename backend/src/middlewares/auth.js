const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  // NOTE: <video> tags can't send Authorization headers.
  // For the streaming endpoint we also allow token via query string: ?token=...
  const token =
    (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null) ||
    (typeof req.query.token === 'string' ? req.query.token : null);

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;

