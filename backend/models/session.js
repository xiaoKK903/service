const { sessionStatuses } = require('../utils/constants');

class Session {
  constructor({ id, userId, userName, userAvatar, agentId, status, lastMessage, lastMessageTime, unreadCount, createdAt, closedAt }) {
    this.id = id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.userId = userId;
    this.userName = userName || `用户${userId}`;
    this.userAvatar = userAvatar || null;
    this.agentId = agentId || null;
    this.status = status || sessionStatuses.WAITING;
    this.lastMessage = lastMessage || '';
    this.lastMessageTime = lastMessageTime || Date.now();
    this.unreadCount = unreadCount || 0;
    this.createdAt = createdAt || Date.now();
    this.closedAt = closedAt || null;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      userName: this.userName,
      userAvatar: this.userAvatar,
      agentId: this.agentId,
      status: this.status,
      lastMessage: this.lastMessage,
      lastMessageTime: this.lastMessageTime,
      unreadCount: this.unreadCount,
      createdAt: this.createdAt,
      closedAt: this.closedAt
    };
  }

  static fromJSON(json) {
    return new Session(json);
  }
}

module.exports = Session;
