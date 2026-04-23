export const messageTypes = {
  TEXT: 'text',
  IMAGE: 'image',
  SYSTEM: 'system',
  FILE: 'file'
};

export const messageSenders = {
  USER: 'user',
  AGENT: 'agent',
  SYSTEM: 'system'
};

export const messageStatuses = {
  PENDING: 'pending',
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  ERROR: 'error'
};

export const sessionStatuses = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  TRANSFERRED: 'transferred',
  CLOSED: 'closed'
};

export function formatTime(timestamp) {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDate(timestamp) {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}月${day}日`;
}

export function isFromUser(sender) {
  return sender === 'user';
}

export function isFromAgent(sender) {
  return sender === 'agent';
}

export function isSystemMessage(sender) {
  return sender === 'system';
}

export function createMessage({ id, content, sender, type, timestamp, status, sessionId, agentId, userId }) {
  return {
    id: id || Date.now().toString(),
    content,
    sender,
    type: type || 'text',
    timestamp: timestamp || Date.now(),
    status: status || 'pending',
    sessionId,
    agentId,
    userId
  };
}

export function createSession({ id, userId, userName, userAvatar, agentId, status, lastMessage, lastMessageTime, unreadCount, createdAt, closedAt }) {
  return {
    id: id || Date.now().toString(),
    userId,
    userName: userName || `用户${userId}`,
    userAvatar: userAvatar || null,
    agentId,
    status: status || 'waiting',
    lastMessage: lastMessage || '',
    lastMessageTime: lastMessageTime || Date.now(),
    unreadCount: unreadCount || 0,
    createdAt: createdAt || Date.now(),
    closedAt: closedAt || null
  };
}

export default {
  messageTypes,
  messageSenders,
  messageStatuses,
  sessionStatuses,
  formatTime,
  formatDate,
  isFromUser,
  isFromAgent,
  isSystemMessage,
  createMessage,
  createSession
};
