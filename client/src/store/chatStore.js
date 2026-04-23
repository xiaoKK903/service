import { ref, computed, onUnmounted } from 'vue';
import { messageSenders, messageStatuses, messageTypes, agentStatuses } from '../types/messageTypes';
import { useChatService } from '../services/chatService';

const messages = ref([]);
const isLoading = ref(false);
const isSending = ref(false);
const currentSession = ref(null);
const isInitialized = ref(false);
const currentAgentStatus = ref(null);

const currentUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
const currentUserName = `用户${currentUserId.substr(-4)}`;

export function useChatStore() {
  const chatService = useChatService();
  const { WS_MESSAGE_TYPES } = chatService;

  const sentMessages = computed(() => {
    return messages.value.filter(m => m.sender === messageSenders.USER);
  });

  const receivedMessages = computed(() => {
    return messages.value.filter(m => m.sender === messageSenders.AGENT || m.sender === messageSenders.SYSTEM);
  });

  const lastMessage = computed(() => {
    return messages.value.length > 0 ? messages.value[messages.value.length - 1] : null;
  });

  const hasMessages = computed(() => {
    return messages.value.length > 0;
  });

  const canSendMessage = computed(() => {
    return !isSending.value && 
           chatService.isConnected.value &&
           chatService.isAuthenticated.value;
  });

  function setupWebSocketListeners() {
    chatService.on(WS_MESSAGE_TYPES.SESSION_CREATED, (payload) => {
      currentSession.value = payload;
      console.log('会话创建成功:', payload);
    });

    chatService.on(WS_MESSAGE_TYPES.SESSION_UPDATE, (payload) => {
      if (payload.update) {
        currentSession.value = payload.update;
      } else {
        currentSession.value = payload;
      }
      console.log('会话更新:', currentSession.value);
    });

    chatService.on(WS_MESSAGE_TYPES.SESSION_ACCEPTED, (payload) => {
      currentSession.value = payload;
      console.log('会话已被接待:', payload);
    });

    chatService.on(WS_MESSAGE_TYPES.SESSION_CLOSED, (payload) => {
      currentSession.value = payload;
      console.log('会话已关闭:', payload);
    });

    chatService.on(WS_MESSAGE_TYPES.MESSAGE_HISTORY, (payload) => {
      if (payload.sessionId && payload.messages) {
        messages.value = payload.messages;
        console.log('收到消息历史:', payload.messages.length);
      }
    });

    chatService.on(WS_MESSAGE_TYPES.MESSAGE_SENT, (payload) => {
      const tempId = payload.id;
      let index = messages.value.findIndex(m => m.id === tempId || m.id.startsWith('temp_'));
      
      if (index > -1) {
        if (messages.value[index].id.startsWith('temp_')) {
          messages.value[index] = {
            ...messages.value[index],
            id: payload.id,
            status: messageStatuses.SENT
          };
        } else {
          messages.value[index].status = messageStatuses.SENT;
        }
      } else {
        const existingMessage = messages.value.find(m => m.id === payload.id);
        if (!existingMessage) {
          messages.value.push({
            id: payload.id,
            content: payload.content,
            sender: payload.sender,
            type: payload.type || messageTypes.TEXT,
            timestamp: payload.timestamp || Date.now(),
            status: messageStatuses.SENT,
            sessionId: payload.sessionId
          });
        }
      }
      console.log('消息已发送:', payload);
    });

    chatService.on(WS_MESSAGE_TYPES.MESSAGE_RECEIVE, (payload) => {
      const existingMessage = messages.value.find(m => m.id === payload.id);
      if (!existingMessage) {
        messages.value.push(payload);
        
        if (payload.sender === messageSenders.AGENT && currentSession.value) {
          chatService.markMessageAsRead(currentSession.value.id, payload.id);
        }
      }
      console.log('收到消息:', payload);
    });

    chatService.on(WS_MESSAGE_TYPES.MESSAGE_DELIVERED, (payload) => {
      const index = messages.value.findIndex(m => m.id === payload.messageId);
      if (index > -1) {
        messages.value[index].status = messageStatuses.DELIVERED;
      }
    });

    chatService.on(WS_MESSAGE_TYPES.MESSAGE_READ, (payload) => {
      const index = messages.value.findIndex(m => m.id === payload.messageId);
      if (index > -1) {
        messages.value[index].status = messageStatuses.READ;
      }
    });

    chatService.on(WS_MESSAGE_TYPES.AGENT_STATUS_CHANGED, (payload) => {
      if (payload && payload.status) {
        currentAgentStatus.value = payload.status;
        console.log('客服状态变化:', payload);
      }
    });
  }

  async function initializeStore() {
    if (isInitialized.value) return;

    setupWebSocketListeners();

    try {
      await chatService.connect(currentUserId, currentUserName);
      
      const result = chatService.createSession();
      
      isInitialized.value = true;
      console.log('客户端初始化成功，用户ID:', currentUserId);
    } catch (error) {
      console.error('客户端初始化失败:', error);
    }
  }

  function addMessage(messageData) {
    const message = {
      id: messageData.id || Date.now().toString(),
      content: messageData.content,
      sender: messageData.sender,
      type: messageData.type || messageTypes.TEXT,
      timestamp: messageData.timestamp || Date.now(),
      status: messageData.status || messageStatuses.PENDING
    };
    
    messages.value.push(message);
    return message;
  }

  function updateMessage(id, updates) {
    const index = messages.value.findIndex(m => m.id === id);
    if (index !== -1) {
      messages.value[index] = { ...messages.value[index], ...updates };
    }
  }

  function clearMessages() {
    messages.value = [];
  }

  async function sendUserMessage(content) {
    if (isSending.value) return null;
    if (!content.trim()) return null;
    if (content.length > 500) return null;
    if (!currentSession.value) {
      console.error('没有活动会话');
      return null;
    }

    isSending.value = true;
    
    const tempMessageId = `temp_${Date.now()}`;
    
    const userMessage = addMessage({
      id: tempMessageId,
      content: content.trim(),
      sender: messageSenders.USER,
      type: messageTypes.TEXT,
      status: messageStatuses.SENT
    });

    const result = chatService.sendMessage(currentSession.value.id, content.trim());

    if (!result) {
      updateMessage(tempMessageId, { status: messageStatuses.ERROR });
    }

    isSending.value = false;
    return result;
  }

  function disconnect() {
    chatService.disconnect();
  }

  onUnmounted(() => {
    disconnect();
  });

  return {
    messages,
    isLoading,
    isSending,
    currentSession,
    currentAgentStatus,
    currentUserId,
    currentUserName,
    sentMessages,
    receivedMessages,
    lastMessage,
    hasMessages,
    canSendMessage,
    isInitialized,
    agentStatuses,
    initializeStore,
    addMessage,
    updateMessage,
    clearMessages,
    sendUserMessage,
    disconnect
  };
}

export default useChatStore;
