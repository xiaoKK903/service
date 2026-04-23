import { reactive, computed } from 'vue';
import { useChatData } from './chatData';
import { useChatBusiness } from './chatBusiness';
import { useChatService } from '../services/chatService';
import { sessionStatuses, messageTypes, messageSenders, messageStatuses } from '../types/messageTypes';

const state = reactive({
  isInitialized: false,
  currentAgentId: 'agent-1',
  selectedSessionId: null
});

const getters = {
  isInitialized: computed(() => state.isInitialized),
  currentAgentId: computed(() => state.currentAgentId),
  selectedSessionId: computed(() => state.selectedSessionId)
};

export function useChatStore() {
  const dataLayer = useChatData();
  const businessLayer = useChatBusiness();
  const chatService = useChatService();

  const sessions = computed(() => dataLayer.sessions.value);
  const messages = computed(() => dataLayer.messages.value);
  const waitingSessions = computed(() => dataLayer.waitingSessions.value);
  const activeSessions = computed(() => dataLayer.activeSessions.value);
  const closedSessions = computed(() => dataLayer.closedSessions.value);
  const totalUnreadCount = computed(() => dataLayer.totalUnreadCount.value);

  const selectedSession = computed(() => businessLayer.selectedSession.value);
  const currentMessages = computed(() => businessLayer.currentMessages.value);
  const isSending = computed(() => businessLayer.isSending.value);
  const inputMessage = computed(() => businessLayer.inputMessage.value);
  const canSendMessage = computed(() => businessLayer.canSendMessage.value);
  const isWebSocketConnected = computed(() => chatService.isConnected.value);

  const constants = {
    sessionStatuses,
    messageTypes,
    messageSenders,
    messageStatuses
  };

  async function initialize() {
    if (state.isInitialized) return;
    
    dataLayer.initializeData(state.currentAgentId);
    
    chatService.setMessageHandler((message) => {
      businessLayer.handleIncomingMessage(message);
    });

    chatService.setSessionHandler((sessionData) => {
      businessLayer.handleSessionUpdate(sessionData);
    });

    try {
      await chatService.connectWebSocket(state.currentAgentId);
    } catch (error) {
      console.error('WebSocket连接失败，使用模拟数据:', error);
    }

    state.isInitialized = true;
  }

  async function selectSession(sessionId) {
    state.selectedSessionId = sessionId;
    return businessLayer.selectSession(sessionId);
  }

  async function acceptSession(sessionId) {
    const result = await businessLayer.acceptSession(sessionId, state.currentAgentId);
    dataLayer.sortSessionsByTime();
    return result;
  }

  async function closeSession(sessionId) {
    const result = await businessLayer.closeSession(sessionId);
    dataLayer.sortSessionsByTime();
    return result;
  }

  async function sendMessage() {
    if (!businessLayer.canSendMessage.value) return null;
    
    const content = businessLayer.inputMessage.value;
    businessLayer.clearInputMessage();
    
    return businessLayer.sendMessage(content);
  }

  function setInputMessage(value) {
    businessLayer.setInputMessage(value);
  }

  function clearInputMessage() {
    businessLayer.clearInputMessage();
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function getSessionById(sessionId) {
    return dataLayer.getSessionById(sessionId);
  }

  function getMessagesBySessionId(sessionId) {
    return dataLayer.getMessagesBySessionId(sessionId);
  }

  function refreshSessions() {
    dataLayer.sortSessionsByTime();
  }

  async function reconnectWebSocket() {
    if (state.isInitialized) {
      await chatService.connectWebSocket(state.currentAgentId);
    }
  }

  function disconnectWebSocket() {
    chatService.disconnectWebSocket();
  }

  return {
    state,
    getters,
    sessions,
    messages,
    waitingSessions,
    activeSessions,
    closedSessions,
    totalUnreadCount,
    selectedSession,
    selectedSessionId: getters.selectedSessionId,
    currentMessages,
    isSending,
    inputMessage,
    canSendMessage,
    isWebSocketConnected,
    constants,
    initialize,
    selectSession,
    acceptSession,
    closeSession,
    sendMessage,
    setInputMessage,
    clearInputMessage,
    handleKeyPress,
    getSessionById,
    getMessagesBySessionId,
    refreshSessions,
    reconnectWebSocket,
    disconnectWebSocket
  };
}

export default useChatStore;
