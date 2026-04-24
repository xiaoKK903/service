import { ref } from 'vue';

const WS_MESSAGE_TYPES = {
  HEARTBEAT: 'heartbeat',
  AUTH: 'auth',
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILED: 'auth_failed',
  
  SESSION_CREATE: 'session_create',
  SESSION_CREATED: 'session_created',
  SESSION_ACCEPT: 'session_accept',
  SESSION_ACCEPTED: 'session_accepted',
  SESSION_CLOSE: 'session_close',
  SESSION_CLOSED: 'session_closed',
  SESSION_UPDATE: 'session_update',
  
  MESSAGE_SEND: 'message_send',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_READ: 'message_read',
  MESSAGE_RECEIVE: 'message_receive',
  MESSAGE_HISTORY: 'message_history',
  
  AGENT_STATUS_UPDATE: 'agent_status_update',
  AGENT_STATUS_CHANGED: 'agent_status_changed',
  
  MESSAGE_RECALL: 'message_recall',
  MESSAGE_RECALLED: 'message_recalled',
  MESSAGE_RECALL_FAILED: 'message_recall_failed',
  
  ERROR: 'error'
};

const CLIENT_TYPES = {
  USER: 'user',
  AGENT: 'agent'
};

const isConnected = ref(false);
const isAuthenticated = ref(false);
const connectionError = ref(null);
let webSocket = null;
let messageHandlers = new Map();
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000;

const API_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

export function useChatService() {
  function on(event, handler) {
    if (!messageHandlers.has(event)) {
      messageHandlers.set(event, []);
    }
    messageHandlers.get(event).push(handler);
  }

  function off(event, handler) {
    if (messageHandlers.has(event)) {
      const handlers = messageHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  function emit(event, data) {
    if (messageHandlers.has(event)) {
      messageHandlers.get(event).forEach(handler => handler(data));
    }
  }

  function connect(userId, userName) {
    return new Promise((resolve, reject) => {
      if (webSocket && webSocket.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      try {
        webSocket = new WebSocket(WS_URL);
        
        webSocket.onopen = () => {
          console.log('WebSocket连接成功，开始认证...');
          isConnected.value = true;
          connectionError.value = null;
          reconnectAttempts = 0;
          
          send({
            type: WS_MESSAGE_TYPES.AUTH,
            payload: {
              clientType: CLIENT_TYPES.USER,
              clientId: userId,
              clientName: userName
            }
          });
          
          startHeartbeat();
        };

        const authSuccessHandler = (data) => {
          isAuthenticated.value = true;
          off(WS_MESSAGE_TYPES.AUTH_SUCCESS, authSuccessHandler);
          off(WS_MESSAGE_TYPES.AUTH_FAILED, authFailedHandler);
          console.log('认证成功:', data);
          resolve(data);
        };

        const authFailedHandler = (data) => {
          connectionError.value = data.message || '认证失败';
          off(WS_MESSAGE_TYPES.AUTH_SUCCESS, authSuccessHandler);
          off(WS_MESSAGE_TYPES.AUTH_FAILED, authFailedHandler);
          console.error('认证失败:', data);
          reject(data);
        };

        on(WS_MESSAGE_TYPES.AUTH_SUCCESS, authSuccessHandler);
        on(WS_MESSAGE_TYPES.AUTH_FAILED, authFailedHandler);

        webSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('收到WebSocket消息:', data.type);
            emit(data.type, data.payload);
          } catch (error) {
            console.error('解析WebSocket消息失败:', error);
          }
        };

        webSocket.onerror = (error) => {
          console.error('WebSocket连接错误:', error);
          connectionError.value = '连接失败，请稍后重试';
          isConnected.value = false;
          isAuthenticated.value = false;
        };

        webSocket.onclose = (event) => {
          console.log('WebSocket连接已关闭:', event.code);
          isConnected.value = false;
          isAuthenticated.value = false;
          
          if (!event.wasClean) {
            attemptReconnect(userId, userName);
          }
        };
      } catch (error) {
        console.error('创建WebSocket连接失败:', error);
        connectionError.value = '连接失败，请稍后重试';
        isConnected.value = false;
        reject(error);
      }
    });
  }

  function attemptReconnect(userId, userName) {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`尝试重连 (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      setTimeout(() => {
        connect(userId, userName).catch(() => {
          console.error('重连失败');
        });
      }, RECONNECT_INTERVAL);
    } else {
      console.error('重连次数已达上限，停止重连');
      connectionError.value = '连接失败，请刷新页面重试';
    }
  }

  function disconnect() {
    if (webSocket) {
      webSocket.close();
      webSocket = null;
    }
    isConnected.value = false;
    isAuthenticated.value = false;
  }

  let heartbeatInterval = null;
  function startHeartbeat() {
    stopHeartbeat();
    heartbeatInterval = setInterval(() => {
      if (webSocket && webSocket.readyState === WebSocket.OPEN) {
        send({ type: WS_MESSAGE_TYPES.HEARTBEAT });
      }
    }, 30000);
  }

  function stopHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  }

  function send(data) {
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify(data));
      return true;
    }
    console.error('WebSocket未连接');
    return false;
  }

  function createSession() {
    return send({
      type: WS_MESSAGE_TYPES.SESSION_CREATE,
      payload: {}
    });
  }

  function sendMessage(sessionId, content) {
    return send({
      type: WS_MESSAGE_TYPES.MESSAGE_SEND,
      payload: {
        sessionId,
        content
      }
    });
  }

  function closeSession(sessionId) {
    return send({
      type: WS_MESSAGE_TYPES.SESSION_CLOSE,
      payload: {
        sessionId
      }
    });
  }

  function markMessageAsRead(sessionId, messageId) {
    return send({
      type: WS_MESSAGE_TYPES.MESSAGE_READ,
      payload: {
        sessionId,
        messageId
      }
    });
  }

  function recallMessage(messageId, sessionId) {
    console.log('client chatService recallMessage:', messageId, sessionId);
    return send({
      type: WS_MESSAGE_TYPES.MESSAGE_RECALL,
      payload: {
        messageId,
        sessionId
      }
    });
  }

  return {
    isConnected,
    isAuthenticated,
    connectionError,
    WS_MESSAGE_TYPES,
    CLIENT_TYPES,
    connect,
    disconnect,
    send,
    on,
    off,
    emit,
    createSession,
    sendMessage,
    closeSession,
    markMessageAsRead,
    recallMessage
  };
}

export default useChatService;
