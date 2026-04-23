const messageService = require('./messageService');
const sessionService = require('./sessionService');
const { messageSenders, messageStatuses } = require('../utils/constants');

class ReadReceiptService {
  constructor() {
    this.messageService = messageService;
    this.sessionService = sessionService;
  }

  markAllUnreadMessagesAsRead(sessionId, sender) {
    const unreadMessages = this.messageService.getUnreadMessages(sessionId, sender);
    
    if (unreadMessages.length === 0) {
      return [];
    }
    
    const markedMessages = [];
    unreadMessages.forEach(message => {
      this.messageService.markMessageAsRead(message.id, sessionId);
      markedMessages.push(message);
    });
    
    this.sessionService.resetUnreadCount(sessionId);
    
    return markedMessages;
  }

  markAllUserMessagesAsRead(sessionId) {
    return this.markAllUnreadMessagesAsRead(sessionId, messageSenders.USER);
  }

  markAllAgentMessagesAsRead(sessionId) {
    return this.markAllUnreadMessagesAsRead(sessionId, messageSenders.AGENT);
  }

  getUnreadUserMessages(sessionId) {
    return this.messageService.getUnreadMessages(sessionId, messageSenders.USER);
  }

  getUnreadAgentMessages(sessionId) {
    return this.messageService.getUnreadMessages(sessionId, messageSenders.AGENT);
  }
}

module.exports = new ReadReceiptService();
