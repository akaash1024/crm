const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const activityController = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Validation rules
const createActivityValidation = [
  body('type').isIn(['Note', 'Call', 'Meeting', 'Email', 'Status Change']).withMessage('Invalid activity type'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('leadId').notEmpty().withMessage('Lead ID is required')
];

// Routes
router.get('/', activityController.getAllActivities);
router.get('/lead/:leadId', activityController.getActivitiesByLead);
router.get('/:id', activityController.getActivityById);
router.post('/', createActivityValidation, activityController.createActivity);
router.put('/:id', createActivityValidation, activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);

module.exports = router;

