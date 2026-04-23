const { agentStatuses } = require('../utils/constants');

class AgentService {
  constructor() {
    this.agents = new Map();
  }

  getOrCreateAgent(agentId, agentName) {
    if (this.agents.has(agentId)) {
      return this.agents.get(agentId);
    }

    const agent = {
      id: agentId,
      name: agentName || '客服',
      status: agentStatuses.IDLE,
      activeSessions: [],
      connected: true,
      lastSeen: Date.now()
    };

    this.agents.set(agentId, agent);
    return agent;
  }

  getAgent(agentId) {
    return this.agents.get(agentId) || null;
  }

  updateAgentStatus(agentId, status) {
    const agent = this.getAgent(agentId);
    if (!agent) {
      return null;
    }

    const validStatuses = Object.values(agentStatuses);
    if (!validStatuses.includes(status)) {
      return null;
    }

    agent.status = status;
    agent.lastSeen = Date.now();
    return agent;
  }

  setAgentConnected(agentId, connected) {
    const agent = this.getAgent(agentId);
    if (!agent) {
      return null;
    }

    agent.connected = connected;
    if (!connected) {
      agent.status = agentStatuses.OFFLINE;
    }
    agent.lastSeen = Date.now();
    return agent;
  }

  getAvailableAgents() {
    const availableAgents = [];
    for (const agent of this.agents.values()) {
      if (agent.status === agentStatuses.IDLE && agent.connected) {
        availableAgents.push(agent);
      }
    }
    return availableAgents;
  }

  getIdleAgents() {
    return this.getAvailableAgents();
  }

  getBestIdleAgent() {
    const availableAgents = this.getIdleAgents();
    if (availableAgents.length === 0) {
      return null;
    }

    availableAgents.sort((a, b) => {
      const aSessions = a.activeSessions.length;
      const bSessions = b.activeSessions.length;
      if (aSessions !== bSessions) {
        return aSessions - bSessions;
      }
      return a.lastSeen - b.lastSeen;
    });

    return availableAgents[0];
  }

  addSessionToAgent(agentId, sessionId) {
    const agent = this.getAgent(agentId);
    if (!agent) {
      console.log(`[AgentService] 客服 ${agentId} 不存在，无法添加会话`);
      return false;
    }

    if (!agent.activeSessions.includes(sessionId)) {
      agent.activeSessions.push(sessionId);
      console.log(`[AgentService] 客服 ${agentId} 添加会话 ${sessionId}，当前活跃会话数: ${agent.activeSessions.length}`);
    }
    return true;
  }

  removeSessionFromAgent(agentId, sessionId) {
    const agent = this.getAgent(agentId);
    if (!agent) {
      console.log(`[AgentService] 客服 ${agentId} 不存在，无法移除会话`);
      return false;
    }

    const index = agent.activeSessions.indexOf(sessionId);
    if (index > -1) {
      agent.activeSessions.splice(index, 1);
      console.log(`[AgentService] 客服 ${agentId} 移除会话 ${sessionId}，当前活跃会话数: ${agent.activeSessions.length}`);
    }
    return true;
  }

  getAllAgents() {
    return Array.from(this.agents.values());
  }

  getAgentStatus(agentId) {
    const agent = this.getAgent(agentId);
    if (!agent) {
      return agentStatuses.OFFLINE;
    }
    return agent.status;
  }

  isAgentIdle(agentId) {
    const agent = this.getAgent(agentId);
    if (!agent) {
      return false;
    }
    return agent.status === agentStatuses.IDLE && agent.connected;
  }

  isAgentBusy(agentId) {
    const agent = this.getAgent(agentId);
    if (!agent) {
      return false;
    }
    return agent.status === agentStatuses.BUSY;
  }

  isAgentOffline(agentId) {
    const agent = this.getAgent(agentId);
    if (!agent) {
      return true;
    }
    return agent.status === agentStatuses.OFFLINE || !agent.connected;
  }
}

module.exports = new AgentService();
