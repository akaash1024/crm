const User = require('./User');
const Lead = require('./Lead');
const Activity = require('./Activity');

// Define all associations after models are loaded
// User associations
User.hasMany(Lead, { foreignKey: 'assignedToId', as: 'assignedLeads' });
User.hasMany(Lead, { foreignKey: 'createdById', as: 'createdLeads' });
User.hasMany(Activity, { foreignKey: 'userId', as: 'activities' });

// Lead associations
Lead.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignedTo' });
Lead.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
Lead.hasMany(Activity, { foreignKey: 'leadId', as: 'activities' });

// Activity associations
Activity.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });
Activity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  User,
  Lead,
  Activity
};

