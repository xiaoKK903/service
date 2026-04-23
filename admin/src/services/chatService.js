import { ref } from 'vue';
import { createMessage, messageTypes, messageSenders, messageStatuses } from '../types/messageTypes';

const isConnected = ref(false);
const connectionError = ref(null);
let webSocket = null;
let messageHandler = null;
let sessionHandler = null;

const API_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

export function useChatService() {
  function setMessageHandler(handler) {
    messageHandler = handler;
  }

  function setSessionHandler(handler) {
    sessionHandler = handler;
  }

  async function connectWebSocket(agentId) {
    try {
      const wsUrl = `${WS_URL}?agentId=${agentId}`;
      webSocket = new WebSocket(wsUrl);
      
      webSocket.onopen = () => {
        isConnected.value = true;
        connectionError.value = null;
        console.log('WebSocket连接成功');
        sendHeartbeat();
      };

      webSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message') {
            const message = createMessage(data.payload);
            if (messageHandler) {
              messageHandler(message);
            }
          } else if (data.type === 'session') {
            if (sessionHandler) {
              sessionHandler(data.payload);
            }
          }
        } catch (error) {
          console.error('解析WebSocket消息失败:', error);
        }
      };

      webSocket.onerror = (error) => {
        console.error('WebSocket连接错误:', error);
        connectionError.value = '连接失败，请稍后重试';
        isConnected.value = false;
      };

      webSocket.onclose = () => {
        console.log('WebSocket连接已关闭');
        isConnected.value = false;
      };
    } catch (error) {
      console.error('创建WebSocket连接失败:', error);
      connectionError.value = '连接失败，请稍后重试';
      isConnected.value = false;
    }
  }

  function disconnectWebSocket() {
    if (webSocket) {
      webSocket.close();
      webSocket = null;
    }
  }

  function sendHeartbeat() {
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify({ type: 'heartbeat' }));
      setTimeout(sendHeartbeat, 30000);
    }
  }

  function sendWebSocketMessage(message) {
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify({
        type: 'message',
        payload: message
      }));
      return true;
    }
    console.error('WebSocket未连接');
    return false;
  }

  async function getSessions(agentId) {
    try {
      const response = await fetch(`${API_URL}/api/sessions?agentId=${agentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取会话列表失败:', error);
      throw error;
    }
  }

  async function getSessionMessages(sessionId) {
    try {
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取会话消息失败:', error);
      throw error;
    }
  }

  async function sendMessageToSession(sessionId, content, agentId) {
    try {
      const message = createMessage({
        content,
        sender: messageSenders.AGENT,
        type: messageTypes.TEXT,
        status: messageStatuses.SENDING,
        sessionId,
        agentId
      });

      const response = await fetch(`${API_URL}/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('发送消息失败:', error);
      throw error;
    }
  }

  async function acceptSession(sessionId, agentId) {
    try {
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ agentId })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('接待会话失败:', error);
      throw error;
    }
  }

  async function closeSession(sessionId) {
    try {
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('关闭会话失败:', error);
      throw error;
    }
  }

  function isWebSocketConnected() {
    return isConnected.value;
  }

  function getConnectionError() {
    return connectionError.value;
  }

  return {
    isConnected,
    connectionError,
    setMessageHandler,
    setSessionHandler,
    connectWebSocket,
    disconnectWebSocket,
    sendWebSocketMessage,
    getSessions,
    getSessionMessages,
    sendMessageToSession,
    acceptSession,
    closeSession,
    isWebSocketConnected,
    getConnectionError
  };
}

export default useChatService;
