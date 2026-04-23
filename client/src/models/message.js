export class Message {
  constructor({ id, content, sender, type, timestamp, status = 'pending' }) {
    this.id = id || Date.now().toString();
    this.content = content;
    this.sender = sender;
    this.type = type || 'text';
    this.timestamp = timestamp || Date.now();
    this.status = status;
  }

  static fromJSON(json) {
    return new Message({
      id: json.id,
      content: json.content,
      sender: json.sender,
      type: json.type,
      timestamp: json.timestamp,
      status: json.status
    });
  }

  toJSON() {
    return {
      id: this.id,
      content: this.content,
      sender: this.sender,
      type: this.type,
      timestamp: this.timestamp,
      status: this.status
    };
  }

  getTimeString() {
    const date = new Date(this.timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  isFromMe() {
    return this.sender === 'user';
  }

  isFromServer() {
    return this.sender === 'server';
  }
}

export default Message;
