import { ref, computed } from 'vue';
import { sessionStatuses, messageStatuses, messageSenders, messageTypes, createMessage } from '../types/messageTypes';
import { useChatData } from './chatData';
import { useChatService } from '../services/chatService';

const selectedSessionId = ref(null);
const isSending = ref(false);
const inputMessage = ref('');

export function useChatBusiness() {
  const dataLayer = useChatData();
  const chatService = useChatService();

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
           selectedSession.value.status !== sessionStatuses.CLOSED;
  });

  async function selectSession(sessionId) {
    const previousSessionId = selectedSessionId.value;
    selectedSessionId.value = sessionId;
    
    if (sessionId) {
      dataLayer.resetUnreadCount(sessionId);
    }
  }

  async function loadSessionMessages(sessionId) {
    try {
      const messages = await chatService.getSessionMessages(sessionId);
      return messages;
    } catch (error) {
      console.error('加载会话消息失败:', error);
      return dataLayer.getMessagesBySessionId(sessionId);
    }
  }

  async function acceptSession(sessionId, agentId) {
    try {
      const result = await chatService.acceptSession(sessionId, agentId);
      
      dataLayer.updateSession(sessionId, {
        status: sessionStatuses.ACTIVE,
        agentId
      });
      
      return result;
    } catch (error) {
      console.error('接待会话失败:', error);
      dataLayer.updateSession(sessionId, {
        status: sessionStatuses.ACTIVE,
        agentId
      });
      return { success: true, isMock: true };
    }
  }

  async function closeSession(sessionId) {
    try {
      const result = await chatService.closeSession(sessionId);
      
      dataLayer.updateSession(sessionId, {
        status: sessionStatuses.CLOSED,
        closedAt: Date.now()
      });
      
      if (selectedSessionId.value === sessionId) {
        selectedSessionId.value = null;
      }
      
      return result;
    } catch (error) {
      console.error('关闭会话失败:', error);
      dataLayer.updateSession(sessionId, {
        status: sessionStatuses.CLOSED,
        closedAt: Date.now()
      });
      
      if (selectedSessionId.value === sessionId) {
        selectedSessionId.value = null;
      }
      
      return { success: true, isMock: true };
    }
  }

  async function sendMessage(content) {
    if (!selectedSessionId.value) return null;
    if (!content.trim()) return null;
    if (content.length > 500) return null;
    if (isSending.value) return null;
    
    const session = dataLayer.getSessionById(selectedSessionId.value);
    if (!session || session.status === sessionStatuses.CLOSED) return null;

    isSending.value = true;
    
    const userMessage = dataLayer.addMessageToSession(
      selectedSessionId.value,
      {
        content: content.trim(),
        sender: messageSenders.AGENT,
        type: messageTypes.TEXT,
        status: messageStatuses.SENDING,
        agentId: dataLayer.currentAgent.value,
        userId: session.userId
      }
    );

    dataLayer.updateLastMessage(
      selectedSessionId.value,
      content.trim(),
      Date.now()
    );

    dataLayer.sortSessionsByTime();

    try {
      dataLayer.updateMessage(
        selectedSessionId.value,
        userMessage.id,
        { status: messageStatuses.SENT }
      );

      const result = await chatService.sendMessageToSession(
        selectedSessionId.value,
        content.trim(),
        dataLayer.currentAgent.value
      );

      return result;
    } catch (error) {
      console.error('发送消息失败:', error);
      
      dataLayer.updateMessage(
        selectedSessionId.value,
        userMessage.id,
        { status: messageStatuses.ERROR }
      );

      setTimeout(() => {
        const mockResponse = dataLayer.addMessageToSession(
          selectedSessionId.value,
          {
            content: `收到消息：${content.trim()}`,
            sender: messageSenders.USER,
            type: messageTypes.TEXT,
            status: messageStatuses.READ,
            userId: session.userId
          }
        );
        
        dataLayer.updateLastMessage(
          selectedSessionId.value,
          mockResponse.content,
          mockResponse.timestamp
        );
        
        dataLayer.sortSessionsByTime();
      }, 1000);

      return { success: true, isMock: true };
    } finally {
      isSending.value = false;
    }
  }

  function handleIncomingMessage(message) {
    if (!message.sessionId) return;

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

    dataLayer.sortSessionsByTime();
  }

  function handleSessionUpdate(sessionData) {
    const existingSession = dataLayer.getSessionById(sessionData.id);
    
    if (existingSession) {
      dataLayer.updateSession(sessionData.id, sessionData);
    } else {
      dataLayer.addSession(sessionData);
    }

    dataLayer.sortSessionsByTime();
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
    selectSession,
    loadSessionMessages,
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
