import { ref, computed, onUnmounted } from 'vue';
import { useChatService } from '../services/chatService';

const chatService = useChatService();
const { WS_MESSAGE_TYPES } = chatService;

const quickReplies = ref([]);
const isLoading = ref(false);
const isInitialized = ref(false);

let handlersSetup = false;

function setupEventHandlers() {
  if (handlersSetup) return;
  handlersSetup = true;

  chatService.on(WS_MESSAGE_TYPES.AUTH_SUCCESS, () => {
    if (!isInitialized.value) {
      chatService.getQuickReplyList();
      isInitialized.value = true;
    }
  });

  chatService.on(WS_MESSAGE_TYPES.QUICK_REPLY_LIST_RESPONSE, (payload) => {
    if (payload && payload.quickReplies) {
      quickReplies.value = payload.quickReplies;
    }
    isLoading.value = false;
  });

  chatService.on(WS_MESSAGE_TYPES.QUICK_REPLY_CREATED, (payload) => {
    if (payload) {
      const exists = quickReplies.value.find(qr => qr.id === payload.id);
      if (!exists) {
        quickReplies.value.push(payload);
        quickReplies.value.sort((a, b) => a.sortOrder - b.sortOrder);
      }
    }
  });

  chatService.on(WS_MESSAGE_TYPES.QUICK_REPLY_UPDATED, (payload) => {
    if (payload) {
      const index = quickReplies.value.findIndex(qr => qr.id === payload.id);
      if (index > -1) {
        quickReplies.value[index] = { ...quickReplies.value[index], ...payload };
        quickReplies.value.sort((a, b) => a.sortOrder - b.sortOrder);
      }
    }
  });

  chatService.on(WS_MESSAGE_TYPES.QUICK_REPLY_DELETED, (payload) => {
    if (payload && payload.id) {
      const index = quickReplies.value.findIndex(qr => qr.id === payload.id);
      if (index > -1) {
        quickReplies.value.splice(index, 1);
      }
    }
  });
}

function useQuickReplyStore() {
  setupEventHandlers();

  const sortedQuickReplies = computed(() => {
    return [...quickReplies.value].sort((a, b) => a.sortOrder - b.sortOrder);
  });

  function initialize() {
    setupEventHandlers();
    console.log('quickReplyStore initialize: isAuthenticated:', chatService.isAuthenticated.value);
    if (chatService.isAuthenticated.value && !isInitialized.value) {
      chatService.getQuickReplyList();
      isInitialized.value = true;
    }
  }

  function getQuickReplyById(id) {
    return quickReplies.value.find(qr => qr.id === id) || null;
  }

  function createQuickReply({ keyword, content, sortOrder }) {
    console.log('quickReplyStore createQuickReply:', { keyword, content, sortOrder });
    console.log('quickReplyStore chatService:', chatService);
    console.log('quickReplyStore chatService.send:', typeof chatService.send);
    console.log('quickReplyStore chatService.createQuickReply:', typeof chatService.createQuickReply);
    console.log('quickReplyStore isAuthenticated:', chatService.isAuthenticated.value);
    console.log('quickReplyStore isConnected:', chatService.isConnected.value);
    
    const result = chatService.createQuickReply({ keyword, content, sortOrder });
    console.log('quickReplyStore createQuickReply result:', result);
    return result;
  }

  function updateQuickReply({ id, keyword, content, sortOrder }) {
    console.log('quickReplyStore updateQuickReply:', { id, keyword, content, sortOrder });
    return chatService.updateQuickReply({ id, keyword, content, sortOrder });
  }

  function deleteQuickReply(id) {
    console.log('quickReplyStore deleteQuickReply:', id);
    return chatService.deleteQuickReply(id);
  }

  return {
    quickReplies,
    sortedQuickReplies,
    isLoading,
    isInitialized,
    initialize,
    getQuickReplyById,
    createQuickReply,
    updateQuickReply,
    deleteQuickReply
  };
}

export { useQuickReplyStore };
export default useQuickReplyStore;
