class SensitiveWord {
  constructor({ id, word, category, sortOrder, createdAt, updatedAt }) {
    this.id = id || `sw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.word = word || '';
    this.category = category || 'default';
    this.sortOrder = sortOrder || 0;
    this.createdAt = createdAt || Date.now();
    this.updatedAt = updatedAt || Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      word: this.word,
      category: this.category,
      sortOrder: this.sortOrder,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromJSON(json) {
    return new SensitiveWord(json);
  }
}

module.exports = SensitiveWord;
