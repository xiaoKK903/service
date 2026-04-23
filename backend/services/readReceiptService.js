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
    console.log(`[ReadReceiptService] 会话 ${sessionId} 中 ${sender} 未读消息数: ${unreadMessages.length}`);
    
    if (unreadMessages.length === 0) {
      return [];
    }
    
    const markedMessages = [];
    unreadMessages.forEach(message => {
      this.messageService.markMessageAsRead(message.id, sessionId);
      markedMessages.push(message);
      console.log(`[ReadReceiptService] 标记消息 ${message.id} 为已读`);
    });
    
    this.sessionService.resetUnreadCount(sessionId);
    
    return markedMessages;
  }

  markAllUserMessagesAsRead(sessionId) {
    console.log(`[ReadReceiptService] 批量标记会话 ${sessionId} 中用户消息为已读`);
    return this.markAllUnreadMessagesAsRead(sessionId, messageSenders.USER);
  }

  markAllAgentMessagesAsRead(sessionId) {
    console.log(`[ReadReceiptService] 批量标记会话 ${sessionId} 中客服消息为已读`);
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
