import { ref, computed } from 'vue';
import { sessionStatuses, messageStatuses, messageSenders, messageTypes, agentStatuses } from '../types/messageTypes';
import { useChatData } from './chatData';
import { useChatService } from '../services/chatService';

const selectedSessionId = ref(null);
const isSending = ref(false);
const inputMessage = ref('');
const isInitialized = ref(false);
const quickReplies = ref([]);
const quickRepliesInitialized = ref(false);
const currentAgentStatus = ref(agentStatuses.IDLE);
const sensitiveWords = ref([]);
const sensitiveWordsInitialized = ref(false);

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

  const sortedQuickReplies = computed(() => {
    return [...quickReplies.value].sort((a, b) => a.sortOrder - b.sortOrder);
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

  function setupQuickReplyListeners() {
    chatService.on(WS_MESSAGE_TYPES.QUICK_REPLY_LIST_RESPONSE, (payload) => {
      console.log('收到快捷短语列表:', payload);
      if (payload && payload.quickReplies) {
        quickReplies.value = payload.quickReplies;
      }
    });

    chatService.on(WS_MESSAGE_TYPES.QUICK_REPLY_CREATED, (payload) => {
      console.log('快捷短语已创建:', payload);
      if (payload) {
        const exists = quickReplies.value.find(qr => qr.id === payload.id);
        if (!exists) {
          quickReplies.value.push(payload);
          quickReplies.value.sort((a, b) => a.sortOrder - b.sortOrder);
        }
      }
    });

    chatService.on(WS_MESSAGE_TYPES.QUICK_REPLY_UPDATED, (payload) => {
      console.log('快捷短语已更新:', payload);
      if (payload) {
        const index = quickReplies.value.findIndex(qr => qr.id === payload.id);
        if (index > -1) {
          quickReplies.value[index] = { ...quickReplies.value[index], ...payload };
          quickReplies.value.sort((a, b) => a.sortOrder - b.sortOrder);
        }
      }
    });

    chatService.on(WS_MESSAGE_TYPES.QUICK_REPLY_DELETED, (payload) => {
      console.log('快捷短语已删除:', payload);
      if (payload && payload.id) {
        const index = quickReplies.value.findIndex(qr => qr.id === payload.id);
        if (index > -1) {
          quickReplies.value.splice(index, 1);
        }
      }
    });
  }

  function setupWebSocketListeners() {
    setupQuickReplyListeners();

    chatService.on(WS_MESSAGE_TYPES.AUTH_SUCCESS, () => {
      console.log('认证成功，获取快捷短语列表...');
      if (!quickRepliesInitialized.value) {
        chatService.getQuickReplyList();
        quickRepliesInitialized.value = true;
      }
      console.log('认证成功，获取敏感词列表...');
      if (!sensitiveWordsInitialized.value) {
        chatService.getSensitiveWordList();
        sensitiveWordsInitialized.value = true;
      }
    });

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

    chatService.on(WS_MESSAGE_TYPES.BATCH_MESSAGE_READ_ACK, (payload) => {
      if (payload && payload.sessionId && payload.messageIds) {
        payload.messageIds.forEach(messageId => {
          dataLayer.updateMessage(payload.sessionId, messageId, {
            status: messageStatuses.READ
          });
        });
        console.log(`批量已读确认: ${payload.sessionId}, 数量: ${payload.count}`);
      }
    });

    chatService.on(WS_MESSAGE_TYPES.AGENT_STATUS_CHANGED, (payload) => {
      if (payload && payload.status) {
        currentAgentStatus.value = payload.status;
        console.log('客服状态变化:', payload);
      }
    });

    chatService.on(WS_MESSAGE_TYPES.MESSAGE_RECALLED, (payload) => {
      if (payload && payload.messageId && payload.sessionId) {
        console.log('[chatBusiness] 消息已撤回:', payload.messageId);
        dataLayer.updateMessage(payload.sessionId, payload.messageId, {
          recalled: true,
          recalledAt: payload.recalledAt
        });
      }
    });

    chatService.on(WS_MESSAGE_TYPES.MESSAGE_RECALL_FAILED, (payload) => {
      console.error('[chatBusiness] 撤回失败:', payload.reason);
    });

    chatService.on(WS_MESSAGE_TYPES.SENSITIVE_WORD_LIST_RESPONSE, (payload) => {
      console.log('[chatBusiness] 收到敏感词列表响应:', payload);
      if (payload && payload.words) {
        sensitiveWords.value = payload.words;
        console.log('[chatBusiness] 敏感词列表已更新，数量:', payload.words.length, '列表:', payload.words);
      }
    });

    chatService.on(WS_MESSAGE_TYPES.SENSITIVE_WORD_CREATED, (payload) => {
      console.log('[chatBusiness] 敏感词已创建:', payload);
      if (payload) {
        const exists = sensitiveWords.value.find(w => w.id === payload.id);
        if (!exists) {
          sensitiveWords.value.push(payload);
          sensitiveWords.value.sort((a, b) => a.sortOrder - b.sortOrder);
          console.log('[chatBusiness] 已添加新敏感词到列表');
        }
      }
    });

    chatService.on(WS_MESSAGE_TYPES.SENSITIVE_WORD_UPDATED, (payload) => {
      console.log('[chatBusiness] 敏感词已更新:', payload);
      if (payload) {
        const index = sensitiveWords.value.findIndex(w => w.id === payload.id);
        if (index > -1) {
          sensitiveWords.value[index] = { ...sensitiveWords.value[index], ...payload };
          sensitiveWords.value.sort((a, b) => a.sortOrder - b.sortOrder);
          console.log('[chatBusiness] 已更新敏感词');
        }
      }
    });

    chatService.on(WS_MESSAGE_TYPES.SENSITIVE_WORD_DELETED, (payload) => {
      console.log('[chatBusiness] 敏感词已删除:', payload);
      if (payload && payload.id) {
        const index = sensitiveWords.value.findIndex(w => w.id === payload.id);
        if (index > -1) {
          sensitiveWords.value.splice(index, 1);
          console.log('[chatBusiness] 已从列表移除敏感词');
        }
      }
    });

    chatService.on(WS_MESSAGE_TYPES.ERROR, (payload) => {
      console.error('[chatBusiness] WebSocket错误:', payload);
    });
  }

  async function selectSession(sessionId) {
    const previousSessionId = selectedSessionId.value;
    selectedSessionId.value = sessionId;
    console.log(`[chatBusiness] 选择会话: ${sessionId}`);
    
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
      
      console.log(`[chatBusiness] 调用 markAllMessagesAsRead: ${sessionId}`);
      const result = chatService.markAllMessagesAsRead(sessionId);
      console.log(`[chatBusiness] markAllMessagesAsRead 结果: ${result}`);
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

  function createQuickReply({ keyword, content, sortOrder }) {
    console.log('chatBusiness createQuickReply:', { keyword, content, sortOrder });
    return chatService.createQuickReply({ keyword, content, sortOrder });
  }

  function updateQuickReply({ id, keyword, content, sortOrder }) {
    console.log('chatBusiness updateQuickReply:', { id, keyword, content, sortOrder });
    return chatService.updateQuickReply({ id, keyword, content, sortOrder });
  }

  function deleteQuickReply(id) {
    console.log('chatBusiness deleteQuickReply:', id);
    return chatService.deleteQuickReply(id);
  }

  function updateAgentStatus(status) {
    console.log('chatBusiness updateAgentStatus:', status);
    return chatService.updateAgentStatus(status);
  }

  function recallMessage(messageId, sessionId) {
    console.log('chatBusiness recallMessage:', messageId, sessionId);
    return chatService.recallMessage(messageId, sessionId);
  }

  function getSensitiveWordList() {
    console.log('chatBusiness getSensitiveWordList');
    return chatService.getSensitiveWordList();
  }

  function createSensitiveWord({ word, category, sortOrder }) {
    console.log('chatBusiness createSensitiveWord:', { word, category, sortOrder });
    return chatService.createSensitiveWord({ word, category, sortOrder });
  }

  function updateSensitiveWord({ id, word, category, sortOrder }) {
    console.log('chatBusiness updateSensitiveWord:', { id, word, category, sortOrder });
    return chatService.updateSensitiveWord({ id, word, category, sortOrder });
  }

  function deleteSensitiveWord(id) {
    console.log('chatBusiness deleteSensitiveWord:', id);
    return chatService.deleteSensitiveWord(id);
  }

  return {
    selectedSessionId,
    selectedSession,
    currentMessages,
    isSending,
    inputMessage,
    canSendMessage,
    isInitialized,
    quickReplies,
    sortedQuickReplies,
    quickRepliesInitialized,
    currentAgentStatus,
    agentStatuses,
    sensitiveWords,
    initialize,
    selectSession,
    acceptSession,
    closeSession,
    sendMessage,
    handleIncomingMessage,
    handleSessionUpdate,
    setInputMessage,
    clearInputMessage,
    createQuickReply,
    updateQuickReply,
    deleteQuickReply,
    updateAgentStatus,
    recallMessage,
    getSensitiveWordList,
    createSensitiveWord,
    updateSensitiveWord,
    deleteSensitiveWord
  };
}

export default useChatBusiness;
