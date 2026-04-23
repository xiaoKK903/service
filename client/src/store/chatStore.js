import { ref, computed } from 'vue';
import { createMessage, isFromMe, isFromServer, formatTime } from '../types/messageTypes';
import { mockMessages } from '../mocks/chatMocks';
import { useChatService } from '../services/chatService';

const messages = ref([]);
const isLoading = ref(false);
const isSending = ref(false);

export function useChatStore() {
  const { sendMessage } = useChatService();

  const sentMessages = computed(() => {
    return messages.value.filter(m => m.sender === 'user');
  });

  const receivedMessages = computed(() => {
    return messages.value.filter(m => m.sender === 'server');
  });

  const lastMessage = computed(() => {
    return messages.value.length > 0 ? messages.value[messages.value.length - 1] : null;
  });

  const hasMessages = computed(() => {
    return messages.value.length > 0;
  });

  function initializeStore() {
    messages.value = mockMessages.map(m => createMessage(m));
  }

  function addMessage(messageData) {
    const message = createMessage(messageData);
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

    isSending.value = true;
    
    const userMessage = addMessage({
      content: content.trim(),
      sender: 'user',
      type: 'text',
      status: 'sending'
    });

    try {
      updateMessage(userMessage.id, { status: 'sent' });
      
      const response = await sendMessage(content.trim());
      
      addMessage({
        content: response.message,
        sender: 'server',
        type: 'text',
        status: 'sent'
      });

      return response;
    } catch (error) {
      updateMessage(userMessage.id, { status: 'error' });
      console.error('发送消息失败:', error);
      return null;
    } finally {
      isSending.value = false;
    }
  }

  return {
    messages,
    isLoading,
    isSending,
    sentMessages,
    receivedMessages,
    lastMessage,
    hasMessages,
    initializeStore,
    addMessage,
    updateMessage,
    clearMessages,
    sendUserMessage,
    formatTime,
    isFromMe,
    isFromServer
  };
}

export default useChatStore;
