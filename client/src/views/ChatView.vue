<template>
  <div class="chat-container">
    <header class="chat-header">
      <h1>智能客服</h1>
    </header>

    <div class="message-list" ref="messageListRef">
      <div 
        v-for="message in messages" 
        :key="message.id"
        :class="['message-item', isFromMe(message.sender) ? 'from-me' : 'from-server']"
      >
        <div class="message-sender">
          {{ isFromMe(message.sender) ? '我' : '客服' }}
          <span class="message-time">{{ formatTime(message.timestamp) }}</span>
        </div>
        <div class="message-bubble">
          {{ message.content }}
        </div>
      </div>
      
      <div v-if="isSending && !sending" class="message-item from-me">
        <div class="message-sender">我</div>
        <div class="message-bubble">发送中...</div>
      </div>
      
      <div v-if="sending" class="message-item from-server">
        <div class="message-sender">客服</div>
        <div class="message-bubble">正在输入...</div>
      </div>
    </div>

    <div class="input-container">
      <div class="input-wrapper">
        <input 
          type="text"
          v-model="inputMessage"
          placeholder="输入消息..."
          @keypress.enter.prevent="handleSend"
          :maxlength="500"
          :disabled="isSending"
        />
        <div class="char-count">{{ inputMessage.length }}/500</div>
      </div>
      <button 
        class="send-button"
        @click="handleSend"
        :disabled="isSending || !inputMessage.trim()"
      >
        {{ isSending ? '发送中' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { useChatStore } from '../store/chatStore';

const { 
  messages, 
  isSending, 
  initializeStore, 
  sendUserMessage,
  formatTime,
  isFromMe
} = useChatStore();

const messageListRef = ref(null);
const inputMessage = ref('');
const sending = ref(false);

function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
    }
  });
}

async function handleSend() {
  const trimmedMessage = inputMessage.value.trim();
  if (!trimmedMessage) return;
  if (trimmedMessage.length > 500) return;
  if (isSending.value) return;

  inputMessage.value = '';
  scrollToBottom();
  
  sending.value = true;
  await sendUserMessage(trimmedMessage);
  sending.value = false;
  
  scrollToBottom();
}

watch(messages, () => {
  scrollToBottom();
}, { deep: true });

onMounted(() => {
  initializeStore();
  scrollToBottom();
});
</script>

<style scoped>
.chat-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  max-width: 800px;
  margin: 0 auto;
}

.chat-header {
  padding: 16px;
  background-color: #667eea;
  color: white;
  text-align: center;
}

.chat-header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #f9f9f9;
}

.message-item {
  margin-bottom: 16px;
  max-width: 80%;
}

.message-item.from-me {
  margin-left: auto;
}

.message-item.from-server {
  margin-right: auto;
}

.message-sender {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.message-time {
  margin-left: 8px;
  font-size: 10px;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.from-me .message-bubble {
  background-color: #667eea;
  color: white;
  border-bottom-right-radius: 4px;
}

.from-server .message-bubble {
  background-color: white;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.input-container {
  padding: 16px;
  background-color: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 12px;
  align-items: center;
}

.input-wrapper {
  flex: 1;
  position: relative;
}

.input-wrapper input {
  width: 100%;
  padding: 10px 40px 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.input-wrapper input:focus {
  border-color: #667eea;
}

.input-wrapper input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.char-count {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: #999;
}

.send-button {
  padding: 10px 20px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-button:hover:not(:disabled) {
  background-color: #5a67d8;
}

.send-button:disabled {
  background-color: #c0c0c0;
  cursor: not-allowed;
}
</style>
