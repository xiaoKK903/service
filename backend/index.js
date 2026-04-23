const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocketService = require('./services/websocketService');
const sessionService = require('./services/sessionService');
const messageService = require('./services/messageService');
const { sessionStatuses } = require('./utils/constants');

const app = express();
const server = http.createServer(app);
const PORT = 3001;

app.use(cors());
app.use(express.json());

WebSocketService.init(server);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/sessions', (req, res) => {
  const { agentId } = req.query;
  
  let sessions;
  if (agentId) {
    sessions = sessionService.getAgentSessions(agentId);
  } else {
    sessions = sessionService.getAllSessions();
  }
  
  sessions = sessionService.sortSessions(sessions);
  
  res.json({
    success: true,
    data: {
      sessions: sessions.map(s => s.toJSON()),
      waitingCount: sessionService.getWaitingSessions().length,
      activeCount: sessionService.getActiveSessions().length,
      closedCount: sessionService.getClosedSessions().length
    }
  });
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessionService.getSession(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      message: '会话不存在'
    });
  }
  
  res.json({
    success: true,
    data: session.toJSON()
  });
});

app.get('/api/sessions/:sessionId/messages', (req, res) => {
  const { sessionId } = req.params;
  const messages = messageService.getMessages(sessionId);
  
  res.json({
    success: true,
    data: {
      sessionId,
      messages: messages.map(m => m.toJSON())
    }
  });
});

app.post('/api/sessions/:sessionId/accept', (req, res) => {
  const { sessionId } = req.params;
  const { agentId } = req.body;
  
  if (!agentId) {
    return res.status(400).json({
      success: false,
      message: '缺少agentId'
    });
  }
  
  const session = sessionService.acceptSession(sessionId, agentId);
  
  if (!session) {
    return res.status(400).json({
      success: false,
      message: '会话不存在或无法接待'
    });
  }
  
  res.json({
    success: true,
    data: session.toJSON()
  });
});

app.post('/api/sessions/:sessionId/close', (req, res) => {
  const { sessionId } = req.params;
  const session = sessionService.closeSession(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      message: '会话不存在'
    });
  }
  
  res.json({
    success: true,
    data: session.toJSON()
  });
});

app.post('/api/hello', (req, res) => {
  const { message } = req.body;
  
  const responseMessage = `后端收到消息: ${message}`;
  
  res.json({ message: responseMessage });
});

server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('API端点:');
  console.log('  GET  http://localhost:3001/api/health');
  console.log('  GET  http://localhost:3001/api/sessions');
  console.log('  GET  http://localhost:3001/api/sessions/:sessionId');
  console.log('  GET  http://localhost:3001/api/sessions/:sessionId/messages');
  console.log('  POST http://localhost:3001/api/sessions/:sessionId/accept');
  console.log('  POST http://localhost:3001/api/sessions/:sessionId/close');
  console.log('  POST http://localhost:3001/api/hello');
  console.log('WebSocket服务已启动，支持实时通信');
});
