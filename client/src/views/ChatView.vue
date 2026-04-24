<template>
  <div class="chat-container">
    <header class="chat-header">
      <h1>智能客服</h1>
      <div class="header-info">
        <span class="connection-status" :class="{ connected: isConnected }">
          {{ isConnected ? '已连接' : '连接中...' }}
        </span>
        <span v-if="currentSession" class="session-status" :class="currentSession.status">
          {{ getStatusText(currentSession.status) }}
        </span>
        <span v-if="currentAgentStatus && currentSession && currentSession.status === 'active'" 
              class="agent-status" 
              :class="currentAgentStatus">
          <span class="status-dot" :class="currentAgentStatus"></span>
          {{ getAgentStatusText(currentAgentStatus) }}
        </span>
      </div>
    </header>

    <div class="message-list" ref="messageListRef">
      <div 
        v-for="message in messages" 
        :key="message.id"
        :class="['message-item', isFromMe(message.sender) ? 'from-me' : 'from-server', { recalled: message.recalled }]"
        @mouseenter="onMessageMouseEnter(message.id)"
        @mouseleave="onMessageMouseLeave(message.id)"
      >
        <div v-if="message.recalled" class="recalled-message">
          <span class="recalled-icon">📤</span>
          <span class="recalled-text">你撤回了一条消息</span>
          <span class="recalled-time">{{ formatTime(message.timestamp) }}</span>
        </div>
        
        <template v-else>
          <div class="message-sender">
            {{ isFromMe(message.sender) ? '我' : getSenderName(message.sender) }}
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          </div>
          <div class="message-content-wrapper">
            <div class="message-bubble">
              {{ message.content }}
            </div>
            <div 
              v-if="shouldShowRecallBtn(message)" 
              class="recall-btn"
              @click.stop="handleRecall(message)"
              @mouseenter="onBtnMouseEnter(message.id)"
              @mouseleave="onBtnMouseLeave(message.id)"
            >
              撤回
            </div>
          </div>
          <div v-if="isFromMe(message.sender)" class="message-status">
            {{ getMessageStatusText(message.status) }}
          </div>
        </template>
      </div>
      
      <div v-if="isSending" class="message-item from-me">
        <div class="message-sender">我</div>
        <div class="message-bubble">发送中...</div>
      </div>
      
      <div v-if="!isConnected" class="connecting-message">
        <p>正在连接客服，请稍候...</p>
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
          :disabled="!canInput"
        />
        <div class="char-count">{{ inputMessage.length }}/500</div>
      </div>
      <button 
        class="send-button"
        @click="handleSend"
        :disabled="!canSend"
      >
        {{ isSending ? '发送中' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useChatStore } from '../store/chatStore';
import { messageSenders, messageStatuses, sessionStatuses, formatTime } from '../types/messageTypes';

const chatStore = useChatStore();

const AGENT_STATUS_IDLE = 'idle';
const AGENT_STATUS_BUSY = 'busy';
const AGENT_STATUS_OFFLINE = 'offline';

const RECALL_WINDOW_MS = 2 * 60 * 1000;

const messages = computed(() => chatStore.messages.value);
const isSending = computed(() => chatStore.isSending.value);
const currentSession = computed(() => chatStore.currentSession.value);
const currentAgentStatus = computed(() => chatStore.currentAgentStatus.value);

const messageListRef = ref(null);
const inputMessage = ref('');

const hoveredMessageId = ref(null);
const btnHoveredMessageId = ref(null);

const isConnected = computed(() => {
  return chatStore.canSendMessage.value;
});

const canSend = computed(() => {
  return chatStore.canSendMessage.value && 
         inputMessage.value.trim() && 
         !isSending.value;
});

const canInput = computed(() => {
  return chatStore.canSendMessage.value && !isSending.value;
});

function isFromMe(sender) {
  return sender === messageSenders.USER;
}

function getSenderName(sender) {
  switch (sender) {
    case messageSenders.AGENT:
      return '客服';
    case messageSenders.SYSTEM:
      return '系统';
    default:
      return '客服';
  }
}

function getStatusText(status) {
  switch (status) {
    case sessionStatuses.WAITING:
      return '等待客服接入...';
    case sessionStatuses.ACTIVE:
      return '客服已接入';
    case sessionStatuses.CLOSED:
      return '会话已结束';
    default:
      return status;
  }
}

function getMessageStatusText(status) {
  switch (status) {
    case messageStatuses.PENDING:
      return '待发送';
    case messageStatuses.SENDING:
      return '发送中';
    case messageStatuses.SENT:
      return '已发送';
    case messageStatuses.DELIVERED:
      return '已送达';
    case messageStatuses.READ:
      return '已读';
    case messageStatuses.ERROR:
      return '发送失败';
    default:
      return '';
  }
}

function getAgentStatusText(status) {
  switch (status) {
    case AGENT_STATUS_IDLE:
      return '空闲';
    case AGENT_STATUS_BUSY:
      return '忙碌';
    case AGENT_STATUS_OFFLINE:
      return '离线';
    default:
      return '未知';
  }
}

function canRecallMessage(message) {
  if (message.recalled) return false;
  if (!isFromMe(message.sender)) return false;
  if (message.status === messageStatuses.READ) return false;
  
  const now = Date.now();
  const messageTime = message.timestamp || 0;
  const elapsed = now - messageTime;
  
  return elapsed <= RECALL_WINDOW_MS;
}

function shouldShowRecallBtn(message) {
  console.log('[ChatView] shouldShowRecallBtn, message:', message.id, 'canRecall:', canRecallMessage(message), 'hoveredId:', hoveredMessageId.value, 'btnHoveredId:', btnHoveredMessageId.value);
  if (!canRecallMessage(message)) return false;
  return hoveredMessageId.value === message.id || btnHoveredMessageId.value === message.id;
}

function onMessageMouseEnter(messageId) {
  console.log('[ChatView] onMessageMouseEnter:', messageId);
  hoveredMessageId.value = messageId;
}

function onMessageMouseLeave(messageId) {
  console.log('[ChatView] onMessageMouseLeave:', messageId, 'btnHovered:', btnHoveredMessageId.value);
  if (btnHoveredMessageId.value === messageId) return;
  hoveredMessageId.value = null;
}

function onBtnMouseEnter(messageId) {
  console.log('[ChatView] onBtnMouseEnter:', messageId);
  btnHoveredMessageId.value = messageId;
}

function onBtnMouseLeave(messageId) {
  console.log('[ChatView] onBtnMouseLeave:', messageId);
  btnHoveredMessageId.value = null;
  hoveredMessageId.value = null;
}

function handleRecall(message) {
  console.log('[ChatView] handleRecall 被点击了! message:', message);
  console.log('[ChatView] currentSession:', currentSession.value?.id);
  if (message && currentSession.value?.id) {
    chatStore.recallMessage(message.id, currentSession.value.id);
  }
}

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
  if (!canSend.value) return;

  inputMessage.value = '';
  scrollToBottom();
  
  await chatStore.sendUserMessage(trimmedMessage);
  
  scrollToBottom();
}

