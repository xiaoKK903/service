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
    
    QUICK_REPLY_LIST: 'quick_reply_list',
    QUICK_REPLY_LIST_RESPONSE: 'quick_reply_list_response',
    QUICK_REPLY_CREATE: 'quick_reply_create',
    QUICK_REPLY_CREATED: 'quick_reply_created',
    QUICK_REPLY_UPDATE: 'quick_reply_update',
    QUICK_REPLY_UPDATED: 'quick_reply_updated',
    QUICK_REPLY_DELETE: 'quick_reply_delete',
    QUICK_REPLY_DELETED: 'quick_reply_deleted',
    
    AGENT_STATUS_UPDATE: 'agent_status_update',
    AGENT_STATUS_CHANGED: 'agent_status_changed',
    
    BATCH_MESSAGE_READ: 'batch_message_read',
    BATCH_MESSAGE_READ_ACK: 'batch_message_read_ack',
    
    ERROR: 'error'
  },

  clientTypes: {
    USER: 'user',
    AGENT: 'agent'
  },

  agentStatuses: {
    IDLE: 'idle',
    BUSY: 'busy',
    OFFLINE: 'offline'
  }
};
