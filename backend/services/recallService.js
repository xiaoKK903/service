const messageService = require('./messageService');
const sessionService = require('./sessionService');
const { messageStatuses, messageSenders } = require('../utils/constants');

const RECALL_WINDOW_MS = 2 * 60 * 1000;

class RecallService {
  constructor() {
    this.messageService = messageService;
    this.sessionService = sessionService;
  }

  canRecallMessage(message, senderType) {
    if (!message) {
      console.log('[RecallService] 消息不存在');
      return { canRecall: false, reason: '消息不存在' };
    }

    if (message.recalled) {
      console.log('[RecallService] 消息已撤回:', message.id);
      return { canRecall: false, reason: '消息已撤回' };
    }

    if (message.status === messageStatuses.READ) {
      console.log('[RecallService] 消息已读，无法撤回:', message.id);
      return { canRecall: false, reason: '消息已读，无法撤回' };
    }

    if (senderType === 'user' && message.sender !== messageSenders.USER) {
      console.log('[RecallService] 用户只能撤回自己的消息');
      return { canRecall: false, reason: '只能撤回自己的消息' };
    }

    if (senderType === 'agent' && message.sender !== messageSenders.AGENT) {
      console.log('[RecallService] 客服只能撤回自己的消息');
      return { canRecall: false, reason: '只能撤回自己的消息' };
    }

    const now = Date.now();
    const messageTime = message.timestamp || 0;
    const elapsed = now - messageTime;

    if (elapsed > RECALL_WINDOW_MS) {
      console.log(`[RecallService] 消息超过撤回时限: ${elapsed}ms`);
      return { canRecall: false, reason: '超过撤回时限（2分钟）' };
    }

    return { canRecall: true };
  }

  recallMessage(messageId, sessionId, senderType) {
    const message = this.getMessageById(messageId, sessionId);
    const checkResult = this.canRecallMessage(message, senderType);

    if (!checkResult.canRecall) {
      return { success: false, reason: checkResult.reason };
    }

    message.recalled = true;
    message.recalledAt = Date.now();

    console.log(`[RecallService] 消息已撤回: ${messageId}`);

    return {
      success: true,
      message: {
        id: messageId,
        messageId: messageId,
        sessionId: sessionId,
        content: message.content,
        sender: message.sender,
        recalled: true,
        recalledAt: message.recalledAt
      }
    };
  }

  getMessageById(messageId, sessionId) {
    const messages = this.messageService.getMessages(sessionId);
    return messages.find(m => m.id === messageId) || null;
  }

  isRecalled(messageId) {
    return false;
  }

  getRecallWindowSeconds() {
    return RECALL_WINDOW_MS / 1000;
  }
}

module.exports = new RecallService();
