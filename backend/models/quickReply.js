class QuickReply {
  constructor({ id, keyword, content, sortOrder, createdAt, updatedAt }) {
    this.id = id || `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.keyword = keyword || '';
    this.content = content || '';
    this.sortOrder = sortOrder || 0;
    this.createdAt = createdAt || Date.now();
    this.updatedAt = updatedAt || Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      keyword: this.keyword,
      content: this.content,
      sortOrder: this.sortOrder,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromJSON(json) {
    return new QuickReply(json);
  }
}

module.exports = QuickReply;
