<script setup>
import { ref } from 'vue'

const message = ref('')
const response = ref('')
const loading = ref(false)
const messages = ref([
  { id: 1, user: '系统', content: '您好，欢迎使用智能客服系统', time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }
])

const handleSubmit = async (e) => {
  e.preventDefault()
  if (!message.value.trim()) return
  
  // 添加用户消息到聊天记录
  messages.value.push({
    id: Date.now(),
    user: '我',
    content: message.value,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  })
  
  loading.value = true
  try {
    const res = await fetch('http://localhost:3001/api/hello', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: message.value })
    })
    const data = await res.json()
    response.value = data.message
    
    // 添加后端响应到聊天记录
    messages.value.push({
      id: Date.now() + 1,
      user: '客服',
      content: data.message,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    })
  } catch (error) {
    response.value = 'Error: 后端服务未启动'
    
    // 添加错误消息到聊天记录
    messages.value.push({
      id: Date.now() + 1,
      user: '系统',
      content: 'Error: 后端服务未启动',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    })
  } finally {
    loading.value = false
    message.value = ''
  }
}
</script>

<template>
  <div class="client-app">
    <header class="header">
      <h1>智能客服客户端</h1>
    </header>
    <div class="chat-container">
      <div class="message-list">
        <div 
          v-for="msg in messages" 
          :key="msg.id"
          :class="['message', msg.user === '我' ? 'user' : 'other']"
        >
          <div class="message-header">
            <span class="message-user">{{ msg.user }}</span>
            <span class="message-time">{{ msg.time }}</span>
          </div>
          <div class="message-content">{{ msg.content }}</div>
        </div>
      </div>
      <form class="message-form" @submit.prevent="handleSubmit">
        <input
          type="text"
          v-model="message"
          placeholder="请输入消息"
          required
          disabled="loading"
        />
        <button type="submit" :disabled="loading">
          {{ loading ? '发送中...' : '发送' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.client-app {
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

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  margin: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
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
  align-self: flex-end;
  margin-left: auto;
  margin-right: 1rem;
}

.message.other {
  align-self: flex-start;
  margin-left: 1rem;
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

.message.user .message-content {
  background: #667eea;
  color: white;
}

.message-form {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 1rem;
  background: white;
}

.message-form input {
  flex: 1;
  padding: 0.8rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 1rem;
}

.message-form input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.message-form button {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.message-form button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.message-form button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@media (max-width: 768px) {
  .chat-container {
    margin: 0.5rem;
  }
  
  .message {
    max-width: 90%;
  }
  
  .message-form {
    flex-direction: column;
  }
  
  .message-form input {
    width: 100%;
  }
  
  .message-form button {
    width: 100%;
  }
}
</style>