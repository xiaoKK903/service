import { ref, computed } from 'vue';
import { createMessage, createSession, sessionStatuses, messageTypes, messageSenders, messageStatuses } from '../types/messageTypes';
import { getMockSessions, getMockMessages, getAllMockMessages } from '../mocks/sessionMocks';

const sessions = ref([]);
const messages = ref({});
const currentAgent = ref(null);

export function useDataLayer() {
  const waitingSessions = computed(() => {
    return sessions.value.filter(s => s.status === sessionStatuses.WAITING);
  });

  const activeSessions = computed(() => {
    return sessions.value.filter(s => s.status === sessionStatuses.ACTIVE);
  });

  const closedSessions = computed(() => {
    return sessions.value.filter(s => s.status === sessionStatuses.CLOSED);
  });

  const totalUnreadCount = computed(() => {
    return sessions.value.reduce((total, session) => total + (session.unreadCount || 0), 0);
  });

  function initializeData(agentId) {
    currentAgent.value = agentId;
    sessions.value = getMockSessions();
    messages.value = getAllMockMessages();
  }

  function getSessionById(sessionId) {
    return sessions.value.find(s => s.id === sessionId);
  }

  function getMessagesBySessionId(sessionId) {
    return messages.value[sessionId] ? [...messages.value[sessionId]] : [];
  }

  function addSession(sessionData) {
    const session = createSession(sessionData);
    sessions.value.unshift(session);
    return session;
  }

  function updateSession(sessionId, updates) {
    const index = sessions.value.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions.value[index] = { ...sessions.value[index], ...updates };
      return sessions.value[index];
    }
    return null;
  }

  function removeSession(sessionId) {
    const index = sessions.value.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      return sessions.value.splice(index, 1)[0];
    }
    return null;
  }

  function addMessageToSession(sessionId, messageData) {
    const message = createMessage({ ...messageData, sessionId });
    
    if (!messages.value[sessionId]) {
      messages.value[sessionId] = [];
    }
    
    messages.value[sessionId].push(message);
    return message;
  }

  function updateMessage(sessionId, messageId, updates) {
    if (messages.value[sessionId]) {
      const index = messages.value[sessionId].findIndex(m => m.id === messageId);
      if (index !== -1) {
        messages.value[sessionId][index] = { ...messages.value[sessionId][index], ...updates };
        return messages.value[sessionId][index];
      }
    }
    return null;
  }

  function incrementUnreadCount(sessionId) {
    const session = getSessionById(sessionId);
    if (session) {
      session.unreadCount = (session.unreadCount || 0) + 1;
      return session.unreadCount;
    }
    return 0;
  }

  function resetUnreadCount(sessionId) {
    const session = getSessionById(sessionId);
    if (session) {
      session.unreadCount = 0;
    }
  }

  function updateLastMessage(sessionId, message, timestamp) {
    const session = getSessionById(sessionId);
    if (session) {
      session.lastMessage = message;
      session.lastMessageTime = timestamp || Date.now();
    }
  }

  function sortSessionsByTime() {
    sessions.value.sort((a, b) => {
      if (a.status === sessionStatuses.WAITING && b.status !== sessionStatuses.WAITING) {
        return -1;
      }
      if (a.status !== sessionStatuses.WAITING && b.status === sessionStatuses.WAITING) {
        return 1;
      }
      return b.lastMessageTime - a.lastMessageTime;
    });
  }

  return {
    sessions,
    messages,
    currentAgent,
    waitingSessions,
    activeSessions,
    closedSessions,
    totalUnreadCount,
    initializeData,
    getSessionById,
    getMessagesBySessionId,
    addSession,
    updateSession,
    removeSession,
    addMessageToSession,
    updateMessage,
    incrementUnreadCount,
    resetUnreadCount,
    updateLastMessage,
    sortSessionsByTime
  };
}

export default useDataLayer;
