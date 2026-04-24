const Session = require('../models/session');
const { sessionStatuses } = require('../utils/constants');
const storageService = require('./storageService');

class SessionService {
  constructor() {
    this.sessions = new Map();
    this.userSessionMap = new Map();
    this.loadFromStorage();
  }

  loadFromStorage() {
    const loadedSessions = storageService.loadSessions(Session);
    for (const session of loadedSessions) {
      this.sessions.set(session.id, session);
      
      if (!this.userSessionMap.has(session.userId)) {
        this.userSessionMap.set(session.userId, []);
      }
      this.userSessionMap.get(session.userId).push(session.id);
    }
  }

  saveToStorage() {
    storageService.saveSessions(this.sessions);
  }

  createSession({ userId, userName, userAvatar }) {
    const existingSession = this.getUserActiveSession(userId);
    if (existingSession) {
      return existingSession;
    }

    const session = new Session({
      userId,
      userName,
      userAvatar,
      status: sessionStatuses.WAITING,
      unreadCount: 0
    });

    this.sessions.set(session.id, session);
    
    if (!this.userSessionMap.has(userId)) {
      this.userSessionMap.set(userId, []);
    }
    this.userSessionMap.get(userId).push(session.id);

    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  getUserActiveSession(userId) {
    const userSessions = this.userSessionMap.get(userId) || [];
    for (const sessionId of userSessions) {
      const session = this.sessions.get(sessionId);
      if (session && (session.status === sessionStatuses.WAITING || session.status === sessionStatuses.ACTIVE)) {
        return session;
      }
    }
    return null;
  }

  getAgentSessions(agentId) {
    const sessions = [];
    for (const session of this.sessions.values()) {
      if (session.agentId === agentId && session.status === sessionStatuses.ACTIVE) {
        sessions.push(session);
      }
    }
    return sessions;
  }

  getWaitingSessions() {
    const sessions = [];
    for (const session of this.sessions.values()) {
      if (session.status === sessionStatuses.WAITING) {
        sessions.push(session);
      }
    }
    return sessions;
  }

  getActiveSessions() {
    const sessions = [];
    for (const session of this.sessions.values()) {
      if (session.status === sessionStatuses.ACTIVE) {
        sessions.push(session);
      }
    }
    return sessions;
  }

  getClosedSessions() {
    const sessions = [];
    for (const session of this.sessions.values()) {
      if (session.status === sessionStatuses.CLOSED) {
        sessions.push(session);
      }
    }
    return sessions;
  }

  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  acceptSession(sessionId, agentId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    if (session.status !== sessionStatuses.WAITING) {
      return null;
    }

    session.agentId = agentId;
    session.status = sessionStatuses.ACTIVE;

    return session;
  }

  closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    session.status = sessionStatuses.CLOSED;
    session.closedAt = Date.now();

    return session;
  }

  updateLastMessage(sessionId, message, timestamp) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastMessage = message;
      session.lastMessageTime = timestamp || Date.now();
    }
    return session;
  }

  incrementUnreadCount(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.unreadCount = (session.unreadCount || 0) + 1;
      return session.unreadCount;
    }
    return 0;
  }

  resetUnreadCount(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.unreadCount = 0;
    }
  }

  updateSessionNotes(sessionId, notes) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.notes = notes || '';
      session.notesUpdatedAt = Date.now();
      this.saveToStorage();
      console.log(`[SessionService] 会话备注已保存: ${sessionId}`);
      return session;
    }
    return null;
  }

  sortSessions(sessions) {
    return sessions.sort((a, b) => {
      if (a.status === sessionStatuses.WAITING && b.status !== sessionStatuses.WAITING) {
        return -1;
      }
      if (a.status !== sessionStatuses.WAITING && b.status === sessionStatuses.WAITING) {
        return 1;
      }
      return b.lastMessageTime - a.lastMessageTime;
    });
  }
}

module.exports = new SessionService();
