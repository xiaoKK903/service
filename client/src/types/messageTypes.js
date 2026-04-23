export const messageTypes = {
  TEXT: 'text',
  IMAGE: 'image',
  SYSTEM: 'system'
};

export const messageSenders = {
  USER: 'user',
  SERVER: 'server'
};

export const messageStatuses = {
  PENDING: 'pending',
  SENDING: 'sending',
  SENT: 'sent',
  ERROR: 'error'
};

export function formatTime(timestamp) {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function isFromMe(sender) {
  return sender === 'user';
}

export function isFromServer(sender) {
  return sender === 'server';
}

export function createMessage({ id, content, sender, type, timestamp, status }) {
  return {
    id: id || Date.now().toString(),
    content,
    sender,
    type: type || 'text',
    timestamp: timestamp || Date.now(),
    status: status || 'pending'
  };
}

export default {
  messageTypes,
  messageSenders,
  messageStatuses,
  formatTime,
  isFromMe,
  isFromServer,
  createMessage
};
