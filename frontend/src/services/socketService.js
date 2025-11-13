import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { notificationActions } from '../store/slices/notificationSlice';

let socket = null;

/**
 * Initialize Socket.io connection
 */
export const initializeSocket = (dispatch) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return;
  }

  if (socket && socket.connected) {
    return socket;
  }

  socket = io('http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Lead events
  socket.on('lead:created', (data) => {
    toast.info(`New lead created: ${data.lead.firstName} ${data.lead.lastName}`);
    dispatch(notificationActions.addNotification({
      type: 'lead:created',
      message: `New lead created: ${data.lead.firstName} ${data.lead.lastName}`,
      data
    }));
  });

  socket.on('lead:updated', (data) => {
    toast.info(`Lead updated: ${data.lead.firstName} ${data.lead.lastName}`);
    dispatch(notificationActions.addNotification({
      type: 'lead:updated',
      message: `Lead updated: ${data.lead.firstName} ${data.lead.lastName}`,
      data
    }));
  });

  socket.on('lead:deleted', (data) => {
    toast.info('Lead deleted');
    dispatch(notificationActions.addNotification({
      type: 'lead:deleted',
      message: 'Lead deleted',
      data
    }));
  });

  socket.on('lead:assigned', (data) => {
    if (data.assignedTo.id === JSON.parse(localStorage.getItem('user'))?.id) {
      toast.success(`You have been assigned a new lead: ${data.lead.firstName} ${data.lead.lastName}`);
    }
    dispatch(notificationActions.addNotification({
      type: 'lead:assigned',
      message: `Lead assigned to ${data.assignedTo.firstName} ${data.assignedTo.lastName}`,
      data
    }));
  });

  socket.on('lead:statusUpdated', (data) => {
    toast.info(`Lead status updated: ${data.oldStatus} → ${data.newStatus}`);
    dispatch(notificationActions.addNotification({
      type: 'lead:statusUpdated',
      message: `Lead status updated: ${data.oldStatus} → ${data.newStatus}`,
      data
    }));
  });

  // Activity events
  socket.on('activity:created', (data) => {
    toast.info(`New activity: ${data.activity.title}`);
    dispatch(notificationActions.addNotification({
      type: 'activity:created',
      message: `New activity: ${data.activity.title}`,
      data
    }));
  });

  socket.on('activity:updated', (data) => {
    toast.info(`Activity updated: ${data.activity.title}`);
    dispatch(notificationActions.addNotification({
      type: 'activity:updated',
      message: `Activity updated: ${data.activity.title}`,
      data
    }));
  });

  socket.on('activity:deleted', (data) => {
    toast.info('Activity deleted');
    dispatch(notificationActions.addNotification({
      type: 'activity:deleted',
      message: 'Activity deleted',
      data
    }));
  });

  return socket;
};

/**
 * Disconnect Socket.io
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join lead room
 */
export const joinLeadRoom = (leadId) => {
  if (socket && socket.connected) {
    socket.emit('join:lead', leadId);
  }
};

/**
 * Leave lead room
 */
export const leaveLeadRoom = (leadId) => {
  if (socket && socket.connected) {
    socket.emit('leave:lead', leadId);
  }
};

export default socket;

