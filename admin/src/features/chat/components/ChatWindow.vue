<template>
  <div class="chat-window">
    <div class="chat-header">
      <div class="chat-info">
        <span class="chat-name">{{ session?.userName || '选择会话' }}</span>
        <span class="chat-status" :class="session?.status">
          {{ statusLabel }}
        </span>
      </div>
      <div class="chat-actions">
        <button 
          v-if="session"
          class="action-btn"
          :class="{ active: showNotesPanel }"
          @click="toggleNotesPanel"
          title="会话备注"
        >
          备注
        </button>
        <button 
          v-if="session?.status === sessionStatuses.ACTIVE"
          class="action-btn"
          @click="handleCloseSession"
        >
          关闭会话
        </button>
        <button 
          v-else-if="session?.status === sessionStatuses.WAITING"
          class="action-btn primary"
          @click="handleAcceptSession"
        >
          接待
        </button>
      </div>
    </div>

    <div class="chat-main">
      <div class="chat-messages" ref="messagesContainerRef">
        <div v-if="!session" class="empty-state">
          <p>请选择一个会话开始聊天</p>
        </div>

        <div v-else-if="messages.length === 0" class="empty-state">
          <p>暂无消息</p>
        </div>

        <div v-else>
          <MessageBubble 
            v-for="message in messages" 
            :key="message.id"
            :message="message"
            :show-status="message.sender === 'agent'"
            @recall="handleMessageRecall"
          />
        </div>

        <div v-if="isUserTyping" class="typing-indicator">
          <span>用户正在输入</span>
          <span class="typing-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </span>
        </div>
      </div>

      <QuickReplyPanel 
        v-if="showQuickReplyPanel && !showEmojiPanel"
        :quick-replies="quickReplies"
        @select="handleQuickReplySelect"
        @open-manager="$emit('open-quick-reply-manager')"
      />

      <div v-if="showNotesPanel" class="notes-panel">
        <div class="notes-header">
          <span class="notes-title">会话备注</span>
          <button class="notes-close-btn" @click="toggleNotesPanel">×</button>
        </div>
        <div class="notes-content">
          <textarea 
            v-model="notesContent"
            placeholder="输入备注内容，实时保存..."
            @input="handleNotesInput"
          ></textarea>
          <div class="notes-info">
            <span v-if="notesUpdatedAt">
              最后更新: {{ formatDate(notesUpdatedAt) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="session && session.status !== sessionStatuses.CLOSED" class="chat-input-container">
      <EmojiPanel 
        v-if="showEmojiPanel"
        @select="handleEmojiSelect"
      />
      <div class="chat-input">
        <div class="input-wrapper">
          <input 
            ref="inputRef"
            type="text"
            v-model="inputValue"
            placeholder="输入消息..."
            :maxlength="500"
            :disabled="isSending"
            @keypress="handleKeyPress"
            @input="handleInput"
          />
          <div class="char-count">{{ inputValue.length }}/500</div>
        </div>
        <button 
          class="emoji-btn"
          @click="toggleEmojiPanel"
          :class="{ active: showEmojiPanel }"
          title="表情"
        >
          😀
        </button>
        <button 
          class="quick-reply-btn"
          @click="toggleQuickReplyPanel"
          :class="{ active: showQuickReplyPanel }"
          title="快捷短语"
        >
          短语
        </button>
        <button 
          class="send-btn"
          :disabled="!canSend"
          @click="handleSend"
        >
          {{ isSending ? '发送中' : '发送' }}
        </button>
      </div>
    </div>

    <div v-if="session?.status === sessionStatuses.CLOSED" class="chat-closed">
      <p>会话已关闭</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import MessageBubble from './MessageBubble.vue';
import QuickReplyPanel from './QuickReplyPanel.vue';
import EmojiPanel from './EmojiPanel.vue';
import { sessionStatuses } from '../types/messageTypes';

const props = defineProps({
  session: {
    type: Object,
    default: null
  },
  messages: {
    type: Array,
    default: () => []
  },
  isSending: {
    type: Boolean,
    default: false
  },
  canSend: {
    type: Boolean,
    default: false
  },
  quickReplies: {
    type: Array,
    default: () => []
  },
  isUserTyping: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'send', 
  'close', 
  'accept', 
  'open-quick-reply-manager', 
  'recall',
  'typing-start',
  'typing-stop',
  'notes-update'
]);

const inputValue = ref('');
const messagesContainerRef = ref(null);
const inputRef = ref(null);
const showQuickReplyPanel = ref(false);
const showEmojiPanel = ref(false);
const showNotesPanel = ref(false);
const notesContent = ref('');
const notesUpdatedAt = ref(null);
let notesDebounceTimer = null;

const statusLabel = computed(() => {
  if (!props.session) return '';
  switch (props.session.status) {
    case sessionStatuses.WAITING:
      return '等待中';
    case sessionStatuses.ACTIVE:
      return '接待中';
    case sessionStatuses.CLOSED:
      return '已关闭';
    default:
      return props.session.status;
  }
});

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainerRef.value) {
      messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight;
    }
  });
}

watch(() => props.messages, () => {
  scrollToBottom();
}, { deep: true });

