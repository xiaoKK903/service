const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 简单的API端点
app.post('/api/hello', (req, res) => {
  const { message } = req.body;
  
  // 模拟处理逻辑
  const responseMessage = `后端收到消息: ${message}`;
  
  res.json({ message: responseMessage });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('API端点: POST http://localhost:3001/api/hello');
});