<template>
  <div 
    class="message-bubble" 
    :class="[messageClass, { 'from-me': isFromMe, recalled: message.recalled }]"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <div v-if="message.recalled" class="recalled-message">
      <span class="recalled-icon">📤</span>
      <span class="recalled-text">你撤回了一条消息</span>
      <span class="recalled-time">{{ formattedTime }}</span>
    </div>
    
    <template v-else>
      <div class="message-header">
        <span class="message-sender">{{ senderName }}</span>
        <span class="message-time">{{ formattedTime }}</span>
      </div>
      
      <div class="message-content-wrapper">
        <div class="message-content">{{ message.content }}</div>
        
        <div 
          v-if="showRecallBtn" 
          class="recall-btn"
          @click="handleRecall"
          @mouseenter="onBtnMouseEnter"
          @mouseleave="onBtnMouseLeave"
        >
          撤回
        </div>
      </div>
      
      <div v-if="showStatus" class="message-status">{{ statusText }}</div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { isFromAgent, isFromUser, isSystemMessage, formatTime } from '../types/messageTypes';

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  showStatus: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['recall']);

const showRecallBtn = ref(false);
const hoverTimer = ref(null);
const btnHovered = ref(false);

const RECALL_WINDOW_MS = 2 * 60 * 1000;

const messageClass = computed(() => {
  return {
    'from-agent': isFromAgent(props.message.sender),
    'from-user': isFromUser(props.message.sender),
    'from-system': isSystemMessage(props.message.sender)
  };
});

const isFromMe = computed(() => {
  return isFromAgent(props.message.sender);
});

const canRecall = computed(() => {
  console.log('[MessageBubble] canRecall check:', {
    recalled: props.message.recalled,
    isFromMe: isFromMe.value,
    status: props.message.status,
    timestamp: props.message.timestamp,
    sender: props.message.sender,
    messageId: props.message.id
  });
  
  if (props.message.recalled) {
    console.log('[MessageBubble] 消息已撤回，不能撤回');
    return false;
  }
  if (!isFromMe.value) {
    console.log('[MessageBubble] 不是自己的消息，不能撤回');
    return false;
  }
  if (props.message.status === 'read') {
    console.log('[MessageBubble] 消息已读，不能撤回');
    return false;
  }
  
  const now = Date.now();
  const messageTime = new Date(props.message.timestamp).getTime() || 0;
  const elapsed = now - messageTime;
  
  console.log('[MessageBubble] 时间检查:', {
    now,
    messageTime,
    elapsed,
    RECALL_WINDOW_MS
  });
  
  const result = elapsed <= RECALL_WINDOW_MS;
  console.log('[MessageBubble] canRecall 结果:', result);
  return result;
});

const senderName = computed(() => {
  if (isFromAgent(props.message.sender)) {
    return '我';
  }
  if (isFromUser(props.message.sender)) {
    return '客户';
  }
  return '系统';
});

const formattedTime = computed(() => {
  return formatTime(props.message.timestamp);
});

const statusText = computed(() => {
  if (!props.showStatus) return '';
  switch (props.message.status) {
    case 'pending':
      return '待发送';
    case 'sending':
      return '发送中';
    case 'sent':
      return '已发送';
    case 'delivered':
      return '已送达';
    case 'read':
      return '已读';
    case 'error':
      return '发送失败';
    default:
      return '';
  }
});

function onMouseEnter() {
  console.log('[MessageBubble] onMouseEnter, canRecall:', canRecall.value, 'message:', props.message.id, 'status:', props.message.status);
  if (!canRecall.value) return;
  clearTimeout(hoverTimer.value);
  showRecallBtn.value = true;
}

function onMouseLeave() {
  console.log('[MessageBubble] onMouseLeave, btnHovered:', btnHovered.value);
  if (btnHovered.value) return;
  hoverTimer.value = setTimeout(() => {
    showRecallBtn.value = false;
  }, 300);
}

function onBtnMouseEnter() {
  console.log('[MessageBubble] onBtnMouseEnter');
  clearTimeout(hoverTimer.value);
  btnHovered.value = true;
}

function onBtnMouseLeave() {
  console.log('[MessageBubble] onBtnMouseLeave');
  btnHovered.value = false;
  hoverTimer.value = setTimeout(() => {
    showRecallBtn.value = false;
  }, 300);
}

function handleRecall($event) {
  console.log('[MessageBubble] handleRecall 被点击了! message:', props.message.id);
  if ($event && $event.stopPropagation) {
    $event.stopPropagation();
  }
  console.log('[MessageBubble] 发出 recall 事件:', props.message);
  emit('recall', props.message);
}
</script>

<style scoped>
.message-bubble {
  margin-bottom: 16px;
  max-width: 80%;
  position: relative;
}

.message-bubble.from-agent {
  margin-left: auto;
}

.message-bubble.from-user {
  margin-right: auto;
}

.message-bubble.from-system {
  margin-left: auto;
  margin-right: auto;
  text-align: center;
  max-width: 100%;
}

.message-header {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.message-bubble.from-agent .message-header {
  justify-content: flex-end;
}

.message-bubble.from-system .message-header {
  justify-content: center;
}

.message-sender {
  font-weight: 500;
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

.message-bubble.from-agent .message-content-wrapper {
  float: right;
}

.message-content {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-bubble.from-agent .message-content {
  background-color: #667eea;
  color: white;
  border-bottom-right-radius: 4px;
}

.message-bubble.from-user .message-content {
  background-color: white;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-bubble.from-system .message-content {
  background-color: #f0f0f0;
  color: #666;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 6px;
  display: inline-block;
}

.message-status {
  font-size: 10px;
  color: #999;
  margin-top: 4px;
}

.message-bubble.from-agent .message-status {
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

.message-bubble.from-agent .recall-btn {
  right: 100%;
  margin-right: 8px;
}

.message-bubble.from-user .recall-btn {
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

.message-bubble.from-agent .recalled-message {
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
</style>
