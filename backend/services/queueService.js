const agentService = require('./agentService');
const { agentStatuses } = require('../utils/constants');

class QueueService {
  constructor() {
    this.agentService = agentService;
  }

  getAvailableAgentForNewSession() {
    const idleAgents = this.agentService.getIdleAgents();
    
    const fullyIdleAgents = idleAgents.filter(agent => {
      return agent.activeSessions && agent.activeSessions.length === 0;
    });
    
    if (fullyIdleAgents.length === 0) {
      return null;
    }
    
    fullyIdleAgents.sort((a, b) => {
      return a.lastSeen - b.lastSeen;
    });
    
    return fullyIdleAgents[0];
  }

  getAgentsWithAvailableCapacity() {
    const idleAgents = this.agentService.getIdleAgents();
    
    return idleAgents.filter(agent => {
      return agent.activeSessions && agent.activeSessions.length === 0;
    });
  }

  canAcceptNewSession(agentId) {
    const agent = this.agentService.getAgent(agentId);
    if (!agent) {
      return false;
    }
    
    if (agent.status !== agentStatuses.IDLE || !agent.connected) {
      return false;
    }
    
    if (!agent.activeSessions || agent.activeSessions.length > 0) {
      return false;
    }
    
    return true;
  }

  getQueuedAgents() {
    const allAgents = this.agentService.getAllAgents();
    return allAgents.filter(agent => {
      return agent.connected && 
             agent.status === agentStatuses.IDLE && 
             agent.activeSessions && 
             agent.activeSessions.length > 0;
    });
  }
}

module.exports = new QueueService();
