const { Lead, Activity, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    // Build where clause based on user role
    const leadWhere = {};
    if (role === 'Sales Executive') {
      leadWhere.assignedToId = userId;
    }

    // Total leads
    const totalLeads = await Lead.count({ where: leadWhere });

    // Leads by status
    const newLeads = await Lead.count({ where: { ...leadWhere, status: 'New' } });
    const qualifiedLeads = await Lead.count({ where: { ...leadWhere, status: 'Qualified' } });
    const wonLeads = await Lead.count({ where: { ...leadWhere, status: 'Won' } });
    const lostLeads = await Lead.count({ where: { ...leadWhere, status: 'Lost' } });

    // Total value
    const totalValue = await Lead.sum('estimatedValue', {
      where: { ...leadWhere, status: { [Op.notIn]: ['Lost'] } }
    }) || 0;

    // Won value
    const wonValue = await Lead.sum('estimatedValue', {
      where: { ...leadWhere, status: 'Won' }
    }) || 0;

    // Activities today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activityWhere = {};
    if (role === 'Sales Executive') {
      const userLeads = await Lead.findAll({
        where: { assignedToId: userId },
        attributes: ['id']
      });
      const leadIds = userLeads.map(lead => lead.id);
      activityWhere.leadId = { [Op.in]: leadIds };
    }
    const activitiesToday = await Activity.count({
      where: {
        ...activityWhere,
        createdAt: { [Op.gte]: today }
      }
    });

    // Conversion rate
    const conversionRate = totalLeads > 0 
      ? ((wonLeads / totalLeads) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalLeads,
          newLeads,
          qualifiedLeads,
          wonLeads,
          lostLeads,
          totalValue: parseFloat(totalValue),
          wonValue: parseFloat(wonValue),
          activitiesToday,
          conversionRate: parseFloat(conversionRate)
        }
      }
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

/**
 * Get leads by status (for charts)
 */
const getLeadsByStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const leadWhere = {};
    if (role === 'Sales Executive') {
      leadWhere.assignedToId = userId;
    }

    const leadsByStatus = await Lead.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: leadWhere,
      group: ['status'],
      raw: true
    });

    res.json({
      success: true,
      data: { leadsByStatus }
    });
  } catch (error) {
    logger.error('Get leads by status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leads by status',
      error: error.message
    });
  }
};

/**
 * Get leads by source (for charts)
 */
const getLeadsBySource = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const leadWhere = {};
    if (role === 'Sales Executive') {
      leadWhere.assignedToId = userId;
    }

    const leadsBySource = await Lead.findAll({
      attributes: [
        'source',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        ...leadWhere,
        source: { [Op.not]: null }
      },
      group: ['source'],
      raw: true
    });

    res.json({
      success: true,
      data: { leadsBySource }
    });
  } catch (error) {
    logger.error('Get leads by source error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leads by source',
      error: error.message
    });
  }
};

/**
 * Get recent activities
 */
const getRecentActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.id;
    const role = req.user.role;

    const activityWhere = {};
    if (role === 'Sales Executive') {
      const userLeads = await Lead.findAll({
        where: { assignedToId: userId },
        attributes: ['id']
      });
      const leadIds = userLeads.map(lead => lead.id);
      activityWhere.leadId = { [Op.in]: leadIds };
    }

    const activities = await Activity.findAll({
      where: activityWhere,
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    logger.error('Get recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activities',
      error: error.message
    });
  }
};

/**
 * Get team performance (Admin and Manager only)
 */
const getTeamPerformance = async (req, res) => {
  try {
    if (!['Admin', 'Manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const teamPerformance = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
      include: [
        {
          model: Lead,
          as: 'assignedLeads',
          attributes: [
            'id',
            'status',
            [sequelize.fn('SUM', sequelize.col('estimatedValue')), 'totalValue']
          ],
          required: false
        }
      ],
      group: ['User.id', 'assignedLeads.status'],
      raw: true
    });

    // Aggregate by user
    const performanceMap = {};
    teamPerformance.forEach(row => {
      if (!performanceMap[row.id]) {
        performanceMap[row.id] = {
          user: {
            id: row.id,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            role: row.role
          },
          totalLeads: 0,
          totalValue: 0,
          wonLeads: 0,
          wonValue: 0
        };
      }
      performanceMap[row.id].totalLeads += 1;
      performanceMap[row.id].totalValue += parseFloat(row.totalValue || 0);
      if (row.status === 'Won') {
        performanceMap[row.id].wonLeads += 1;
        performanceMap[row.id].wonValue += parseFloat(row.totalValue || 0);
      }
    });

    res.json({
      success: true,
      data: { teamPerformance: Object.values(performanceMap) }
    });
  } catch (error) {
    logger.error('Get team performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team performance',
      error: error.message
    });
  }
};

/**
 * Get sales pipeline data
 */
const getSalesPipeline = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const leadWhere = {};
    if (role === 'Sales Executive') {
      leadWhere.assignedToId = userId;
    }

    const pipeline = await Lead.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('estimatedValue')), 'totalValue']
      ],
      where: {
        ...leadWhere,
        status: { [Op.notIn]: ['Won', 'Lost'] }
      },
      group: ['status'],
      order: [
        [sequelize.literal(`CASE status 
          WHEN 'New' THEN 1 
          WHEN 'Contacted' THEN 2 
          WHEN 'Qualified' THEN 3 
          WHEN 'Proposal' THEN 4 
          WHEN 'Negotiation' THEN 5 
          ELSE 6 
        END`)]
      ],
      raw: true
    });

    res.json({
      success: true,
      data: { pipeline }
    });
  } catch (error) {
    logger.error('Get sales pipeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales pipeline',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getLeadsByStatus,
  getLeadsBySource,
  getRecentActivities,
  getTeamPerformance,
  getSalesPipeline
};

