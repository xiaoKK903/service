<template>
  <div class="message-bubble" :class="messageClass">
    <div class="message-header">
      <span class="message-sender">{{ senderName }}</span>
      <span class="message-time">{{ formattedTime }}</span>
    </div>
    <div class="message-content">{{ message.content }}</div>
    <div v-if="showStatus" class="message-status">{{ statusText }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
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

const messageClass = computed(() => {
  return {
    'from-agent': isFromAgent(props.message.sender),
    'from-user': isFromUser(props.message.sender),
    'from-system': isSystemMessage(props.message.sender)
  };
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
</script>

<style scoped>
.message-bubble {
  margin-bottom: 16px;
  max-width: 80%;
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
</style>
