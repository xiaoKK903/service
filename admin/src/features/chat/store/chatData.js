import { ref, computed } from 'vue';
import { sessionStatuses } from '../types/messageTypes';

const sessions = ref([]);
const messages = ref({});
const currentAgent = ref(null);

export function useChatData() {
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
    sessions.value = [];
    messages.value = {};
  }

  function setSessions(sessionList) {
    sessions.value = sessionList;
    sortSessionsByTime();
  }

  function getSessionById(sessionId) {
    return sessions.value.find(s => s.id === sessionId);
  }

  function getMessagesBySessionId(sessionId) {
    return messages.value[sessionId] ? [...messages.value[sessionId]] : [];
  }

  function setSessionMessages(sessionId, messageList) {
    messages.value[sessionId] = messageList;
  }

  function addSession(sessionData) {
    const existingSession = getSessionById(sessionData.id);
    if (existingSession) {
      return updateSession(sessionData.id, sessionData);
    }
    sessions.value.unshift(sessionData);
    sortSessionsByTime();
    return sessionData;
  }

  function updateSession(sessionId, updates) {
    const index = sessions.value.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions.value[index] = { ...sessions.value[index], ...updates };
      sortSessionsByTime();
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
    if (!messages.value[sessionId]) {
      messages.value[sessionId] = [];
    }
    
    const existingMessage = messages.value[sessionId].find(m => m.id === messageData.id);
    if (existingMessage) {
      const index = messages.value[sessionId].indexOf(existingMessage);
      messages.value[sessionId][index] = { ...existingMessage, ...messageData };
      return messages.value[sessionId][index];
    }
    
    messages.value[sessionId].push(messageData);
    return messageData;
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
      sortSessionsByTime();
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
    setSessions,
    getSessionById,
    getMessagesBySessionId,
    setSessionMessages,
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

export default useChatData;
