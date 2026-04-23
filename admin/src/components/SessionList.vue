<template>
  <div class="session-list">
    <div class="session-tabs">
      <div 
        class="session-tab" 
        :class="{ active: activeTab === 'waiting' }"
        @click="activeTab = 'waiting'"
      >
        待接待
        <span v-if="waitingCount > 0" class="tab-badge">{{ waitingCount }}</span>
      </div>
      <div 
        class="session-tab" 
        :class="{ active: activeTab === 'active' }"
        @click="activeTab = 'active'"
      >
        接待中
      </div>
      <div 
        class="session-tab" 
        :class="{ active: activeTab === 'closed' }"
        @click="activeTab = 'closed'"
      >
        已关闭
      </div>
    </div>
    
    <div class="session-items">
      <div 
        v-for="session in currentTabSessions" 
        :key="session.id"
        class="session-item"
        :class="{ active: selectedSessionId === session.id }"
        @click="handleSessionClick(session)"
      >
        <div class="session-info">
          <div class="session-header">
            <span class="session-name">{{ session.userName }}</span>
            <span class="session-time">{{ formattedTime(session.lastMessageTime) }}</span>
          </div>
          <div class="session-preview">
            <span class="session-last-message">{{ truncateMessage(session.lastMessage) }}</span>
            <span 
              v-if="session.unreadCount > 0" 
              class="session-unread"
            >
              {{ session.unreadCount > 99 ? '99+' : session.unreadCount }}
            </span>
          </div>
        </div>
        
        <div class="session-status">
          <span class="status-badge" :class="session.status">
            {{ statusLabel(session.status) }}
          </span>
        </div>
      </div>
      
      <div v-if="currentTabSessions.length === 0" class="empty-state">
        <p>暂无会话</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { formatTime } from '../types/messageTypes';
import { sessionStatuses } from '../types/messageTypes';

const props = defineProps({
  sessions: {
    type: Array,
    default: () => []
  },
  selectedSessionId: {
    type: String,
    default: null
  },
  waitingCount: {
    type: Number,
    default: 0
  },
  activeCount: {
    type: Number,
    default: 0
  },
  closedCount: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['select', 'accept']);

const activeTab = ref('waiting');

const currentTabSessions = computed(() => {
  switch (activeTab.value) {
    case 'waiting':
      return props.sessions.filter(s => s.status === sessionStatuses.WAITING);
    case 'active':
      return props.sessions.filter(s => s.status === sessionStatuses.ACTIVE);
    case 'closed':
      return props.sessions.filter(s => s.status === sessionStatuses.CLOSED);
    default:
      return [];
  }
});

function formattedTime(timestamp) {
  return formatTime(timestamp);
}

function truncateMessage(message) {
  if (!message) return '';
  return message.length > 20 ? message.substring(0, 20) + '...' : message;
}

function statusLabel(status) {
  switch (status) {
    case sessionStatuses.WAITING:
      return '等待中';
    case sessionStatuses.ACTIVE:
      return '接待中';
    case sessionStatuses.TRANSFERRED:
      return '已转接';
    case sessionStatuses.CLOSED:
      return '已关闭';
    default:
      return status;
  }
}

function handleSessionClick(session) {
  if (session.status === sessionStatuses.WAITING) {
    emit('accept', session);
  } else {
    emit('select', session.id);
  }
}
</script>

<style scoped>
.session-list {
  width: 300px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.session-tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
}

.session-tab {
  flex: 1;
  padding: 12px 8px;
  text-align: center;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  position: relative;
  transition: all 0.2s;
}

.session-tab:hover {
  color: #667eea;
}

.session-tab.active {
  color: #667eea;
  font-weight: 500;
}

.session-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 2px;
  background-color: #667eea;
}

.tab-badge {
  background-color: #ff4d4f;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  margin-left: 4px;
}

.session-items {
  flex: 1;
  overflow-y: auto;
}

.session-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.session-item:hover {
  background-color: #f9f9f9;
}

.session-item.active {
  background-color: #e3f2fd;
  border-left: 4px solid #667eea;
}

.session-info {
  flex: 1;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.session-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.session-time {
  font-size: 11px;
  color: #999;
}

.session-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-last-message {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}

.session-unread {
  background-color: #ff4d4f;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
}

.session-status {
  margin-top: 6px;
}

.status-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 8px;
}

.status-badge.waiting {
  background-color: #fff7e6;
  color: #fa8c16;
}

.status-badge.active {
  background-color: #e6f7ff;
  color: #1890ff;
}

.status-badge.closed {
  background-color: #f5f5f5;
  color: #999;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>
