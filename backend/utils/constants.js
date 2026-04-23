module.exports = {
  messageTypes: {
    TEXT: 'text',
    IMAGE: 'image',
    SYSTEM: 'system',
    FILE: 'file'
  },

  messageSenders: {
    USER: 'user',
    AGENT: 'agent',
    SYSTEM: 'system'
  },

  messageStatuses: {
    PENDING: 'pending',
    SENDING: 'sending',
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
    ERROR: 'error'
  },

  sessionStatuses: {
    WAITING: 'waiting',
    ACTIVE: 'active',
    TRANSFERRED: 'transferred',
    CLOSED: 'closed'
  },

  wsMessageTypes: {
    HEARTBEAT: 'heartbeat',
    AUTH: 'auth',
    AUTH_SUCCESS: 'auth_success',
    AUTH_FAILED: 'auth_failed',
    
    SESSION_CREATE: 'session_create',
    SESSION_CREATED: 'session_created',
    SESSION_ACCEPT: 'session_accept',
    SESSION_ACCEPTED: 'session_accepted',
    SESSION_CLOSE: 'session_close',
    SESSION_CLOSED: 'session_closed',
    SESSION_LIST: 'session_list',
    SESSION_UPDATE: 'session_update',
    
    MESSAGE_SEND: 'message_send',
    MESSAGE_SENT: 'message_sent',
    MESSAGE_DELIVERED: 'message_delivered',
    MESSAGE_READ: 'message_read',
    MESSAGE_RECEIVE: 'message_receive',
    MESSAGE_HISTORY: 'message_history',
    
    ERROR: 'error'
  },

  clientTypes: {
    USER: 'user',
    AGENT: 'agent'
  }
};
