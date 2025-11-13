const User = require('./User');
const Lead = require('./Lead');
const Activity = require('./Activity');

// Additional associations
User.hasMany(Lead, { foreignKey: 'assignedToId', as: 'assignedLeads' });
User.hasMany(Lead, { foreignKey: 'createdById', as: 'createdLeads' });
User.hasMany(Activity, { foreignKey: 'userId', as: 'activities' });

Lead.hasMany(Activity, { foreignKey: 'leadId', as: 'activities' });

module.exports = {
  User,
  Lead,
  Activity
};

