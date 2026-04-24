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
      <div class="chat-messages" ref="messagesContainerRef" @scroll="handleScroll">
        <div v-if="!session" class="empty-state">
          <p>请选择一个会话开始聊天</p>
        </div>

        <div v-else-if="displayedMessages.length === 0" class="empty-state">
          <p>暂无消息</p>
        </div>

        <div v-else>
          <div v-if="hasMoreMessages && !isLoadingMore" class="load-more-indicator" @click="loadMoreMessages">
            点击加载更多消息
          </div>
          <div v-if="isLoadingMore" class="loading-more-indicator">
            加载中...
          </div>
          
          <MessageBubble 
            v-for="message in displayedMessages" 
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
          <span class="notes-title">会话详情</span>
          <div class="notes-header-actions">
            <button 
              class="save-notes-btn"
              :disabled="!hasUnsavedChanges || isSavingNotes"
              @click="handleSaveNotes"
            >
              {{ isSavingNotes ? '保存中...' : '保存' }}
            </button>
            <button class="notes-close-btn" @click="toggleNotesPanel">×</button>
          </div>
        </div>
        
        <div v-if="session" class="visitor-info-section">
          <div class="section-title">访客来源</div>
          <div class="visitor-tags">
            <span 
              v-if="session.device" 
              class="visitor-tag"
              :style="{ backgroundColor: getDeviceColor(session.device) + '20', color: getDeviceColor(session.device), borderColor: getDeviceColor(session.device) + '40' }"
            >
              {{ getDeviceLabel(session.device) }}
            </span>
            <span v-if="session.browser" class="visitor-tag info-tag">
              {{ session.browser }}
            </span>
            <span v-if="session.os" class="visitor-tag info-tag">
              {{ session.os }}
            </span>
          </div>
          
          <div v-if="session.referrer" class="visitor-detail">
            <span class="detail-label">访问来源:</span>
            <span class="detail-value">{{ session.referrer }}</span>
          </div>
          
          <div v-if="session.ip" class="visitor-detail">
            <span class="detail-label">IP地址:</span>
            <span class="detail-value">{{ session.ip }}</span>
          </div>
          
          <div class="visitor-detail">
            <span class="detail-label">会话时间:</span>
            <span class="detail-value">{{ formatDate(session.createdAt) }}</span>
          </div>
        </div>
        
        <div class="notes-content">
          <div class="section-title">会话备注</div>
          <textarea 
            v-model="notesContent"
            placeholder="输入备注内容，点击保存按钮保存..."
            @input="handleNotesInput"
          ></textarea>
          <div class="notes-info">
            <span v-if="hasUnsavedChanges" class="unsaved-indicator">有未保存的更改</span>
            <span v-else-if="notesUpdatedAt">
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
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import MessageBubble from './MessageBubble.vue';
import QuickReplyPanel from './QuickReplyPanel.vue';
import EmojiPanel from './EmojiPanel.vue';
import { sessionStatuses } from '../types/messageTypes';
import { getDeviceLabel, getDeviceColor } from '../../../utils/userAgentParser';

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
const originalNotesContent = ref('');
const isSavingNotes = ref(false);

const PAGE_SIZE = 50;
const displayedMessageCount = ref(PAGE_SIZE);
const isLoadingMore = ref(false);
const hasMoreMessages = ref(false);
let scrollTopBeforeLoad = 0;
let scrollHeightBeforeLoad = 0;

const hasUnsavedChanges = computed(() => {
  return notesContent.value !== originalNotesContent.value;
});

const displayedMessages = computed(() => {
  const allMessages = props.messages || [];
  const totalCount = allMessages.length;
  
  hasMoreMessages.value = totalCount > displayedMessageCount.value;
  
  if (totalCount <= displayedMessageCount.value) {
    return allMessages;
  }
  
  const startIndex = totalCount - displayedMessageCount.value;
  return allMessages.slice(startIndex);
});

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
  displayedMessageCount.value = PAGE_SIZE;
  isLoadingMore.value = false;
  
  if (newSession) {
    notesContent.value = newSession.notes || '';
    notesUpdatedAt.value = newSession.notesUpdatedAt || null;
    originalNotesContent.value = newSession.notes || '';
  } else {
    notesContent.value = '';
    notesUpdatedAt.value = null;
    originalNotesContent.value = '';
  }
});

function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
}

function handleScroll(event) {
  const container = event.target;
  const { scrollTop, scrollHeight, clientHeight } = container;
  
  if (scrollTop <= 20 && hasMoreMessages.value && !isLoadingMore.value) {
    loadMoreMessages();
  }
}

function loadMoreMessages() {
  if (!hasMoreMessages.value || isLoadingMore.value) return;
  
  const container = messagesContainerRef.value;
  if (!container) return;
  
  scrollTopBeforeLoad = container.scrollTop;
  scrollHeightBeforeLoad = container.scrollHeight;
  
  isLoadingMore.value = true;
  
  nextTick(() => {
    const totalMessages = props.messages.length;
    const currentDisplayed = displayedMessageCount.value;
    
    const newDisplayedCount = Math.min(
      currentDisplayed + PAGE_SIZE,
      totalMessages
    );
    
    displayedMessageCount.value = newDisplayedCount;
    
    nextTick(() => {
      if (messagesContainerRef.value) {
        const newScrollHeight = messagesContainerRef.value.scrollHeight;
        const heightDiff = newScrollHeight - scrollHeightBeforeLoad;
        messagesContainerRef.value.scrollTop = scrollTopBeforeLoad + heightDiff;
      }
      
      isLoadingMore.value = false;
    });
  });
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
}

async function handleSaveNotes() {
  if (!hasUnsavedChanges.value || isSavingNotes.value) return;
  
  isSavingNotes.value = true;
  
  try {
    emit('notes-update', notesContent.value);
    originalNotesContent.value = notesContent.value;
    notesUpdatedAt.value = Date.now();
    console.log('[ChatWindow] 备注已保存');
  } catch (error) {
    console.error('[ChatWindow] 保存备注失败:', error);
  } finally {
    isSavingNotes.value = false;
  }
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

.notes-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.save-notes-btn {
  padding: 6px 12px;
  background-color: #667eea;
  color: white;
  border: 1px solid #667eea;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.save-notes-btn:hover:not(:disabled) {
  background-color: #5a67d8;
  border-color: #5a67d8;
}

.save-notes-btn:disabled {
  background-color: #c0c0c0;
  border-color: #c0c0c0;
  cursor: not-allowed;
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

.unsaved-indicator {
  color: #fa8c16;
  font-weight: 500;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.visitor-info-section {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fafafa;
}

.visitor-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.visitor-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 12px;
  border: 1px solid;
  font-weight: 500;
}

.visitor-tag.info-tag {
  background-color: #f0f0f0;
  color: #666;
  border-color: #e0e0e0;
}

.visitor-detail {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 12px;
}

.visitor-detail .detail-label {
  color: #999;
  flex-shrink: 0;
  min-width: 60px;
}

.visitor-detail .detail-value {
  color: #333;
  word-break: break-all;
  flex: 1;
}

.load-more-indicator {
  text-align: center;
  padding: 12px;
  color: #667eea;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-indicator:hover {
  color: #5a67d8;
  background-color: rgba(102, 126, 234, 0.05);
}

.loading-more-indicator {
  text-align: center;
  padding: 12px;
  color: #999;
  font-size: 12px;
}
</style>
