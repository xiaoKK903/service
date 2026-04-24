const SensitiveWord = require('../models/sensitiveWord');

class SensitiveWordService {
  constructor() {
    this.sensitiveWords = new Map();
    this.initDefaultSensitiveWords();
  }

  initDefaultSensitiveWords() {
    const defaultWords = [
      { word: '诈骗', category: '违法犯罪', sortOrder: 0 },
      { word: '兼职', category: '违规信息', sortOrder: 1 },
      { word: '中奖', category: '营销广告', sortOrder: 2 },
      { word: '赌博', category: '违法犯罪', sortOrder: 3 },
      { word: '色情', category: '违法犯罪', sortOrder: 4 },
      { word: '毒品', category: '违法犯罪', sortOrder: 5 },
      { word: '高利贷', category: '违规信息', sortOrder: 6 },
      { word: '套现', category: '违规信息', sortOrder: 7 },
      { word: '代开发票', category: '违规信息', sortOrder: 8 },
      { word: '走私', category: '违法犯罪', sortOrder: 9 },
    ];

    defaultWords.forEach(item => {
      const sensitiveWord = new SensitiveWord(item);
      this.sensitiveWords.set(sensitiveWord.id, sensitiveWord);
    });
    
    console.log('[SensitiveWordService] 默认敏感词初始化完成，数量:', this.sensitiveWords.size);
  }

  getAllSensitiveWords() {
    const words = Array.from(this.sensitiveWords.values());
    return words.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getSensitiveWordById(id) {
    return this.sensitiveWords.get(id) || null;
  }

  getWordsByCategory(category) {
    const words = Array.from(this.sensitiveWords.values()).filter(w => w.category === category);
    return words.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  createSensitiveWord({ word, category, sortOrder }) {
    if (!word || !word.trim()) {
      console.log('[SensitiveWordService] 敏感词不能为空');
      return null;
    }

    const existing = Array.from(this.sensitiveWords.values()).find(w => w.word === word.trim());
    if (existing) {
      console.log('[SensitiveWordService] 敏感词已存在:', word);
      return null;
    }

    const sensitiveWord = new SensitiveWord({
      word: word.trim(),
      category: category || 'default',
      sortOrder: sortOrder !== undefined ? sortOrder : this.sensitiveWords.size
    });
    
    this.sensitiveWords.set(sensitiveWord.id, sensitiveWord);
    console.log('[SensitiveWordService] 敏感词创建成功:', sensitiveWord.word);
    return sensitiveWord;
  }

  updateSensitiveWord(id, { word, category, sortOrder }) {
    const sensitiveWord = this.sensitiveWords.get(id);
    if (!sensitiveWord) {
      console.log('[SensitiveWordService] 敏感词不存在:', id);
      return null;
    }

    if (word !== undefined && word.trim()) {
      const existing = Array.from(this.sensitiveWords.values()).find(
        w => w.word === word.trim() && w.id !== id
      );
      if (existing) {
        console.log('[SensitiveWordService] 敏感词已存在:', word);
        return null;
      }
      sensitiveWord.word = word.trim();
    }
    
    if (category !== undefined) sensitiveWord.category = category;
    if (sortOrder !== undefined) sensitiveWord.sortOrder = sortOrder;
    sensitiveWord.updatedAt = Date.now();

    console.log('[SensitiveWordService] 敏感词更新成功:', sensitiveWord.word);
    return sensitiveWord;
  }

  deleteSensitiveWord(id) {
    const sensitiveWord = this.sensitiveWords.get(id);
    if (!sensitiveWord) {
      console.log('[SensitiveWordService] 敏感词不存在:', id);
      return false;
    }

    this.sensitiveWords.delete(id);
    console.log('[SensitiveWordService] 敏感词删除成功:', sensitiveWord.word);
    return true;
  }

  containsSensitiveWord(text) {
    if (!text || typeof text !== 'string') {
      return { contains: false, foundWords: [] };
    }

    const foundWords = [];
    const lowerText = text.toLowerCase();

    for (const word of this.sensitiveWords.values()) {
      if (lowerText.includes(word.word.toLowerCase())) {
        foundWords.push(word);
      }
    }

    return {
      contains: foundWords.length > 0,
      foundWords: foundWords
    };
  }

  replaceSensitiveWords(text, replacement = '***') {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let result = text;
    
    const words = Array.from(this.sensitiveWords.values()).sort((a, b) => b.word.length - a.word.length);

    for (const word of words) {
      const regex = new RegExp(this.escapeRegExp(word.word), 'gi');
      result = result.replace(regex, replacement);
    }

    return result;
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = new SensitiveWordService();
