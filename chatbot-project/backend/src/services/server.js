const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

// Services
const ChatbotService = require('./services/ChatbotService');
const MemoryService = require('./services/MemoryService');
const GeminiService = require('./services/GeminiService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const geminiService = new GeminiService();
const memoryService = new MemoryService();
const chatbotService = new ChatbotService(geminiService, memoryService);

// Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, message, sessionId } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }

    const response = await chatbotService.generateResponse(userId, message, sessionId);
    
    res.json({
      response: response.text,
      userId,
      sessionId: sessionId || uuidv4(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/user/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await memoryService.getUserProfile(userId);
    res.json(profile);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Chatbot server running on port ${PORT}`);
});