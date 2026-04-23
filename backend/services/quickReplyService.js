const QuickReply = require('../models/quickReply');

class QuickReplyService {
  constructor() {
    this.quickReplies = new Map();
    this.initDefaultQuickReplies();
  }

  initDefaultQuickReplies() {
    const defaultReplies = [
      { keyword: '问候', content: '您好，很高兴为您服务！请问有什么可以帮您的？', sortOrder: 0 },
      { keyword: '再见', content: '感谢您的咨询，祝您生活愉快，再见！', sortOrder: 1 },
      { keyword: '等待', content: '请稍等，我正在为您查询相关信息...', sortOrder: 2 },
      { keyword: '抱歉', content: '非常抱歉给您带来了不便，我会尽快为您解决这个问题。', sortOrder: 3 },
      { keyword: '感谢', content: '感谢您的理解与支持！', sortOrder: 4 },
      { keyword: '确认', content: '好的，我理解了，请稍等...', sortOrder: 5 },
      { keyword: '技术问题', content: '您遇到的技术问题我已经记录了，我们的技术团队会尽快处理。', sortOrder: 6 },
      { keyword: '退款问题', content: '关于退款问题，请您提供一下订单号，我会为您查询具体流程。', sortOrder: 7 },
    ];

    defaultReplies.forEach(reply => {
      const quickReply = new QuickReply(reply);
      this.quickReplies.set(quickReply.id, quickReply);
    });
  }

  getAllQuickReplies() {
    const replies = Array.from(this.quickReplies.values());
    return replies.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getQuickReplyById(id) {
    return this.quickReplies.get(id) || null;
  }

  createQuickReply({ keyword, content, sortOrder }) {
    const quickReply = new QuickReply({
      keyword,
      content,
      sortOrder: sortOrder !== undefined ? sortOrder : this.quickReplies.size
    });
    
    this.quickReplies.set(quickReply.id, quickReply);
    return quickReply;
  }

  updateQuickReply(id, { keyword, content, sortOrder }) {
    const quickReply = this.quickReplies.get(id);
    if (!quickReply) {
      return null;
    }

    if (keyword !== undefined) quickReply.keyword = keyword;
    if (content !== undefined) quickReply.content = content;
    if (sortOrder !== undefined) quickReply.sortOrder = sortOrder;
    quickReply.updatedAt = Date.now();

    return quickReply;
  }

  deleteQuickReply(id) {
    const quickReply = this.quickReplies.get(id);
    if (!quickReply) {
      return false;
    }

    this.quickReplies.delete(id);
    return true;
  }
}

module.exports = new QuickReplyService();