watch(() => props.session, (newSession, oldSession) => {
  scrollToBottom();
  inputValue.value = '';
  
  if (newSession) {
    notesContent.value = newSession.notes || '';
    notesUpdatedAt.value = newSession.notesUpdatedAt || null;
  } else {
    notesContent.value = '';
    notesUpdatedAt.value = null;
  }
});

function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
}

function handleInput() {
  emit('typing-start');
}

function handleSend() {
  if (!props.canSend) return;
  emit('typing-stop');
  emit('send', inputValue.value);
  inputValue.value = '';
}

function handleCloseSession() {
  if (props.session) {
    emit('close', props.session.id);
  }
}

function handleAcceptSession() {
  if (props.session) {
    emit('accept', props.session.id);
  }
}

function toggleQuickReplyPanel() {
  showQuickReplyPanel.value = !showQuickReplyPanel.value;
  if (showQuickReplyPanel.value) {
    showEmojiPanel.value = false;
  }
}

function toggleEmojiPanel() {
  showEmojiPanel.value = !showEmojiPanel.value;
  if (showEmojiPanel.value) {
    showQuickReplyPanel.value = false;
  }
}

function handleQuickReplySelect(item) {
  if (item && item.content) {
    inputValue.value = item.content;
    showQuickReplyPanel.value = false;
    if (props.canSend) {
      handleSend();
    }
  }
}

function handleEmojiSelect(emoji) {
  if (emoji && emoji.code) {
    inputValue.value = inputValue.value + emoji.code;
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.focus();
      }
    });
  }
}

function handleMessageRecall(message) {
  emit('recall', message);
}

function toggleNotesPanel() {
  showNotesPanel.value = !showNotesPanel.value;
  if (showNotesPanel.value) {
    showQuickReplyPanel.value = false;
    showEmojiPanel.value = false;
  }
}

function handleNotesInput() {
  if (notesDebounceTimer) {
    clearTimeout(notesDebounceTimer);
  }
  
  notesDebounceTimer = setTimeout(() => {
    emit('notes-update', notesContent.value);
    notesUpdatedAt.value = Date.now();
  }, 500);
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped>
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fafafa;
}

.chat-info {
  display: flex;
  align-items: center;
}

.chat-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.chat-status {
  margin-left: 12px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 8px;
}

.chat-status.waiting {
  background-color: #fff7e6;
  color: #fa8c16;
}

.chat-status.active {
  background-color: #e6f7ff;
  color: #1890ff;
}

.chat-status.closed {
  background-color: #f5f5f5;
  color: #999;
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  background-color: white;
  color: #333;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.action-btn.primary {
  background-color: #667eea;
  border-color: #667eea;
  color: white;
}

.action-btn.primary:hover {
  background-color: #5a67d8;
}

.chat-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background-color: #f9f9f9;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}

.chat-input-container {
  background-color: white;
  border-top: 1px solid #e0e0e0;
}

.chat-input {
  padding: 12px 16px;
  display: flex;
  gap: 8px;
  align-items: center;
  background-color: white;
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

.emoji-btn {
  padding: 10px 14px;
  background-color: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 20px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.emoji-btn:hover {
  background-color: #e0e0e0;
  color: #333;
}

.emoji-btn.active {
  background-color: #667eea;
  color: white;
}

.emoji-btn.active:hover {
  background-color: #5a67d8;
}

.quick-reply-btn {
  padding: 10px 14px;
  background-color: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-reply-btn:hover {
  background-color: #e0e0e0;
  color: #333;
}

.quick-reply-btn.active {
  background-color: #667eea;
  color: white;
}

.quick-reply-btn.active:hover {
  background-color: #5a67d8;
}

.send-btn {
  padding: 10px 20px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-btn:hover:not(:disabled) {
  background-color: #5a67d8;
}

.send-btn:disabled {
  background-color: #c0c0c0;
  cursor: not-allowed;
}

.chat-closed {
  padding: 16px;
  text-align: center;
  border-top: 1px solid #e0e0e0;
  background-color: #fafafa;
  color: #999;
  font-size: 14px;
}

.action-btn.active {
  background-color: #667eea;
  border-color: #667eea;
  color: white;
}

.action-btn.active:hover {
  background-color: #5a67d8;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  color: #999;
  font-size: 12px;
}

.typing-dots {
  display: flex;
  gap: 2px;
}

.typing-dots .dot {
  width: 4px;
  height: 4px;
  background-color: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-2px);
    opacity: 1;
  }
}

.notes-panel {
  width: 300px;
  border-left: 1px solid #e0e0e0;
  background-color: white;
  display: flex;
  flex-direction: column;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fafafa;
}

.notes-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.notes-close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.notes-close-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.notes-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.notes-content textarea {
  flex: 1;
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  box-sizing: border-box;
  background-color: #fafafa;
  transition: border-color 0.2s;
}

.notes-content textarea:focus {
  border-color: #667eea;
  background-color: white;
}

.notes-content textarea::placeholder {
  color: #bbb;
}

.notes-info {
  margin-top: 8px;
  font-size: 11px;
  color: #999;
}
</style>
