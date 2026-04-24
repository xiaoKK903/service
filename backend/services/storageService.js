const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.join(__dirname, '../data');
const SESSIONS_FILE = path.join(STORAGE_DIR, 'sessions.json');

class StorageService {
  constructor() {
    this.ensureStorageDir();
  }

  ensureStorageDir() {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  }

  saveSessions(sessions) {
    try {
      const sessionsArray = Array.from(sessions.values()).map(s => s.toJSON());
      const data = JSON.stringify(sessionsArray, null, 2);
      fs.writeFileSync(SESSIONS_FILE, data, 'utf8');
      console.log(`[StorageService] 保存 ${sessionsArray.length} 个会话到文件`);
      return true;
    } catch (error) {
      console.error('[StorageService] 保存会话失败:', error);
      return false;
    }
  }

  loadSessions(SessionModel) {
    try {
      if (!fs.existsSync(SESSIONS_FILE)) {
        console.log('[StorageService] 会话文件不存在，返回空数据');
        return [];
      }
      
      const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
      const sessionsData = JSON.parse(data);
      const sessions = sessionsData.map(s => SessionModel.fromJSON(s));
      console.log(`[StorageService] 从文件加载 ${sessions.length} 个会话`);
      return sessions;
    } catch (error) {
      console.error('[StorageService] 加载会话失败:', error);
      return [];
    }
  }

  updateSessionNotes(sessionId, notes) {
    try {
      if (!fs.existsSync(SESSIONS_FILE)) {
        return false;
      }
      
      const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
      const sessionsData = JSON.parse(data);
      
      const session = sessionsData.find(s => s.id === sessionId);
      if (session) {
        session.notes = notes || '';
        session.notesUpdatedAt = Date.now();
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessionsData, null, 2), 'utf8');
        console.log(`[StorageService] 更新会话备注: ${sessionId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[StorageService] 更新会话备注失败:', error);
      return false;
    }
  }
}

module.exports = new StorageService();
