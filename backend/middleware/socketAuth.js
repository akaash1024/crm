const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

/**
 * Authenticate socket connection using JWT token
 */
const authenticateSocket = async (token) => {
  try {
    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
};

module.exports = {
  authenticateSocket
};

