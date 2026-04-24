<template>
  <div 
    class="message-bubble-wrapper"
    :class="{ 'from-me': isFromMe, recalled: message.recalled }"
  >
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
        
        <div class="message-content-row">
          <div 
            v-if="showRecallBtn && isFromMe" 
            class="recall-btn"
            @click.stop="handleRecallClick"
            @mouseenter.stop="onBtnMouseEnter"
            @mouseleave.stop="onBtnMouseLeave"
          >
            撤回
          </div>
          
          <div class="message-content">{{ message.content }}</div>
        </div>
        
        <div v-if="showStatus" class="message-status">{{ statusText }}</div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
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
  if (props.message.recalled) return false;
  if (!isFromMe.value) return false;
  if (props.message.status === 'read') return false;
  
  const now = Date.now();
  const messageTime = new Date(props.message.timestamp).getTime() || 0;
  const elapsed = now - messageTime;
  
  return elapsed <= RECALL_WINDOW_MS;
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
  console.log('=== [MessageBubble] onMouseEnter ===');
  console.log('message.id:', props.message.id);
  console.log('message.sender:', props.message.sender);
  console.log('message.status:', props.message.status);
  console.log('message.timestamp:', props.message.timestamp);
  console.log('isFromMe:', isFromMe.value);
  console.log('canRecall:', canRecall.value);
  
  if (!canRecall.value) {
    console.log('=== 不能撤回，原因检查 ===');
    console.log('recalled:', props.message.recalled);
    console.log('status is read:', props.message.status === 'read');
    const now = Date.now();
    const messageTime = new Date(props.message.timestamp).getTime() || 0;
    const elapsed = now - messageTime;
    console.log('elapsed ms:', elapsed);
    console.log('RECALL_WINDOW_MS:', RECALL_WINDOW_MS);
    console.log('elapsed <= RECALL_WINDOW_MS:', elapsed <= RECALL_WINDOW_MS);
    return;
  }
  
  clearTimeout(hoverTimer.value);
  showRecallBtn.value = true;
  console.log('=== 显示撤回按钮 ===');
}

function onMouseLeave() {
  console.log('=== [MessageBubble] onMouseLeave ===');
  console.log('btnHovered:', btnHovered.value);
  
  if (btnHovered.value) {
    console.log('=== 鼠标在按钮上，不隐藏 ===');
    return;
  }
  
  hoverTimer.value = setTimeout(() => {
    showRecallBtn.value = false;
    console.log('=== 隐藏撤回按钮 ===');
  }, 300);
}

function onBtnMouseEnter() {
  console.log('=== [MessageBubble] onBtnMouseEnter ===');
  clearTimeout(hoverTimer.value);
  btnHovered.value = true;
  console.log('=== 鼠标在撤回按钮上 ===');
}

function onBtnMouseLeave() {
  console.log('=== [MessageBubble] onBtnMouseLeave ===');
  btnHovered.value = false;
  hoverTimer.value = setTimeout(() => {
    showRecallBtn.value = false;
    console.log('=== 鼠标离开按钮，隐藏 ===');
  }, 300);
}

function handleRecallClick() {
  console.log('========================================');
  console.log('=== [MessageBubble] 撤回按钮被点击了！ ===');
  console.log('========================================');
  console.log('message.id:', props.message.id);
  console.log('message:', props.message);
  
  alert('撤回按钮被点击了！message.id: ' + props.message.id);
  
  emit('recall', props.message);
  console.log('=== 已发出 recall 事件 ===');
}

onMounted(() => {
  console.log('=== [MessageBubble] 组件挂载 ===');
  console.log('message:', props.message);
});
</script>

<style scoped>
.message-bubble-wrapper {
  margin-bottom: 16px;
  max-width: 80%;
  clear: both;
}

.message-bubble-wrapper.from-me {
  margin-left: auto;
}

.message-bubble {
  position: relative;
}

.message-bubble.from-agent {
  text-align: right;
}

.message-bubble.from-user {
  text-align: left;
}

.message-bubble.from-system {
  text-align: center;
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

.message-content-row {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
}

.message-bubble.from-agent .message-content-row {
  flex-direction: row-reverse;
}

.message-content {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  max-width: 100%;
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
  padding: 6px 12px;
  background-color: #ff4d4f;
  color: white;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(255, 77, 79, 0.3);
  z-index: 100;
  margin-right: 8px;
  user-select: none;
  border: 1px solid #ff4d4f;
  font-weight: 500;
}

.message-bubble.from-agent .recall-btn {
  margin-right: 0;
  margin-left: 8px;
}

.recall-btn:hover {
  background-color: #ff7875;
  border-color: #ff7875;
}

.recall-btn:active {
  background-color: #d9363e;
  transform: scale(0.95);
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
