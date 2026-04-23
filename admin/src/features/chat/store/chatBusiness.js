import { ref, computed } from 'vue';
import { sessionStatuses, messageStatuses, messageSenders, messageTypes } from '../types/messageTypes';
import { useChatData } from './chatData';
import { useChatService } from '../services/chatService';

const selectedSessionId = ref(null);
const isSending = ref(false);
const inputMessage = ref('');
const isInitialized = ref(false);

export function useChatBusiness() {
  const dataLayer = useChatData();
  const chatService = useChatService();

  const { WS_MESSAGE_TYPES, CLIENT_TYPES } = chatService;

  const selectedSession = computed(() => {
    if (!selectedSessionId.value) return null;
    return dataLayer.getSessionById(selectedSessionId.value);
  });

  const currentMessages = computed(() => {
    if (!selectedSessionId.value) return [];
    return dataLayer.getMessagesBySessionId(selectedSessionId.value);
  });

  const canSendMessage = computed(() => {
    return !isSending.value && 
           inputMessage.value.trim() && 
           inputMessage.value.length <= 500 &&
           selectedSession.value && 
           selectedSession.value.status !== sessionStatuses.CLOSED &&
           chatService.isConnected.value &&
           chatService.isAuthenticated.value;
  });

  async function initialize(agentId, agentName) {
    if (isInitialized.value) return;

    dataLayer.initializeData(agentId);

    setupWebSocketListeners();

    try {
      await chatService.connect(CLIENT_TYPES.AGENT, agentId, agentName || '客服');
      isInitialized.value = true;
      console.log('客服端初始化成功');
    } catch (error) {
      console.error('客服端初始化失败:', error);
      throw error;
    }
  }

  function setupWebSocketListeners() {
    chatService.on(WS_MESSAGE_TYPES.SESSION_LIST, (payload) => {
      if (payload.sessions) {
        dataLayer.setSessions(payload.sessions);
        console.log('收到会话列表:', payload.sessions.length);
      }
    });

    chatService.on(WS_MESSAGE_TYPES.SESSION_UPDATE, (payload) => {
      if (payload.update) {
        dataLayer.updateSession(payload.update.id, payload.update);
      } else {
        dataLayer.updateSession(payload.id, payload);
      }
      console.log('会话更新:', payload);
    });

    chatService.on(WS_MESSAGE_TYPES.SESSION_ACCEPTED, (payload) => {
      dataLayer.updateSession(payload.id, payload);
      console.log('会话已接待:', payload);
    });

    chatService.on(WS_MESSAGE_TYPES.SESSION_CLOSED, (payload) => {
      dataLayer.updateSession(payload.id, payload);
      if (selectedSessionId.value === payload.id) {
        selectedSessionId.value = null;
      }
      console.log('会话已关闭:', payload);
    });

    chatService.on(WS_MESSAGE_TYPES.MESSAGE_HISTORY, (payload) => {
      if (payload.sessionId && payload.messages) {
        dataLayer.setSessionMessages(payload.sessionId, payload.messages);
        console.log('收到消息历史:', payload.messages.length);
      }
    });

    chatService.on(WS_MESSAGE_TYPES.MESSAGE_SENT, (payload) => {
      dataLayer.updateMessage(payload.sessionId, payload.id, {
        status: messageStatuses.SENT
      });
      console.log('消息已发送:', payload);
    });

    chatService.on(WS_MESSAGE_TYPES.MESSAGE_RECEIVE, (payload) => {
      handleIncomingMessage(payload);
    });

    chatService.on(WS_MESSAGE_TYPES.MESSAGE_DELIVERED, (payload) => {
      dataLayer.updateMessage(payload.sessionId, payload.messageId, {
        status: messageStatuses.DELIVERED
      });
    });

    chatService.on(WS_MESSAGE_TYPES.MESSAGE_READ, (payload) => {
      dataLayer.updateMessage(payload.sessionId, payload.messageId, {
        status: messageStatuses.READ
      });
    });

    chatService.on(WS_MESSAGE_TYPES.ERROR, (payload) => {
      console.error('WebSocket错误:', payload);
    });
  }

  async function selectSession(sessionId) {
    const previousSessionId = selectedSessionId.value;
    selectedSessionId.value = sessionId;
    
    if (sessionId) {
      dataLayer.resetUnreadCount(sessionId);
      
      const existingMessages = dataLayer.getMessagesBySessionId(sessionId);
      
      if (existingMessages.length === 0) {
        try {
          const response = await chatService.getSessionMessages(sessionId);
          if (response.data && response.data.messages) {
            dataLayer.setSessionMessages(sessionId, response.data.messages);
          }
        } catch (error) {
          console.error('加载会话消息失败:', error);
        }
      }
      
      const currentMessages = dataLayer.getMessagesBySessionId(sessionId);
      const lastUserMessage = currentMessages
        .filter(m => m.sender === messageSenders.USER && m.status !== messageStatuses.READ)
        .slice(-1)[0];
      
      if (lastUserMessage) {
        chatService.markMessageAsRead(sessionId, lastUserMessage.id);
      }
    }
  }

  async function acceptSession(sessionId) {
    const result = chatService.acceptSession(sessionId);
    if (result) {
      console.log('发送接待请求:', sessionId);
      return true;
    }
    return false;
  }

  async function closeSession(sessionId) {
    const result = chatService.closeSession(sessionId);
    if (result) {
      console.log('发送关闭请求:', sessionId);
      return true;
    }
    return false;
  }

  async function sendMessage(content) {
    if (!selectedSessionId.value) return null;
    if (!content.trim()) return null;
    if (content.length > 500) return null;
    if (isSending.value) return null;
    
    const session = dataLayer.getSessionById(selectedSessionId.value);
    if (!session || session.status === sessionStatuses.CLOSED) return null;

    isSending.value = true;
    
    const tempMessageId = `temp_${Date.now()}`;
    
    const userMessage = dataLayer.addMessageToSession(
      selectedSessionId.value,
      {
        id: tempMessageId,
        content: content.trim(),
        sender: messageSenders.AGENT,
        type: messageTypes.TEXT,
        status: messageStatuses.SENT,
        agentId: dataLayer.currentAgent.value,
        userId: session.userId,
        sessionId: selectedSessionId.value,
        timestamp: Date.now()
      }
    );

    dataLayer.updateLastMessage(
      selectedSessionId.value,
      content.trim(),
      Date.now()
    );

    const result = chatService.sendMessage(selectedSessionId.value, content.trim());

    if (!result) {
      dataLayer.updateMessage(
        selectedSessionId.value,
        tempMessageId,
        { status: messageStatuses.ERROR }
      );
    }

    isSending.value = false;
    return result;
  }

  function handleIncomingMessage(message) {
    if (!message.sessionId) return;

    const existingMessage = dataLayer.getMessagesBySessionId(message.sessionId)
      .find(m => m.id === message.id);
    
    if (existingMessage) {
      console.log('消息已存在，跳过:', message.id);
      return;
    }

    dataLayer.addMessageToSession(
      message.sessionId,
      message
    );

    dataLayer.updateLastMessage(
      message.sessionId,
      message.content,
      message.timestamp
    );

    if (message.sessionId !== selectedSessionId.value) {
      dataLayer.incrementUnreadCount(message.sessionId);
    }

    console.log('收到消息:', message);
  }

  function handleSessionUpdate(sessionData) {
    const existingSession = dataLayer.getSessionById(sessionData.id);
    
    if (existingSession) {
      dataLayer.updateSession(sessionData.id, sessionData);
    } else {
      dataLayer.addSession(sessionData);
    }

    console.log('会话更新:', sessionData);
  }

  function setInputMessage(value) {
    inputMessage.value = value;
  }

  function clearInputMessage() {
    inputMessage.value = '';
  }

  return {
    selectedSessionId,
    selectedSession,
    currentMessages,
    isSending,
    inputMessage,
    canSendMessage,
    isInitialized,
    initialize,
    selectSession,
    acceptSession,
    closeSession,
    sendMessage,
    handleIncomingMessage,
    handleSessionUpdate,
    setInputMessage,
    clearInputMessage
  };
}

export default useChatBusiness;
