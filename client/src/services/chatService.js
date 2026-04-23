import { ref } from 'vue';

const isConnected = ref(false);
const connectionError = ref(null);
let webSocket = null;
let messageHandler = null;

const API_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

export function useChatService() {
  function setMessageHandler(handler) {
    messageHandler = handler;
  }

  async function connectWebSocket() {
    try {
      webSocket = new WebSocket(WS_URL);
      
      webSocket.onopen = () => {
        isConnected.value = true;
        connectionError.value = null;
        console.log('WebSocket连接成功');
      };

      webSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (messageHandler) {
            messageHandler(message);
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

  function sendWebSocketMessage(message) {
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify(message));
      return true;
    }
    console.error('WebSocket未连接');
    return false;
  }

  async function sendMessageToServer(content) {
    try {
      const response = await fetch(`${API_URL}/api/hello`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: content })
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

  async function sendMessage(content) {
    try {
      const response = await sendMessageToServer(content);
      return response;
    } catch (error) {
      throw new Error('发送消息失败');
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
    connectWebSocket,
    disconnectWebSocket,
    sendWebSocketMessage,
    sendMessageToServer,
    sendMessage,
    isWebSocketConnected,
    getConnectionError
  };
}

export default useChatService;
