const express = require('express');
const authMiddleware = require('../middlewares/auth');
const tenantCheck = require('../middlewares/tenantCheck');
const roleCheck = require('../middlewares/roleCheck');
const {
  listUsers,
  createUser,
  updateUserRole,
  deleteUser,
} = require('../controllers/adminController');

const router = express.Router();

router.use(authMiddleware);
router.use(tenantCheck());
router.use(roleCheck(['admin']));

router.get('/users', listUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;

