const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get all users (Admin and Manager only)
router.get('/', authorize('Admin', 'Manager'), userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user (Admin only, or own profile)
router.put('/:id', userController.updateUser);

// Delete user (Admin only)
router.delete('/:id', authorize('Admin'), userController.deleteUser);

module.exports = router;

