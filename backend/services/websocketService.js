const WebSocket = require('ws');
const { wsMessageTypes, clientTypes, messageSenders, messageStatuses, sessionStatuses, agentStatuses } = require('../utils/constants');
const sessionService = require('./sessionService');
const messageService = require('./messageService');
const quickReplyService = require('./quickReplyService');
const agentService = require('./agentService');
const queueService = require('./queueService');
const readReceiptService = require('./readReceiptService');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.userConnections = new Map();
    this.agentConnections = new Map();
    this.connectionToClient = new Map();
  }

  init(server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws, req) => {
      console.log('新的WebSocket连接');
      
      ws.on('message', (message) => {
        this.handleMessage(ws, message);
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket错误:', error);
      });
    });

    console.log('WebSocket服务已启动');
  }

  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      const { type, payload } = data;

      console.log('收到消息:', type);

      switch (type) {
        case wsMessageTypes.HEARTBEAT:
          this.send(ws, { type: wsMessageTypes.HEARTBEAT });
          break;
        
        case wsMessageTypes.AUTH:
          this.handleAuth(ws, payload);
          break;
        
        case wsMessageTypes.SESSION_CREATE:
          this.handleSessionCreate(ws, payload);
          break;
        
        case wsMessageTypes.SESSION_ACCEPT:
          this.handleSessionAccept(ws, payload);
          break;
        
        case wsMessageTypes.SESSION_CLOSE:
          this.handleSessionClose(ws, payload);
          break;
        
        case wsMessageTypes.MESSAGE_SEND:
          this.handleMessageSend(ws, payload);
          break;
        
        case wsMessageTypes.MESSAGE_HISTORY:
          this.handleMessageHistory(ws, payload);
          break;
        
        case wsMessageTypes.MESSAGE_READ:
          this.handleMessageRead(ws, payload);
          break;
        
        case wsMessageTypes.QUICK_REPLY_LIST:
          this.handleQuickReplyList(ws, payload);
          break;
        
        case wsMessageTypes.QUICK_REPLY_CREATE:
          this.handleQuickReplyCreate(ws, payload);
          break;
        
        case wsMessageTypes.QUICK_REPLY_UPDATE:
          this.handleQuickReplyUpdate(ws, payload);
          break;
        
        case wsMessageTypes.QUICK_REPLY_DELETE:
          this.handleQuickReplyDelete(ws, payload);
          break;
        
        case wsMessageTypes.AGENT_STATUS_UPDATE:
          this.handleAgentStatusUpdate(ws, payload);
          break;
        
        case wsMessageTypes.BATCH_MESSAGE_READ:
          this.handleBatchMessageRead(ws, payload);
          break;
        
        default:
          console.log('未知消息类型:', type);
      }
    } catch (error) {
      console.error('解析消息失败:', error);
      this.sendError(ws, '消息格式错误');
    }
  }

  handleAuth(ws, payload) {
    const { clientType, clientId, clientName } = payload;

    if (!clientType || !clientId) {
      this.send(ws, {
        type: wsMessageTypes.AUTH_FAILED,
        payload: { message: '缺少必要参数' }
      });
      return;
    }

    this.connectionToClient.set(ws, { clientType, clientId, clientName });

    if (clientType === clientTypes.USER) {
      if (!this.userConnections.has(clientId)) {
        this.userConnections.set(clientId, new Set());
      }
      this.userConnections.get(clientId).add(ws);
    } else if (clientType === clientTypes.AGENT) {
      if (!this.agentConnections.has(clientId)) {
        this.agentConnections.set(clientId, new Set());
      }
      this.agentConnections.get(clientId).add(ws);

      agentService.getOrCreateAgent(clientId, clientName);
      agentService.setAgentConnected(clientId, true);

      this.sendSessionList(ws);
      this.broadcastSessionsToAgents();

      const agent = agentService.getAgent(clientId);
      if (agent) {
        this.send(ws, {
          type: wsMessageTypes.AGENT_STATUS_CHANGED,
          payload: {
            agentId: clientId,
            status: agent.status
          }
        });
      }
    }

    this.send(ws, {
      type: wsMessageTypes.AUTH_SUCCESS,
      payload: { clientType, clientId, clientName }
    });

    console.log(`认证成功: ${clientType} - ${clientId}`);
  }

  handleSessionCreate(ws, payload) {
    const clientInfo = this.connectionToClient.get(ws);
    if (!clientInfo || clientInfo.clientType !== clientTypes.USER) {
      this.sendError(ws, '只有用户可以创建会话');
      return;
    }

    const { userName, userAvatar } = payload;

    let session = sessionService.getUserActiveSession(clientInfo.clientId);
    
    if (!session) {
      session = sessionService.createSession({
        userId: clientInfo.clientId,
        userName: userName || clientInfo.clientName,
        userAvatar
      });

      const systemMessage = messageService.createMessage({
        content: '您好，欢迎使用智能客服！正在为您转接人工客服...',
        sender: messageSenders.SYSTEM,
        sessionId: session.id,
        userId: clientInfo.clientId
      });

      sessionService.updateLastMessage(session.id, systemMessage.content, systemMessage.timestamp);
    }

    this.send(ws, {
      type: wsMessageTypes.SESSION_CREATED,
      payload: session.toJSON()
    });

    this.send(ws, {
      type: wsMessageTypes.MESSAGE_HISTORY,
      payload: {
        sessionId: session.id,
        messages: messageService.getMessages(session.id).map(m => m.toJSON())
      }
    });

    this.broadcastSessionsToAgents();

    if (session.status === sessionStatuses.WAITING) {
      console.log(`[WebSocketService] 会话 ${session.id} 处于等待状态，尝试分配客服...`);
      const bestAgent = queueService.getAvailableAgentForNewSession();
      if (bestAgent) {
        console.log(`[WebSocketService] 找到可用客服 ${bestAgent.id}，分配会话 ${session.id}`);
        this.assignSessionToAgent(session.id, bestAgent.id);
      } else {
        console.log(`[WebSocketService] 没有可用客服，会话 ${session.id} 进入排队`);
      }
    }

    console.log(`会话创建/获取: ${session.id}`);
  }

  handleSessionAccept(ws, payload) {
    const clientInfo = this.connectionToClient.get(ws);
    if (!clientInfo || clientInfo.clientType !== clientTypes.AGENT) {
      this.sendError(ws, '只有客服可以接待会话');
      return;
    }

    const { sessionId } = payload;
    const session = sessionService.acceptSession(sessionId, clientInfo.clientId);

    if (!session) {
      this.sendError(ws, '会话不存在或无法接待');
      return;
    }

    agentService.addSessionToAgent(clientInfo.clientId, sessionId);

    const systemMessage = messageService.createMessage({
      content: `客服已接入，请问有什么可以帮助您的？`,
      sender: messageSenders.SYSTEM,
      sessionId: session.id
    });

    sessionService.updateLastMessage(session.id, systemMessage.content, systemMessage.timestamp);

    this.send(ws, {
      type: wsMessageTypes.SESSION_ACCEPTED,
      payload: session.toJSON()
    });

    this.send(ws, {
      type: wsMessageTypes.MESSAGE_HISTORY,
      payload: {
        sessionId: session.id,
        messages: messageService.getMessages(session.id).map(m => m.toJSON())
      }
    });

    this.sendToUser(session.userId, {
      type: wsMessageTypes.SESSION_UPDATE,
      payload: session.toJSON()
    });

    this.sendToUser(session.userId, {
      type: wsMessageTypes.MESSAGE_RECEIVE,
      payload: systemMessage.toJSON()
    });

    this.broadcastSessionsToAgents();

    console.log(`会话已接待: ${sessionId} by ${clientInfo.clientId}`);
  }

  handleSessionClose(ws, payload) {
    const clientInfo = this.connectionToClient.get(ws);
    if (!clientInfo) {
      this.sendError(ws, '未认证');
      return;
    }

    const { sessionId } = payload;
    const session = sessionService.closeSession(sessionId);

    if (!session) {
      this.sendError(ws, '会话不存在');
      return;
    }

    const systemMessage = messageService.createMessage({
      content: '会话已结束',
      sender: messageSenders.SYSTEM,
      sessionId: session.id
    });

    this.send(ws, {
      type: wsMessageTypes.SESSION_CLOSED,
      payload: session.toJSON()
    });

    this.sendToUser(session.userId, {
      type: wsMessageTypes.SESSION_CLOSED,
      payload: session.toJSON()
    });

    this.sendToUser(session.userId, {
      type: wsMessageTypes.MESSAGE_RECEIVE,
      payload: systemMessage.toJSON()
    });

    if (session.agentId) {
      agentService.removeSessionFromAgent(session.agentId, sessionId);
      
      const agent = agentService.getAgent(session.agentId);
      if (agent && agent.activeSessions && agent.activeSessions.length === 0 && agent.status === agentStatuses.IDLE) {
        console.log(`[WebSocketService] 客服 ${session.agentId} 现在完全空闲，尝试分配等待中的会话`);
        this.tryAssignWaitingSessions();
      }

      this.sendToAgent(session.agentId, {
        type: wsMessageTypes.SESSION_UPDATE,
        payload: session.toJSON()
      });
    }

    this.broadcastSessionsToAgents();

    console.log(`会话已关闭: ${sessionId}`);
  }

  handleMessageSend(ws, payload) {
    const clientInfo = this.connectionToClient.get(ws);
    if (!clientInfo) {
      this.sendError(ws, '未认证');
      return;
    }

    const { sessionId, content } = payload;
    const session = sessionService.getSession(sessionId);

    if (!session) {
      this.sendError(ws, '会话不存在');
      return;
    }

    if (session.status === sessionStatuses.CLOSED) {
      this.sendError(ws, '会话已关闭');
      return;
    }

    const sender = clientInfo.clientType === clientTypes.USER ? messageSenders.USER : messageSenders.AGENT;
    
    const message = messageService.createMessage({
      content,
      sender,
      sessionId,
      agentId: session.agentId,
      userId: session.userId
    });

    messageService.markMessageAsSent(message.id, sessionId);

    sessionService.updateLastMessage(sessionId, content, message.timestamp);

    this.send(ws, {
      type: wsMessageTypes.MESSAGE_SENT,
      payload: message.toJSON()
    });

    if (clientInfo.clientType === clientTypes.USER && session.agentId) {
      const agentConnections = this.agentConnections.get(session.agentId);
      const agentIsConnected = agentConnections && agentConnections.size > 0;

      this.sendToAgent(session.agentId, {
        type: wsMessageTypes.MESSAGE_RECEIVE,
        payload: message.toJSON()
      });
      sessionService.incrementUnreadCount(sessionId);

      if (agentIsConnected) {
        messageService.markMessageAsDelivered(message.id, sessionId);
        this.send(ws, {
          type: wsMessageTypes.MESSAGE_DELIVERED,
          payload: {
            sessionId,
            messageId: message.id
          }
        });
      }
    } else if (clientInfo.clientType === clientTypes.AGENT && session.userId) {
      const userConnections = this.userConnections.get(session.userId);
      const userIsConnected = userConnections && userConnections.size > 0;

      this.sendToUser(session.userId, {
        type: wsMessageTypes.MESSAGE_RECEIVE,
        payload: message.toJSON()
      });

      if (userIsConnected) {
        messageService.markMessageAsDelivered(message.id, sessionId);
        this.send(ws, {
          type: wsMessageTypes.MESSAGE_DELIVERED,
          payload: {
            sessionId,
            messageId: message.id
          }
        });
      }
    }

    this.broadcastSessionsToAgents();

    console.log(`消息发送: ${sessionId} - ${sender} - ${content.substring(0, 20)}...`);
  }

  handleMessageHistory(ws, payload) {
    const { sessionId } = payload;
    const messages = messageService.getMessages(sessionId);

    this.send(ws, {
      type: wsMessageTypes.MESSAGE_HISTORY,
      payload: {
        sessionId,
        messages: messages.map(m => m.toJSON())
      }
    });
  }

  handleMessageRead(ws, payload) {
    const { sessionId, messageId } = payload;
    const message = messageService.markMessageAsRead(messageId, sessionId);

    if (message) {
      sessionService.resetUnreadCount(sessionId);
      
      if (message.sender === messageSenders.USER) {
        const session = sessionService.getSession(sessionId);
        if (session && session.agentId) {
          this.sendToAgent(session.agentId, {
            type: wsMessageTypes.MESSAGE_READ,
            payload: { sessionId, messageId }
          });
        }
      } else if (message.sender === messageSenders.AGENT) {
        const session = sessionService.getSession(sessionId);
        if (session && session.userId) {
          this.sendToUser(session.userId, {
            type: wsMessageTypes.MESSAGE_READ,
            payload: { sessionId, messageId }
          });
        }
      }
    }
  }

  handleDisconnect(ws) {
    const clientInfo = this.connectionToClient.get(ws);
    if (clientInfo) {
      if (clientInfo.clientType === clientTypes.USER) {
        const connections = this.userConnections.get(clientInfo.clientId);
        if (connections) {
          connections.delete(ws);
          if (connections.size === 0) {
            this.userConnections.delete(clientInfo.clientId);
          }
        }
      } else if (clientInfo.clientType === clientTypes.AGENT) {
        const connections = this.agentConnections.get(clientInfo.clientId);
        if (connections) {
          connections.delete(ws);
          if (connections.size === 0) {
            this.agentConnections.delete(clientInfo.clientId);
            agentService.setAgentConnected(clientInfo.clientId, false);

            this.broadcastAgentStatusChange(clientInfo.clientId, agentStatuses.OFFLINE);
          }
        }
      }
      
      this.connectionToClient.delete(ws);
      console.log(`连接断开: ${clientInfo.clientType} - ${clientInfo.clientId}`);
    }
  }

  send(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  sendError(ws, message) {
    this.send(ws, {
      type: wsMessageTypes.ERROR,
      payload: { message }
    });
  }

  sendToUser(userId, data) {
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.forEach(ws => this.send(ws, data));
    }
  }

  sendToAgent(agentId, data) {
    const connections = this.agentConnections.get(agentId);
    if (connections) {
      connections.forEach(ws => this.send(ws, data));
    }
  }

  sendSessionList(ws) {
    const sessions = sessionService.getAllSessions();
    const sortedSessions = sessionService.sortSessions(sessions);
    
    this.send(ws, {
      type: wsMessageTypes.SESSION_LIST,
      payload: {
        sessions: sortedSessions.map(s => s.toJSON())
      }
    });
  }

  broadcastSessionsToAgents() {
    const sessions = sessionService.getAllSessions();
    const sortedSessions = sessionService.sortSessions(sessions);
    
    const message = {
      type: wsMessageTypes.SESSION_LIST,
      payload: {
        sessions: sortedSessions.map(s => s.toJSON())
      }
    };

    this.agentConnections.forEach(connections => {
      connections.forEach(ws => this.send(ws, message));
    });
  }

  handleQuickReplyList(ws, payload) {
    console.log('handleQuickReplyList called, payload:', payload);
    const clientInfo = this.connectionToClient.get(ws);
    if (!clientInfo || clientInfo.clientType !== clientTypes.AGENT) {
      this.sendError(ws, '只有客服可以获取快捷短语');
      return;
    }

    const quickReplies = quickReplyService.getAllQuickReplies();
    console.log('handleQuickReplyList: sending quickReplies:', quickReplies);
    this.send(ws, {
      type: wsMessageTypes.QUICK_REPLY_LIST_RESPONSE,
      payload: {
        quickReplies: quickReplies.map(qr => qr.toJSON())
      }
    });
  }

  handleQuickReplyCreate(ws, payload) {
    console.log('handleQuickReplyCreate called, payload:', payload);
    const clientInfo = this.connectionToClient.get(ws);
    if (!clientInfo || clientInfo.clientType !== clientTypes.AGENT) {
      this.sendError(ws, '只有客服可以创建快捷短语');
      return;
    }

    const { keyword, content, sortOrder } = payload;
    if (!keyword || !content) {
      this.sendError(ws, '缺少必要参数');
      return;
    }

    const quickReply = quickReplyService.createQuickReply({ keyword, content, sortOrder });
    console.log('handleQuickReplyCreate: created quickReply:', quickReply);
    
    this.send(ws, {
      type: wsMessageTypes.QUICK_REPLY_CREATED,
      payload: quickReply.toJSON()
    });

    this.broadcastQuickRepliesToAgents();
  }

  handleQuickReplyUpdate(ws, payload) {
    const clientInfo = this.connectionToClient.get(ws);
    if (!clientInfo || clientInfo.clientType !== clientTypes.AGENT) {
      this.sendError(ws, '只有客服可以更新快捷短语');
      return;
    }

    const { id, keyword, content, sortOrder } = payload;
    if (!id) {
      this.sendError(ws, '缺少必要参数');
      return;
    }

    const quickReply = quickReplyService.updateQuickReply(id, { keyword, content, sortOrder });
    if (!quickReply) {
      this.sendError(ws, '快捷短语不存在');
      return;
    }

    this.send(ws, {
      type: wsMessageTypes.QUICK_REPLY_UPDATED,
      payload: quickReply.toJSON()
    });

    this.broadcastQuickRepliesToAgents();
  }

  handleQuickReplyDelete(ws, payload) {
    const clientInfo = this.connectionToClient.get(ws);
    if (!clientInfo || clientInfo.clientType !== clientTypes.AGENT) {
      this.sendError(ws, '只有客服可以删除快捷短语');
      return;
    }

    const { id } = payload;
    if (!id) {
      this.sendError(ws, '缺少必要参数');
      return;
    }

    const success = quickReplyService.deleteQuickReply(id);
    if (!success) {
      this.sendError(ws, '快捷短语不存在');
      return;
    }

    this.send(ws, {
      type: wsMessageTypes.QUICK_REPLY_DELETED,
      payload: { id }
    });

    this.broadcastQuickRepliesToAgents();
  }

  broadcastQuickRepliesToAgents() {
    const quickReplies = quickReplyService.getAllQuickReplies();
    const message = {
      type: wsMessageTypes.QUICK_REPLY_LIST_RESPONSE,
      payload: {
        quickReplies: quickReplies.map(qr => qr.toJSON())
      }
    };

    this.agentConnections.forEach(connections => {
      connections.forEach(ws => this.send(ws, message));
    });
  }

  handleAgentStatusUpdate(ws, payload) {
    const clientInfo = this.connectionToClient.get(ws);
    if (!clientInfo || clientInfo.clientType !== clientTypes.AGENT) {
      this.sendError(ws, '只有客服可以更新状态');
      return;
    }

    const { status } = payload;
    if (!status) {
      this.sendError(ws, '缺少状态参数');
      return;
    }

    const validStatuses = Object.values(agentStatuses);
    if (!validStatuses.includes(status)) {
      this.sendError(ws, '无效的状态值');
      return;
    }

    const agent = agentService.updateAgentStatus(clientInfo.clientId, status);
    if (!agent) {
      this.sendError(ws, '客服不存在');
      return;
    }

    this.send(ws, {
      type: wsMessageTypes.AGENT_STATUS_CHANGED,
      payload: {
        agentId: clientInfo.clientId,
        status: agent.status
      }
    });

    this.broadcastAgentStatusChange(clientInfo.clientId, agent.status);

    if (status === agentStatuses.IDLE) {
      this.tryAssignWaitingSessions();
    }

    console.log(`客服状态更新: ${clientInfo.clientId} -> ${status}`);
  }

  broadcastAgentStatusChange(agentId, status) {
    const sessions = sessionService.getAgentSessions(agentId);
    const message = {
      type: wsMessageTypes.AGENT_STATUS_CHANGED,
      payload: {
        agentId,
        status
      }
    };

    sessions.forEach(session => {
      this.sendToUser(session.userId, message);
    });

    this.agentConnections.forEach((connections, aid) => {
      if (aid !== agentId) {
        connections.forEach(ws => this.send(ws, message));
      }
    });
  }

  tryAssignWaitingSessions() {
    const waitingSessions = sessionService.getWaitingSessions();
    for (const session of waitingSessions) {
      const bestAgent = queueService.getAvailableAgentForNewSession();
      if (bestAgent) {
        this.assignSessionToAgent(session.id, bestAgent.id);
      } else {
        break;
      }
    }
  }

  assignSessionToAgent(sessionId, agentId) {
    const session = sessionService.acceptSession(sessionId, agentId);
    if (!session) {
      return null;
    }

    agentService.addSessionToAgent(agentId, sessionId);

    const systemMessage = messageService.createMessage({
      content: `客服已接入，请问有什么可以帮助您的？`,
      sender: messageSenders.SYSTEM,
      sessionId: session.id
    });

    sessionService.updateLastMessage(session.id, systemMessage.content, systemMessage.timestamp);

    this.sendToAgent(agentId, {
      type: wsMessageTypes.SESSION_ACCEPTED,
      payload: session.toJSON()
    });

    this.sendToAgent(agentId, {
      type: wsMessageTypes.MESSAGE_HISTORY,
      payload: {
        sessionId: session.id,
        messages: messageService.getMessages(session.id).map(m => m.toJSON())
      }
    });

    this.sendToUser(session.userId, {
      type: wsMessageTypes.SESSION_UPDATE,
      payload: session.toJSON()
    });

    this.sendToUser(session.userId, {
      type: wsMessageTypes.MESSAGE_RECEIVE,
      payload: systemMessage.toJSON()
    });

    this.broadcastSessionsToAgents();

    console.log(`会话自动分配: ${sessionId} to ${agentId}`);
    return session;
  }

  handleBatchMessageRead(ws, payload) {
    const clientInfo = this.connectionToClient.get(ws);
    if (!clientInfo) {
      this.sendError(ws, '未认证');
      return;
    }

    const { sessionId } = payload;
    if (!sessionId) {
      this.sendError(ws, '缺少必要参数');
      return;
    }

    const session = sessionService.getSession(sessionId);
    if (!session) {
      this.sendError(ws, '会话不存在');
      return;
    }

    if (clientInfo.clientType === clientTypes.AGENT) {
      const markedMessages = readReceiptService.markAllUserMessagesAsRead(sessionId);
      
      if (markedMessages.length > 0) {
        this.send(ws, {
          type: wsMessageTypes.BATCH_MESSAGE_READ_ACK,
          payload: {
            sessionId,
            messageIds: markedMessages.map(m => m.id),
            count: markedMessages.length
          }
        });

        if (session.userId) {
          markedMessages.forEach(message => {
            this.sendToUser(session.userId, {
              type: wsMessageTypes.MESSAGE_READ,
              payload: { sessionId, messageId: message.id }
            });
          });
        }
      }
    } else if (clientInfo.clientType === clientTypes.USER) {
      const markedMessages = readReceiptService.markAllAgentMessagesAsRead(sessionId);
      
      if (markedMessages.length > 0) {
        this.send(ws, {
          type: wsMessageTypes.BATCH_MESSAGE_READ_ACK,
          payload: {
            sessionId,
            messageIds: markedMessages.map(m => m.id),
            count: markedMessages.length
          }
        });

        if (session.agentId) {
          markedMessages.forEach(message => {
            this.sendToAgent(session.agentId, {
              type: wsMessageTypes.MESSAGE_READ,
              payload: { sessionId, messageId: message.id }
            });
          });
        }
      }
    }

    console.log(`批量已读: ${sessionId} by ${clientInfo.clientType}`);
  }
}

module.exports = new WebSocketService();
