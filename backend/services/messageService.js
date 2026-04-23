const Message = require('../models/message');
const { messageTypes, messageSenders, messageStatuses } = require('../utils/constants');

class MessageService {
  constructor() {
    this.messages = new Map();
  }

  createMessage({ content, sender, type, sessionId, agentId, userId, status }) {
    const messageStatus = status || (sender === messageSenders.SYSTEM ? messageStatuses.SENT : messageStatuses.SENDING);
    
    const message = new Message({
      content,
      sender,
      type: type || messageTypes.TEXT,
      status: messageStatus,
      sessionId,
      agentId,
      userId
    });

    if (!this.messages.has(sessionId)) {
      this.messages.set(sessionId, []);
    }

    this.messages.get(sessionId).push(message);

    return message;
  }

  getMessages(sessionId) {
    return this.messages.get(sessionId) || [];
  }

  getLastMessage(sessionId) {
    const messages = this.getMessages(sessionId);
    if (messages.length === 0) {
      return null;
    }
    return messages[messages.length - 1];
  }

  updateMessageStatus(messageId, sessionId, status) {
    const messages = this.messages.get(sessionId);
    if (!messages) {
      return null;
    }

    const message = messages.find(m => m.id === messageId);
    if (message) {
      message.status = status;
    }
    return message;
  }

  markMessageAsDelivered(messageId, sessionId) {
    return this.updateMessageStatus(messageId, sessionId, messageStatuses.DELIVERED);
  }

  markMessageAsRead(messageId, sessionId) {
    return this.updateMessageStatus(messageId, sessionId, messageStatuses.READ);
  }

  markMessageAsSent(messageId, sessionId) {
    return this.updateMessageStatus(messageId, sessionId, messageStatuses.SENT);
  }

  markMessageAsError(messageId, sessionId) {
    return this.updateMessageStatus(messageId, sessionId, messageStatuses.ERROR);
  }

  getUnreadMessages(sessionId, sender) {
    const messages = this.getMessages(sessionId);
    return messages.filter(m => m.sender === sender && m.status !== messageStatuses.READ);
  }

  getSentMessages(sessionId) {
    const messages = this.getMessages(sessionId);
    return messages.filter(m => m.sender === messageSenders.AGENT);
  }

  getReceivedMessages(sessionId) {
    const messages = this.getMessages(sessionId);
    return messages.filter(m => m.sender === messageSenders.USER);
  }
}

module.exports = new MessageService();
