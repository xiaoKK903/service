<template>
  <div class="admin-view">
    <header class="admin-header">
      <h1>人工客服工作台</h1>
      <div class="header-info">
        <span class="agent-status">在线客服</span>
        <span class="unread-count" v-if="totalUnreadCount > 0">
          未读消息: {{ totalUnreadCount }}
        </span>
        <span class="ws-status" :class="{ connected: isWebSocketConnected }">
          {{ isWebSocketConnected ? '已连接' : '未连接' }}
        </span>
      </div>
    </header>

    <main class="admin-main">
      <SessionList 
        :sessions="sessions"
        :selected-session-id="selectedSessionId"
        :waiting-count="waitingCount"
        :active-count="activeCount"
        :closed-count="closedCount"
        @select="handleSelectSession"
        @accept="handleAcceptSession"
      />
      
      <ChatWindow 
        :session="selectedSession"
        :messages="currentMessages"
        :is-sending="isSending"
        :can-send="canSendMessage"
        :quick-replies="quickReplies"
        @send="handleSendMessage"
        @close="handleCloseSession"
        @accept="handleAcceptSession"
        @open-quick-reply-manager="showQuickReplyManager = true"
      />
    </main>

    <QuickReplyManager 
      :visible="showQuickReplyManager"
      :quick-replies="quickReplies"
      @close="showQuickReplyManager = false"
      @create="handleCreateQuickReply"
      @update="handleUpdateQuickReply"
      @delete="handleDeleteQuickReply"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import SessionList from '../components/SessionList.vue';
import ChatWindow from '../components/ChatWindow.vue';
import QuickReplyManager from '../components/QuickReplyManager.vue';
import { useChatStore } from '../store';

const store = useChatStore();

const showQuickReplyManager = ref(false);

const sessions = computed(() => store.sessions.value);
const selectedSessionId = computed(() => store.selectedSessionId.value);
const selectedSession = computed(() => store.selectedSession.value);
const currentMessages = computed(() => store.currentMessages.value);
const totalUnreadCount = computed(() => store.totalUnreadCount.value);
const isSending = computed(() => store.isSending.value);
const canSendMessage = computed(() => store.canSendMessage.value);
const isWebSocketConnected = computed(() => store.isWebSocketConnected.value);
const quickReplies = computed(() => store.sortedQuickReplies.value);

const waitingCount = computed(() => store.waitingSessions.value.length);
const activeCount = computed(() => store.activeSessions.value.length);
const closedCount = computed(() => store.closedSessions.value.length);

async function handleSelectSession(sessionId) {
  await store.selectSession(sessionId);
}

async function handleAcceptSession(session) {
  const result = await store.acceptSession(session.id);
  if (result) {
    await store.selectSession(session.id);
  }
}

async function handleCloseSession(sessionId) {
  await store.closeSession(sessionId);
}

async function handleSendMessage(content) {
  store.setInputMessage(content);
  await store.sendMessage();
}

function handleCreateQuickReply(data) {
  console.log('AdminView handleCreateQuickReply:', data);
  store.createQuickReply(data);
}

function handleUpdateQuickReply(data) {
  console.log('AdminView handleUpdateQuickReply:', data);
  store.updateQuickReply(data);
}

function handleDeleteQuickReply(id) {
  console.log('AdminView handleDeleteQuickReply:', id);
  store.deleteQuickReply(id);
}

onMounted(() => {
  store.initialize();
});
</script>

<style scoped>
.admin-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: #667eea;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
}

.agent-status {
  padding: 4px 12px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

.unread-count {
  padding: 4px 12px;
  background-color: rgba(255, 77, 79, 0.9);
  border-radius: 12px;
}

.ws-status {
  padding: 4px 12px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

.ws-status.connected {
  background-color: rgba(82, 196, 26, 0.2);
}

.admin-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>
