const { messageTypes, messageSenders, messageStatuses } = require('../utils/constants');

class Message {
  constructor({ id, content, sender, type, timestamp, status, sessionId, agentId, userId, recalled, recalledAt }) {
    this.id = id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.content = content;
    this.sender = sender;
    this.type = type || messageTypes.TEXT;
    this.timestamp = timestamp || Date.now();
    this.status = status || messageStatuses.PENDING;
    this.sessionId = sessionId;
    this.agentId = agentId || null;
    this.userId = userId || null;
    this.recalled = recalled || false;
    this.recalledAt = recalledAt || null;
  }

  toJSON() {
    return {
      id: this.id,
      content: this.content,
      sender: this.sender,
      type: this.type,
      timestamp: this.timestamp,
      status: this.status,
      sessionId: this.sessionId,
      agentId: this.agentId,
      userId: this.userId,
      recalled: this.recalled,
      recalledAt: this.recalledAt
    };
  }

  static fromJSON(json) {
    return new Message(json);
  }
}

module.exports = Message;
