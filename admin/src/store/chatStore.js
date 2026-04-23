import { reactive, computed } from 'vue';
import { useDataLayer } from '../core/dataLayer';
import { useBusinessLayer } from '../core/businessLayer';
import { useOrchestrationLayer } from '../core/orchestrationLayer';
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
  const dataLayer = useDataLayer();
  const businessLayer = useBusinessLayer();
  const orchestrationLayer = useOrchestrationLayer();

  const sessions = computed(() => dataLayer.sessions);
  const messages = computed(() => dataLayer.messages);
  const waitingSessions = computed(() => dataLayer.waitingSessions);
  const activeSessions = computed(() => dataLayer.activeSessions);
  const closedSessions = computed(() => dataLayer.closedSessions);
  const totalUnreadCount = computed(() => dataLayer.totalUnreadCount);

  const selectedSession = computed(() => businessLayer.selectedSession);
  const currentMessages = computed(() => businessLayer.currentMessages);
  const isSending = computed(() => businessLayer.isSending);
  const inputMessage = computed(() => businessLayer.inputMessage);
  const canSendMessage = computed(() => businessLayer.canSendMessage);
  const isWebSocketConnected = computed(() => orchestrationLayer.isWebSocketConnected);

  const constants = {
    sessionStatuses,
    messageTypes,
    messageSenders,
    messageStatuses
  };

  async function initialize() {
    if (state.isInitialized) return;
    
    await orchestrationLayer.initializeWorkspace(state.currentAgentId);
    state.isInitialized = true;
  }

  async function selectSession(sessionId) {
    state.selectedSessionId = sessionId;
    return orchestrationLayer.selectSession(sessionId);
  }

  async function acceptSession(sessionId) {
    return orchestrationLayer.acceptSession(sessionId);
  }

  async function closeSession(sessionId) {
    return orchestrationLayer.closeSession(sessionId);
  }

  async function sendMessage() {
    return orchestrationLayer.sendMessage();
  }

  function setInputMessage(value) {
    orchestrationLayer.setInputMessage(value);
  }

  function clearInputMessage() {
    orchestrationLayer.clearInputMessage();
  }

  function handleKeyPress(event) {
    orchestrationLayer.handleKeyPress(event);
  }

  function getSessionById(sessionId) {
    return orchestrationLayer.getSessionById(sessionId);
  }

  function getMessagesBySessionId(sessionId) {
    return orchestrationLayer.getMessagesBySessionId(sessionId);
  }

  function refreshSessions() {
    orchestrationLayer.refreshSessions();
  }

  async function reconnectWebSocket() {
    return orchestrationLayer.reconnectWebSocket();
  }

  function disconnectWebSocket() {
    orchestrationLayer.disconnectWebSocket();
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
