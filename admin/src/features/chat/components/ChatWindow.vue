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
      </div>

      <QuickReplyPanel 
        v-if="showQuickReplyPanel && !showEmojiPanel"
        :quick-replies="quickReplies"
        @select="handleQuickReplySelect"
        @open-manager="$emit('open-quick-reply-manager')"
      />

      <EmojiPanel 
        v-if="showEmojiPanel && !showQuickReplyPanel"
        @select="handleEmojiSelect"
      />
    </div>

    <div v-if="session && session.status !== sessionStatuses.CLOSED" class="chat-input-container">
      <div class="chat-input" :class="{ 'with-emoji-panel': showEmojiPanel }">
        <div class="input-wrapper">
          <input 
            ref="inputRef"
            type="text"
            v-model="inputValue"
            placeholder="输入消息..."
            :maxlength="500"
            :disabled="isSending"
            @keypress="handleKeyPress"
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
  }
});

const emit = defineEmits(['send', 'close', 'accept', 'open-quick-reply-manager', 'recall']);

const inputValue = ref('');
const messagesContainerRef = ref(null);
const inputRef = ref(null);
const showQuickReplyPanel = ref(false);
const showEmojiPanel = ref(false);

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

watch(() => props.session, () => {
  scrollToBottom();
  inputValue.value = '';
});

function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
}

function handleSend() {
  if (!props.canSend) return;
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
  border-top: 1px solid #e0e0e0;
}

.chat-input.with-emoji-panel {
  border-top: none;
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
</style>
