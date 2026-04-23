import { createMessage, createSession, messageTypes, messageSenders, messageStatuses, sessionStatuses } from './messageTypes';

export const mockAgents = [
  { id: 'agent-1', name: '张客服', avatar: null, status: 'online' },
  { id: 'agent-2', name: '李客服', avatar: null, status: 'online' },
  { id: 'agent-3', name: '王客服', avatar: null, status: 'offline' }
];

export const mockUsers = [
  { id: 'user-1', name: '张三', avatar: null },
  { id: 'user-2', name: '李四', avatar: null },
  { id: 'user-3', name: '王五', avatar: null },
  { id: 'user-4', name: '赵六', avatar: null },
  { id: 'user-5', name: '孙七', avatar: null }
];

export const mockSessions = [
  createSession({
    id: 'session-1',
    userId: 'user-1',
    userName: '张三',
    agentId: 'agent-1',
    status: sessionStatuses.ACTIVE,
    lastMessage: '好的，我明白了，谢谢！',
    lastMessageTime: Date.now() - 300000,
    unreadCount: 0,
    createdAt: Date.now() - 3600000
  }),
  createSession({
    id: 'session-2',
    userId: 'user-2',
    userName: '李四',
    agentId: 'agent-1',
    status: sessionStatuses.WAITING,
    lastMessage: '我的订单什么时候发货？',
    lastMessageTime: Date.now() - 180000,
    unreadCount: 2,
    createdAt: Date.now() - 1200000
  }),
  createSession({
    id: 'session-3',
    userId: 'user-3',
    userName: '王五',
    agentId: 'agent-1',
    status: sessionStatuses.ACTIVE,
    lastMessage: '好的，我会耐心等待的',
    lastMessageTime: Date.now() - 600000,
    unreadCount: 0,
    createdAt: Date.now() - 7200000
  }),
  createSession({
    id: 'session-4',
    userId: 'user-4',
    userName: '赵六',
    agentId: null,
    status: sessionStatuses.WAITING,
    lastMessage: '您好，有个问题想咨询一下',
    lastMessageTime: Date.now() - 60000,
    unreadCount: 3,
    createdAt: Date.now() - 600000
  }),
  createSession({
    id: 'session-5',
    userId: 'user-5',
    userName: '孙七',
    agentId: 'agent-1',
    status: sessionStatuses.CLOSED,
    lastMessage: '好的，问题已经解决了，谢谢！',
    lastMessageTime: Date.now() - 86400000,
    unreadCount: 0,
    createdAt: Date.now() - 172800000,
    closedAt: Date.now() - 86400000
  })
];

