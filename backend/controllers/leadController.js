const { Lead, User, Activity } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const emailService = require('../services/emailService');

/**
 * Get all leads (with pagination and filters)
 */
const getAllLeads = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      assignedToId, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by assigned user
    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    // Sales Executives can only see their assigned leads
    if (req.user.role === 'Sales Executive') {
      where.assignedToId = req.user.id;
    }

    // Search functionality
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Lead.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'createdBy',
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
        leads: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get all leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leads',
      error: error.message
    });
  }
};

/**
 * Get lead by ID
 */
const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Activity,
          as: 'activities',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email']
            }
          ],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

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

    res.json({
      success: true,
      data: { lead }
    });
  } catch (error) {
    logger.error('Get lead by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lead',
      error: error.message
    });
  }
};

/**
 * Create a new lead
 */
const createLead = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const leadData = {
      ...req.body,
      createdById: req.user.id,
      assignedToId: req.body.assignedToId || req.user.id
    };

    const lead = await Lead.create(leadData);

    // Create initial activity
    await Activity.create({
      type: 'Status Change',
      title: 'Lead Created',
      description: `Lead "${lead.getFullName()}" was created`,
      leadId: lead.id,
      userId: req.user.id,
      metadata: { status: lead.status }
    });

    // Emit real-time notification
    const io = req.app.get('io');
    io.emit('lead:created', {
      lead,
      createdBy: req.user
    });

    // Send email notification if assigned to someone else
    if (lead.assignedToId !== req.user.id) {
      const assignedUser = await User.findByPk(lead.assignedToId);
      if (assignedUser) {
        await emailService.sendLeadAssignmentEmail(assignedUser, lead);
      }
    }

    logger.info(`Lead created: ${lead.id} by ${req.user.email}`);

    const createdLead = await Lead.findByPk(lead.id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: { lead: createdLead }
    });
  } catch (error) {
    logger.error('Create lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating lead',
      error: error.message
    });
  }
};

/**
 * Update a lead
 */
const updateLead = async (req, res) => {
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

    const lead = await Lead.findByPk(id);
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

    const oldStatus = lead.status;
    const oldAssignedTo = lead.assignedToId;

    await lead.update(req.body);

    // Create activity for status change
    if (req.body.status && req.body.status !== oldStatus) {
      await Activity.create({
        type: 'Status Change',
        title: 'Status Updated',
        description: `Status changed from "${oldStatus}" to "${req.body.status}"`,
        leadId: lead.id,
        userId: req.user.id,
        metadata: { oldStatus, newStatus: req.body.status }
      });
    }

    // Create activity for assignment change
    if (req.body.assignedToId && req.body.assignedToId !== oldAssignedTo) {
      const newAssignedUser = await User.findByPk(req.body.assignedToId);
      await Activity.create({
        type: 'Status Change',
        title: 'Lead Reassigned',
        description: `Lead reassigned to ${newAssignedUser.getFullName()}`,
        leadId: lead.id,
        userId: req.user.id,
        metadata: { oldAssignedTo, newAssignedTo: req.body.assignedToId }
      });

      // Send email notification
      if (newAssignedUser) {
        await emailService.sendLeadAssignmentEmail(newAssignedUser, lead);
      }
    }

    // Emit real-time notification
    const io = req.app.get('io');
    io.emit('lead:updated', {
      lead,
      updatedBy: req.user
    });

    logger.info(`Lead updated: ${lead.id} by ${req.user.email}`);

    const updatedLead = await Lead.findByPk(lead.id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: { lead: updatedLead }
    });
  } catch (error) {
    logger.error('Update lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating lead',
      error: error.message
    });
  }
};

/**
 * Delete a lead
 */
const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Only Admin, Manager, or the creator can delete
    if (req.user.role === 'Sales Executive' && lead.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await lead.destroy();

    // Emit real-time notification
    const io = req.app.get('io');
    io.emit('lead:deleted', {
      leadId: id,
      deletedBy: req.user
    });

    logger.info(`Lead deleted: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    logger.error('Delete lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting lead',
      error: error.message
    });
  }
};

/**
 * Assign lead to a user
 */
const assignLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedToId } = req.body;

    if (!assignedToId) {
      return res.status(400).json({
        success: false,
        message: 'assignedToId is required'
      });
    }

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const assignedUser = await User.findByPk(assignedToId);
    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldAssignedTo = lead.assignedToId;
    lead.assignedToId = assignedToId;
    await lead.save();

    // Create activity
    await Activity.create({
      type: 'Status Change',
      title: 'Lead Reassigned',
      description: `Lead reassigned to ${assignedUser.getFullName()}`,
      leadId: lead.id,
      userId: req.user.id,
      metadata: { oldAssignedTo, newAssignedTo: assignedToId }
    });

    // Send email notification
    await emailService.sendLeadAssignmentEmail(assignedUser, lead);

    // Emit real-time notification
    const io = req.app.get('io');
    io.emit('lead:assigned', {
      lead,
      assignedTo: assignedUser,
      assignedBy: req.user
    });

    logger.info(`Lead assigned: ${lead.id} to ${assignedUser.email}`);

    res.json({
      success: true,
      message: 'Lead assigned successfully',
      data: { lead }
    });
  } catch (error) {
    logger.error('Assign lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning lead',
      error: error.message
    });
  }
};

/**
 * Update lead status
 */
const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const lead = await Lead.findByPk(id);
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

    const oldStatus = lead.status;
    lead.status = status;
    await lead.save();

    // Create activity
    await Activity.create({
      type: 'Status Change',
      title: 'Status Updated',
      description: `Status changed from "${oldStatus}" to "${status}"`,
      leadId: lead.id,
      userId: req.user.id,
      metadata: { oldStatus, newStatus: status }
    });

    // Emit real-time notification
    const io = req.app.get('io');
    io.emit('lead:statusUpdated', {
      lead,
      oldStatus,
      newStatus: status,
      updatedBy: req.user
    });

    logger.info(`Lead status updated: ${lead.id} from ${oldStatus} to ${status}`);

    res.json({
      success: true,
      message: 'Lead status updated successfully',
      data: { lead }
    });
  } catch (error) {
    logger.error('Update lead status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating lead status',
      error: error.message
    });
  }
};

module.exports = {
  getAllLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  assignLead,
  updateLeadStatus
};