watch(messages, () => {
  scrollToBottom();
}, { deep: true });

onMounted(() => {
  chatStore.initializeStore();
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
  padding: 12px 16px;
  background-color: #667eea;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.header-info {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.connection-status {
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.connection-status.connected {
  background-color: rgba(82, 196, 26, 0.3);
}

.session-status {
  padding: 4px 8px;
  border-radius: 4px;
}

.session-status.waiting {
  background-color: rgba(250, 140, 22, 0.3);
}

.session-status.active {
  background-color: rgba(24, 144, 255, 0.3);
}

.session-status.closed {
  background-color: rgba(153, 153, 153, 0.3);
}

.agent-status {
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.agent-status.idle {
  background-color: rgba(82, 196, 26, 0.3);
}

.agent-status.busy {
  background-color: rgba(250, 140, 22, 0.3);
}

.agent-status.offline {
  background-color: rgba(255, 77, 79, 0.3);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.idle {
  background-color: #52c41a;
  box-shadow: 0 0 4px #52c41a;
}

.status-dot.busy {
  background-color: #faad14;
  box-shadow: 0 0 4px #faad14;
}

.status-dot.offline {
  background-color: #ff4d4f;
  box-shadow: 0 0 4px #ff4d4f;
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
  position: relative;
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

.message-item.from-me .message-sender {
  justify-content: flex-end;
}

.message-time {
  margin-left: 8px;
  font-size: 10px;
}

.message-content-wrapper {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.message-item.from-me .message-content-wrapper {
  float: right;
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

.message-status {
  font-size: 10px;
  color: #999;
  margin-top: 4px;
  text-align: right;
}

.recall-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  padding: 4px 10px;
  background-color: #ff4d4f;
  color: white;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  z-index: 10;
  white-space: nowrap;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(255, 77, 79, 0.3);
}

.message-item.from-me .recall-btn {
  right: 100%;
  margin-right: 8px;
}

.message-item.from-server .recall-btn {
  left: 100%;
  margin-left: 8px;
}

.recall-btn:hover {
  background-color: #ff7875;
}

.recalled-message {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  font-size: 12px;
  color: #999;
  font-style: italic;
}

.message-item.from-me .recalled-message {
  justify-content: flex-end;
}

.recalled-icon {
  margin-right: 6px;
  font-size: 14px;
}

.recalled-text {
  margin-right: 8px;
}

.recalled-time {
  font-size: 10px;
  color: #bbb;
}

.connecting-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #999;
  font-size: 14px;
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
