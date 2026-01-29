const bcrypt = require('bcrypt');
const { User, USER_ROLES } = require('../models/User');

// GET /admin/users
const listUsers = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const users = await User.find({ tenantId })
      .select('_id email role tenantId createdAt updatedAt')
      .sort({ createdAt: -1 });

    res.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        email: u.email,
        role: u.role,
        tenantId: u.tenantId,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// POST /admin/users
// Body: { email, password, role }
const createUser = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (role && !USER_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash,
      role: role || 'viewer',
      tenantId,
    });

    res.status(201).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /admin/users/:id
// Body: { role }
const updateUserRole = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !USER_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Valid role is required' });
    }

    const user = await User.findOne({ _id: id, tenantId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findOne({ _id: id, tenantId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listUsers,
  createUser,
  updateUserRole,
  deleteUser,
};

