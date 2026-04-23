import { ref } from 'vue';
import Message from '../models/message';

const messages = ref([]);
const isLoading = ref(false);
const mockHistory = [
  { id: '1', content: '您好，欢迎使用智能客服！请问有什么可以帮助您的？', sender: 'server', type: 'text', timestamp: Date.now() - 3600000, status: 'sent' },
  { id: '2', content: '你好，我想咨询一下我的订单', sender: 'user', type: 'text', timestamp: Date.now() - 3500000, status: 'sent' },
  { id: '3', content: '好的，请问您的订单号是多少呢？', sender: 'server', type: 'text', timestamp: Date.now() - 3400000, status: 'sent' },
  { id: '4', content: '我的订单号是1234567890', sender: 'user', type: 'text', timestamp: Date.now() - 3300000, status: 'sent' },
  { id: '5', content: '好的，我帮您查询一下...', sender: 'server', type: 'text', timestamp: Date.now() - 3200000, status: 'sent' },
  { id: '6', content: '查询到您的订单正在配送中，预计今天下午送达', sender: 'server', type: 'text', timestamp: Date.now() - 3100000, status: 'sent' },
  { id: '7', content: '太好了，谢谢！', sender: 'user', type: 'text', timestamp: Date.now() - 3000000, status: 'sent' },
  { id: '8', content: '不客气，还有其他问题吗？', sender: 'server', type: 'text', timestamp: Date.now() - 2900000, status: 'sent' }
];

export function useChatData() {
  function initializeMessages() {
    messages.value = mockHistory.map(item => Message.fromJSON(item));
  }

  function getMessages() {
    return messages;
  }

  function addMessage(messageData) {
    const message = new Message(messageData);
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

  function hasMessage() {
    return messages.value.length > 0;
  }

  function getLastMessage() {
    return messages.value.length > 0 ? messages.value[messages.value.length - 1] : null;
  }

  function getMessagesBySender(sender) {
    return messages.value.filter(m => m.sender === sender);
  }

  function getSentMessages() {
    return getMessagesBySender('user');
  }

  function getReceivedMessages() {
    return getMessagesBySender('server');
  }

  return {
    messages,
    isLoading,
    initializeMessages,
    getMessages,
    addMessage,
    updateMessage,
    clearMessages,
    hasMessage,
    getLastMessage,
    getMessagesBySender,
    getSentMessages,
    getReceivedMessages
  };
}

export default useChatData;
