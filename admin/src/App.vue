<script setup>
import { ref } from 'vue'

// 模拟消息数据
const messages = ref([
  { id: 1, user: '客户', content: '你好，我有一个问题', time: '10:00' },
  { id: 2, user: '客服', content: '您好，请问有什么可以帮助您的？', time: '10:01' },
  { id: 3, user: '客户', content: '我的订单还没有收到', time: '10:02' }
])

const newMessage = ref('')

const sendMessage = () => {
  if (newMessage.value.trim()) {
    messages.value.push({
      id: Date.now(),
      user: '客服',
      content: newMessage.value,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    })
    newMessage.value = ''
  }
}

// 模拟用户列表
const users = ref([
  { id: 1, name: '客户1', status: '在线' },
  { id: 2, name: '客户2', status: '离线' },
  { id: 3, name: '客户3', status: '在线' }
])

const selectedUser = ref(users.value[0])
</script>

<template>
  <div class="admin-workspace">
    <header class="header">
      <h1>人工客服工作台</h1>
    </header>
    <div class="workspace">
      <!-- 用户列表 -->
      <div class="user-list">
        <h2>客户列表</h2>
        <ul>
          <li 
            v-for="user in users" 
            :key="user.id"
            :class="{ active: selectedUser.id === user.id }"
            @click="selectedUser = user"
          >
            <span class="user-name">{{ user.name }}</span>
            <span class="user-status" :class="user.status">{{ user.status }}</span>
          </li>
        </ul>
      </div>
      
      <!-- 聊天窗口 -->
      <div class="chat-window">
        <div class="chat-header">
          <h2>{{ selectedUser.name }}</h2>
          <span class="status" :class="selectedUser.status">{{ selectedUser.status }}</span>
        </div>
        <div class="message-list">
          <div 
            v-for="message in messages" 
            :key="message.id"
            :class="['message', message.user === '客服' ? 'admin' : 'user']"
          >
            <div class="message-header">
              <span class="message-user">{{ message.user }}</span>
              <span class="message-time">{{ message.time }}</span>
            </div>
            <div class="message-content">{{ message.content }}</div>
          </div>
        </div>
        <div class="message-input">
          <input 
            type="text" 
            v-model="newMessage" 
            placeholder="输入消息..."
            @keyup.enter="sendMessage"
          />
          <button @click="sendMessage">发送</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-workspace {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.workspace {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.user-list {
  width: 300px;
  background: white;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
}

.user-list h2 {
  padding: 1rem;
  margin: 0;
  border-bottom: 1px solid #e0e0e0;
  font-size: 1.1rem;
  color: #333;
}

.user-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.user-list li {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-list li:hover {
  background-color: #f5f5f5;
}

.user-list li.active {
  background-color: #e3f2fd;
  border-left: 4px solid #667eea;
}

.user-name {
  font-weight: 500;
  color: #333;
}

.user-status {
  float: right;
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 10px;
}

.user-status.在线 {
  background-color: #4caf50;
  color: white;
}

.user-status.离线 {
  background-color: #9e9e9e;
  color: white;
}

.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-header {
  padding: 1rem 2rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.status {
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 10px;
}

.status.在线 {
  background-color: #4caf50;
  color: white;
}

.status.离线 {
  background-color: #9e9e9e;
  color: white;
}

.message-list {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background-color: #f9f9f9;
}

.message {
  margin-bottom: 1rem;
  max-width: 80%;
}

.message.user {
  align-self: flex-start;
  margin-left: 1rem;
}

.message.admin {
  align-self: flex-end;
  margin-left: auto;
  margin-right: 1rem;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
}

.message-user {
  font-weight: 500;
  color: #666;
}

.message-time {
  color: #999;
}

.message-content {
  padding: 0.8rem 1rem;
  border-radius: 12px;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message.admin .message-content {
  background: #667eea;
  color: white;
}

.message-input {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 1rem;
}

.message-input input {
  flex: 1;
  padding: 0.8rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 1rem;
}

.message-input input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.message-input button {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.message-input button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

@media (max-width: 768px) {
  .user-list {
    width: 250px;
  }
  
  .message {
    max-width: 90%;
  }
}
</style>