export const mockMessages = {
  'session-1': [
    createMessage({
      id: 'msg-1-1',
      content: '您好，欢迎使用智能客服！请问有什么可以帮助您的？',
      sender: messageSenders.AGENT,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 3600000,
      status: messageStatuses.READ,
      sessionId: 'session-1',
      agentId: 'agent-1',
      userId: 'user-1'
    }),
    createMessage({
      id: 'msg-1-2',
      content: '你好，我想咨询一下我的订单',
      sender: messageSenders.USER,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 3500000,
      status: messageStatuses.READ,
      sessionId: 'session-1',
      agentId: 'agent-1',
      userId: 'user-1'
    }),
    createMessage({
      id: 'msg-1-3',
      content: '好的，请问您的订单号是多少呢？',
      sender: messageSenders.AGENT,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 3400000,
      status: messageStatuses.READ,
      sessionId: 'session-1',
      agentId: 'agent-1',
      userId: 'user-1'
    }),
    createMessage({
      id: 'msg-1-4',
      content: '我的订单号是1234567890',
      sender: messageSenders.USER,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 3300000,
      status: messageStatuses.READ,
      sessionId: 'session-1',
      agentId: 'agent-1',
      userId: 'user-1'
    }),
    createMessage({
      id: 'msg-1-5',
      content: '好的，我帮您查询一下...',
      sender: messageSenders.AGENT,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 3200000,
      status: messageStatuses.READ,
      sessionId: 'session-1',
      agentId: 'agent-1',
      userId: 'user-1'
    }),
    createMessage({
      id: 'msg-1-6',
      content: '查询到您的订单正在配送中，预计今天下午送达',
      sender: messageSenders.AGENT,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 3100000,
      status: messageStatuses.READ,
      sessionId: 'session-1',
      agentId: 'agent-1',
      userId: 'user-1'
    }),
    createMessage({
      id: 'msg-1-7',
      content: '太好了，谢谢！',
      sender: messageSenders.USER,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 3000000,
      status: messageStatuses.READ,
      sessionId: 'session-1',
      agentId: 'agent-1',
      userId: 'user-1'
    }),
    createMessage({
      id: 'msg-1-8',
      content: '不客气，还有其他问题吗？',
      sender: messageSenders.AGENT,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 2900000,
      status: messageStatuses.READ,
      sessionId: 'session-1',
      agentId: 'agent-1',
      userId: 'user-1'
    }),
    createMessage({
      id: 'msg-1-9',
      content: '好的，我明白了，谢谢！',
      sender: messageSenders.USER,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 300000,
      status: messageStatuses.READ,
      sessionId: 'session-1',
      agentId: 'agent-1',
      userId: 'user-1'
    })
  ],
  'session-2': [
    createMessage({
      id: 'msg-2-1',
      content: '您好，欢迎使用智能客服！请问有什么可以帮助您的？',
      sender: messageSenders.SYSTEM,
      type: messageTypes.SYSTEM,
      timestamp: Date.now() - 1200000,
      status: messageStatuses.READ,
      sessionId: 'session-2',
      userId: 'user-2'
    }),
    createMessage({
      id: 'msg-2-2',
      content: '你好，我想咨询一下我的订单',
      sender: messageSenders.USER,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 1000000,
      status: messageStatuses.READ,
      sessionId: 'session-2',
      userId: 'user-2'
    }),
    createMessage({
      id: 'msg-2-3',
      content: '好的，请问您的订单号是多少呢？',
      sender: messageSenders.SYSTEM,
      type: messageTypes.SYSTEM,
      timestamp: Date.now() - 900000,
      status: messageStatuses.READ,
      sessionId: 'session-2',
      userId: 'user-2'
    }),
    createMessage({
      id: 'msg-2-4',
      content: '我的订单号是0987654321',
      sender: messageSenders.USER,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 800000,
      status: messageStatuses.READ,
      sessionId: 'session-2',
      userId: 'user-2'
    }),
    createMessage({
      id: 'msg-2-5',
      content: '好的，正在为您转接人工客服，请稍候...',
      sender: messageSenders.SYSTEM,
      type: messageTypes.SYSTEM,
      timestamp: Date.now() - 600000,
      status: messageStatuses.READ,
      sessionId: 'session-2',
      userId: 'user-2'
    }),
    createMessage({
      id: 'msg-2-6',
      content: '您好，我是张客服，请问有什么可以帮助您的？',
      sender: messageSenders.AGENT,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 400000,
      status: messageStatuses.READ,
      sessionId: 'session-2',
      agentId: 'agent-1',
      userId: 'user-2'
    }),
    createMessage({
      id: 'msg-2-7',
      content: '我的订单什么时候发货？',
      sender: messageSenders.USER,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 180000,
      status: messageStatuses.READ,
      sessionId: 'session-2',
      agentId: 'agent-1',
      userId: 'user-2'
    })
  ],
  'session-3': [
    createMessage({
      id: 'msg-3-1',
      content: '您好，我是张客服，请问有什么可以帮助您的？',
      sender: messageSenders.AGENT,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 7200000,
      status: messageStatuses.READ,
      sessionId: 'session-3',
      agentId: 'agent-1',
      userId: 'user-3'
    }),
    createMessage({
      id: 'msg-3-2',
      content: '你好，我想申请退款',
      sender: messageSenders.USER,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 7000000,
      status: messageStatuses.READ,
      sessionId: 'session-3',
      agentId: 'agent-1',
      userId: 'user-3'
    }),
    createMessage({
      id: 'msg-3-3',
      content: '好的，请您提供一下订单号和退款原因',
      sender: messageSenders.AGENT,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 6800000,
      status: messageStatuses.READ,
      sessionId: 'session-3',
      agentId: 'agent-1',
      userId: 'user-3'
    }),
    createMessage({
      id: 'msg-3-4',
      content: '订单号是1122334455，退款原因是商品有质量问题',
      sender: messageSenders.USER,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 6500000,
      status: messageStatuses.READ,
      sessionId: 'session-3',
      agentId: 'agent-1',
      userId: 'user-3'
    }),
    createMessage({
      id: 'msg-3-5',
      content: '好的，我已经记录了您的退款申请。退款处理通常需要3-5个工作日，请您耐心等待。',
      sender: messageSenders.AGENT,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 6200000,
      status: messageStatuses.READ,
      sessionId: 'session-3',
      agentId: 'agent-1',
      userId: 'user-3'
    }),
    createMessage({
      id: 'msg-3-6',
      content: '好的，我会耐心等待的',
      sender: messageSenders.USER,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 600000,
      status: messageStatuses.READ,
      sessionId: 'session-3',
      agentId: 'agent-1',
      userId: 'user-3'
    })
  ],
  'session-4': [
    createMessage({
      id: 'msg-4-1',
      content: '您好，欢迎使用智能客服！请问有什么可以帮助您的？',
      sender: messageSenders.SYSTEM,
      type: messageTypes.SYSTEM,
      timestamp: Date.now() - 600000,
      status: messageStatuses.READ,
      sessionId: 'session-4',
      userId: 'user-4'
    }),
    createMessage({
      id: 'msg-4-2',
      content: '您好，有个问题想咨询一下',
      sender: messageSenders.USER,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 400000,
      status: messageStatuses.READ,
      sessionId: 'session-4',
      userId: 'user-4'
    }),
    createMessage({
      id: 'msg-4-3',
      content: '好的，请您详细描述一下您的问题',
      sender: messageSenders.SYSTEM,
      type: messageTypes.SYSTEM,
      timestamp: Date.now() - 300000,
      status: messageStatuses.READ,
      sessionId: 'session-4',
      userId: 'user-4'
    }),
    createMessage({
      id: 'msg-4-4',
      content: '我的账户余额显示不对，少了100元',
      sender: messageSenders.USER,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 200000,
      status: messageStatuses.READ,
      sessionId: 'session-4',
      userId: 'user-4'
    }),
    createMessage({
      id: 'msg-4-5',
      content: '好的，正在为您转接人工客服，请稍候...',
      sender: messageSenders.SYSTEM,
      type: messageTypes.SYSTEM,
      timestamp: Date.now() - 100000,
      status: messageStatuses.READ,
      sessionId: 'session-4',
      userId: 'user-4'
    })
  ],
  'session-5': [
    createMessage({
      id: 'msg-5-1',
      content: '您好，我是张客服，请问有什么可以帮助您的？',
      sender: messageSenders.AGENT,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 172800000,
      status: messageStatuses.READ,
      sessionId: 'session-5',
      agentId: 'agent-1',
      userId: 'user-5'
    }),
    createMessage({
      id: 'msg-5-2',
      content: '你好，我想修改一下收货地址',
      sender: messageSenders.USER,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 170000000,
      status: messageStatuses.READ,
      sessionId: 'session-5',
      agentId: 'agent-1',
      userId: 'user-5'
    }),
    createMessage({
      id: 'msg-5-3',
      content: '好的，请您提供一下订单号和新的收货地址',
      sender: messageSenders.AGENT,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 168000000,
      status: messageStatuses.READ,
      sessionId: 'session-5',
      agentId: 'agent-1',
      userId: 'user-5'
    }),
    createMessage({
      id: 'msg-5-4',
      content: '订单号是5544332211，新地址是北京市朝阳区xxx路xxx号',
      sender: messageSenders.USER,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 165000000,
      status: messageStatuses.READ,
      sessionId: 'session-5',
      agentId: 'agent-1',
      userId: 'user-5'
    }),
    createMessage({
      id: 'msg-5-5',
      content: '好的，我已经帮您修改了收货地址。修改后的地址是：北京市朝阳区xxx路xxx号。',
      sender: messageSenders.AGENT,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 162000000,
      status: messageStatuses.READ,
      sessionId: 'session-5',
      agentId: 'agent-1',
      userId: 'user-5'
    }),
    createMessage({
      id: 'msg-5-6',
      content: '好的，问题已经解决了，谢谢！',
      sender: messageSenders.USER,
      type: messageTypes.TEXT,
      timestamp: Date.now() - 86400000,
      status: messageStatuses.READ,
      sessionId: 'session-5',
      agentId: 'agent-1',
      userId: 'user-5'
    })
  ]
};

export function getMockSessions() {
  return [...mockSessions];
}

export function getMockMessages(sessionId) {
  return mockMessages[sessionId] ? [...mockMessages[sessionId]] : [];
}

export function getAllMockMessages() {
  return { ...mockMessages };
}

export default {
  mockAgents,
  mockUsers,
  mockSessions,
  mockMessages,
  getMockSessions,
  getMockMessages,
  getAllMockMessages
};
