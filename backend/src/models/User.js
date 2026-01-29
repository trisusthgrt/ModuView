const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const USER_ROLES = ['viewer', 'editor', 'admin'];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'viewer',
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model('User', userSchema);

module.exports = {
  User,
  USER_ROLES,
};

