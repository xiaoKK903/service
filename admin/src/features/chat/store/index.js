import { reactive, computed } from 'vue';
import { useChatData } from './chatData';
import { useChatBusiness } from './chatBusiness';
import { useChatService } from '../services/chatService';
import { sessionStatuses, messageTypes, messageSenders, messageStatuses, agentStatuses } from '../types/messageTypes';

const state = reactive({
  isInitialized: false,
  currentAgentId: 'agent-1',
  currentAgentName: '张客服',
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
  const quickReplies = computed(() => businessLayer.quickReplies.value);
  const sortedQuickReplies = computed(() => businessLayer.sortedQuickReplies.value);
  const currentAgentStatus = computed(() => businessLayer.currentAgentStatus.value);
  const sensitiveWords = computed(() => businessLayer.sensitiveWords.value);

  const constants = {
    sessionStatuses,
    messageTypes,
    messageSenders,
    messageStatuses,
    agentStatuses
  };

  async function initialize() {
    if (state.isInitialized) return;
    
    await businessLayer.initialize(state.currentAgentId, state.currentAgentName);

    state.isInitialized = true;
  }

  async function selectSession(sessionId) {
    state.selectedSessionId = sessionId;
    return businessLayer.selectSession(sessionId);
  }

  async function acceptSession(sessionId) {
    return businessLayer.acceptSession(sessionId);
  }

  async function closeSession(sessionId) {
    return businessLayer.closeSession(sessionId);
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

  function disconnectWebSocket() {
    chatService.disconnect();
  }

  function createQuickReply({ keyword, content, sortOrder }) {
    return businessLayer.createQuickReply({ keyword, content, sortOrder });
  }

  function updateQuickReply({ id, keyword, content, sortOrder }) {
    return businessLayer.updateQuickReply({ id, keyword, content, sortOrder });
  }

  function deleteQuickReply(id) {
    return businessLayer.deleteQuickReply(id);
  }

  function updateAgentStatus(status) {
    return businessLayer.updateAgentStatus(status);
  }

  function recallMessage(messageId, sessionId) {
    return businessLayer.recallMessage(messageId, sessionId);
  }

  function getSensitiveWordList() {
    return businessLayer.getSensitiveWordList();
  }

  function createSensitiveWord({ word, category, sortOrder }) {
    return businessLayer.createSensitiveWord({ word, category, sortOrder });
  }

  function updateSensitiveWord({ id, word, category, sortOrder }) {
    return businessLayer.updateSensitiveWord({ id, word, category, sortOrder });
  }

  function deleteSensitiveWord(id) {
    return businessLayer.deleteSensitiveWord(id);
  }

  function handleAgentTyping() {
    return businessLayer.handleAgentTyping();
  }

  function stopAgentTyping() {
    return businessLayer.stopAgentTyping();
  }

  function isUserTyping(sessionId) {
    return businessLayer.isUserTyping(sessionId);
  }

  function updateSessionNotes(sessionId, notes) {
    return businessLayer.updateSessionNotes(sessionId, notes);
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
    quickReplies,
    sortedQuickReplies,
    currentAgentStatus,
    sensitiveWords,
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
    disconnectWebSocket,
    createQuickReply,
    updateQuickReply,
    deleteQuickReply,
    updateAgentStatus,
    recallMessage,
    getSensitiveWordList,
    createSensitiveWord,
    updateSensitiveWord,
    deleteSensitiveWord,
    handleAgentTyping,
    stopAgentTyping,
    isUserTyping,
    updateSessionNotes
  };
}

export default useChatStore;
