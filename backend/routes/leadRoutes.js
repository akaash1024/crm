const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const leadController = require('../controllers/leadController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Validation rules
const createLeadValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('status').optional().isIn(['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'])
];

// Routes
router.get('/', leadController.getAllLeads);
router.get('/:id', leadController.getLeadById);
router.post('/', createLeadValidation, leadController.createLead);
router.put('/:id', createLeadValidation, leadController.updateLead);
router.delete('/:id', leadController.deleteLead);
router.patch('/:id/assign', leadController.assignLead);
router.patch('/:id/status', leadController.updateLeadStatus);

module.exports = router;

