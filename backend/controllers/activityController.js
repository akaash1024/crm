const { Activity, Lead, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

/**
 * Get all activities (with pagination and filters)
 */
const getAllActivities = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      leadId, 
      userId,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    if (type) {
      where.type = type;
    }
    if (leadId) {
      where.leadId = leadId;
    }
    if (userId) {
      where.userId = userId;
    }

    // Sales Executives can only see activities for their assigned leads
    if (req.user.role === 'Sales Executive') {
      const userLeads = await Lead.findAll({
        where: { assignedToId: req.user.id },
        attributes: ['id']
      });
      const leadIds = userLeads.map(lead => lead.id);
      where.leadId = { [Op.in]: leadIds };
    }

    const { count, rows } = await Activity.findAndCountAll({
      where,
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'firstName', 'lastName', 'email', 'status']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]]
    });

    res.json({
      success: true,
      data: {
        activities: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get all activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message
    });
  }
};

/**
 * Get activities by lead ID
 */
const getActivitiesByLead = async (req, res) => {
  try {
    const { leadId } = req.params;

    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Sales Executive' && lead.assignedToId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const activities = await Activity.findAll({
      where: { leadId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    logger.error('Get activities by lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message
    });
  }
};

/**
 * Get activity by ID
 */
const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findByPk(id, {
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'firstName', 'lastName', 'email', 'status']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Sales Executive') {
      const lead = await Lead.findByPk(activity.leadId);
      if (lead.assignedToId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: { activity }
    });
  } catch (error) {
    logger.error('Get activity by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity',
      error: error.message
    });
  }
};

/**
 * Create a new activity
 */
const createActivity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { leadId, type, title, description, scheduledAt, metadata } = req.body;

    // Verify lead exists
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Sales Executive' && lead.assignedToId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const activity = await Activity.create({
      type,
      title,
      description,
      leadId,
      userId: req.user.id,
      scheduledAt,
      metadata: metadata || {}
    });

    // Emit real-time notification
    const io = req.app.get('io');
    io.emit('activity:created', {
      activity,
      user: req.user,
      lead
    });

    logger.info(`Activity created: ${activity.id} by ${req.user.email}`);

    const createdActivity = await Activity.findByPk(activity.id, {
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'firstName', 'lastName', 'email', 'status']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: { activity: createdActivity }
    });
  } catch (error) {
    logger.error('Create activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating activity',
      error: error.message
    });
  }
};

/**
 * Update an activity
 */
const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const activity = await Activity.findByPk(id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check permissions - users can only update their own activities
    if (activity.userId !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await activity.update(req.body);

    // Emit real-time notification
    const io = req.app.get('io');
    io.emit('activity:updated', {
      activity,
      updatedBy: req.user
    });

    logger.info(`Activity updated: ${activity.id} by ${req.user.email}`);

    const updatedActivity = await Activity.findByPk(activity.id, {
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'firstName', 'lastName', 'email', 'status']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Activity updated successfully',
      data: { activity: updatedActivity }
    });
  } catch (error) {
    logger.error('Update activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating activity',
      error: error.message
    });
  }
};

/**
 * Delete an activity
 */
const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findByPk(id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check permissions - users can only delete their own activities (or Admin)
    if (activity.userId !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await activity.destroy();

    // Emit real-time notification
    const io = req.app.get('io');
    io.emit('activity:deleted', {
      activityId: id,
      deletedBy: req.user
    });

    logger.info(`Activity deleted: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    logger.error('Delete activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting activity',
      error: error.message
    });
  }
};

module.exports = {
  getAllActivities,
  getActivitiesByLead,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity
};

