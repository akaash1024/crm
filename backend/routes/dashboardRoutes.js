const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/stats', dashboardController.getDashboardStats);
router.get('/leads-by-status', dashboardController.getLeadsByStatus);
router.get('/leads-by-source', dashboardController.getLeadsBySource);
router.get('/recent-activities', dashboardController.getRecentActivities);
router.get('/team-performance', dashboardController.getTeamPerformance);
router.get('/sales-pipeline', dashboardController.getSalesPipeline);

module.exports = router;

