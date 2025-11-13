const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify transporter
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter.verify((error, success) => {
    if (error) {
      logger.error('Email service error:', error);
    } else {
      logger.info('Email service is ready');
    }
  });
}

/**
 * Send lead assignment email
 */
const sendLeadAssignmentEmail = async (user, lead) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      logger.warn('Email service not configured. Skipping email send.');
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `New Lead Assigned: ${lead.getFullName()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Lead Assigned</h2>
          <p>Hello ${user.getFullName()},</p>
          <p>A new lead has been assigned to you:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Name:</strong> ${lead.getFullName()}</p>
            <p><strong>Email:</strong> ${lead.email}</p>
            <p><strong>Phone:</strong> ${lead.phone || 'N/A'}</p>
            <p><strong>Company:</strong> ${lead.company || 'N/A'}</p>
            <p><strong>Status:</strong> ${lead.status}</p>
            <p><strong>Estimated Value:</strong> $${lead.estimatedValue || 0}</p>
          </div>
          <p>Please follow up with this lead as soon as possible.</p>
          <p>Best regards,<br>CRM System</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Lead assignment email sent to ${user.email}`);
  } catch (error) {
    logger.error('Error sending lead assignment email:', error);
    // Don't throw error - email failures shouldn't break the application
  }
};

/**
 * Send status update email
 */
const sendStatusUpdateEmail = async (user, lead, oldStatus, newStatus) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      logger.warn('Email service not configured. Skipping email send.');
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Lead Status Updated: ${lead.getFullName()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Lead Status Updated</h2>
          <p>Hello ${user.getFullName()},</p>
          <p>The status of lead "${lead.getFullName()}" has been updated:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Lead:</strong> ${lead.getFullName()}</p>
            <p><strong>Old Status:</strong> ${oldStatus}</p>
            <p><strong>New Status:</strong> ${newStatus}</p>
          </div>
          <p>Best regards,<br>CRM System</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Status update email sent to ${user.email}`);
  } catch (error) {
    logger.error('Error sending status update email:', error);
  }
};

/**
 * Send activity notification email
 */
const sendActivityNotificationEmail = async (user, activity, lead) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      logger.warn('Email service not configured. Skipping email send.');
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `New Activity: ${activity.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Activity</h2>
          <p>Hello ${user.getFullName()},</p>
          <p>A new activity has been added to lead "${lead.getFullName()}":</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Type:</strong> ${activity.type}</p>
            <p><strong>Title:</strong> ${activity.title}</p>
            <p><strong>Description:</strong> ${activity.description || 'N/A'}</p>
            <p><strong>Lead:</strong> ${lead.getFullName()}</p>
          </div>
          <p>Best regards,<br>CRM System</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Activity notification email sent to ${user.email}`);
  } catch (error) {
    logger.error('Error sending activity notification email:', error);
  }
};

module.exports = {
  sendLeadAssignmentEmail,
  sendStatusUpdateEmail,
  sendActivityNotificationEmail
};

