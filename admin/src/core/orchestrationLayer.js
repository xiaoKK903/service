import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useDataLayer } from './dataLayer';
import { useBusinessLayer } from './businessLayer';
import { useChatService } from '../services/chatService';

const isInitialized = ref(false);
const currentAgentId = ref('agent-1');

export function useOrchestrationLayer() {
  const dataLayer = useDataLayer();
  const businessLayer = useBusinessLayer();
  const chatService = useChatService();

  const sessions = computed(() => dataLayer.sessions);
  const messages = computed(() => dataLayer.messages);
  const waitingSessions = computed(() => dataLayer.waitingSessions);
  const activeSessions = computed(() => dataLayer.activeSessions);
  const closedSessions = computed(() => dataLayer.closedSessions);
  const totalUnreadCount = computed(() => dataLayer.totalUnreadCount);

  const selectedSession = computed(() => businessLayer.selectedSession);
  const selectedSessionId = computed(() => businessLayer.selectedSessionId);
  const currentMessages = computed(() => businessLayer.currentMessages);
  const isSending = computed(() => businessLayer.isSending);
  const inputMessage = computed(() => businessLayer.inputMessage);
  const canSendMessage = computed(() => businessLayer.canSendMessage);
  const isWebSocketConnected = computed(() => chatService.isConnected);

  async function initializeWorkspace(agentId) {
    if (isInitialized.value) return;

    currentAgentId.value = agentId;
    
    dataLayer.initializeData(agentId);
    dataLayer.sortSessionsByTime();

    chatService.setMessageHandler((message) => {
      businessLayer.handleIncomingMessage(message);
    });

    chatService.setSessionHandler((sessionData) => {
      businessLayer.handleSessionUpdate(sessionData);
    });

    try {
      await chatService.connectWebSocket(agentId);
    } catch (error) {
      console.error('WebSocket连接失败，使用模拟数据:', error);
    }

    isInitialized.value = true;
  }

  async function selectSession(sessionId) {
    return businessLayer.selectSession(sessionId);
  }

  async function acceptSession(sessionId) {
    const result = await businessLayer.acceptSession(sessionId, currentAgentId.value);
    
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
    if (isInitialized.value) {
      await chatService.connectWebSocket(currentAgentId.value);
    }
  }

  function disconnectWebSocket() {
    chatService.disconnectWebSocket();
  }

  onMounted(() => {
    initializeWorkspace(currentAgentId.value);
  });

  onUnmounted(() => {
    disconnectWebSocket();
    isInitialized.value = false;
  });

  return {
    isInitialized,
    currentAgentId,
    sessions,
    messages,
    waitingSessions,
    activeSessions,
    closedSessions,
    totalUnreadCount,
    selectedSession,
    selectedSessionId,
    currentMessages,
    isSending,
    inputMessage,
    canSendMessage,
    isWebSocketConnected,
    initializeWorkspace,
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

export default useOrchestrationLayer;
