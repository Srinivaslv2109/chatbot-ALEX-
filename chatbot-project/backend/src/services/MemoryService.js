class MemoryService {
  constructor() {
    // In-memory storage for demo (replace with actual database)
    this.users = new Map();
    this.conversations = new Map();
    this.sessions = new Map();
  }

  async getUserProfile(userId) {
    if (!this.users.has(userId)) {
      this.users.set(userId, {
        id: userId,
        facts: [],
        themes: [],
        preferences: {},
        conversationCount: 0,
        firstSeen: new Date(),
        lastSeen: new Date()
      });
    }

    const profile = this.users.get(userId);
    profile.lastSeen = new Date();
    return profile;
  }

  async saveUserInfo(userId, infoArray) {
    const profile = await this.getUserProfile(userId);
    
    infoArray.forEach(info => {
      // Avoid duplicates
      const existing = profile.facts.find(f => 
        f.type === info.type && f.content.toLowerCase() === info.content.toLowerCase()
      );
      
      if (!existing) {
        profile.facts.push(info);
        
        // Add to themes if it's an interest
        if (info.type === 'interest' && !profile.themes.includes(info.content)) {
          profile.themes.push(info.content);
        }
      }
    });

    this.users.set(userId, profile);
  }

  async getRecentHistory(userId, limit = 5) {
    const userConversations = this.conversations.get(userId) || [];
    return userConversations.slice(-limit);
  }

  async saveInteraction(userId, sessionId, message, response) {
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, []);
    }

    const interaction = {
      sessionId,
      message,
      response,
      timestamp: new Date()
    };

    this.conversations.get(userId).push(interaction);

    // Keep only last 50 interactions per user
    const conversations = this.conversations.get(userId);
    if (conversations.length > 50) {
      conversations.splice(0, conversations.length - 50);
    }

    // Update user profile
    const profile = await this.getUserProfile(userId);
    profile.conversationCount++;
  }

  async getSessionContext(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  async updateConversationSummary(userId, interaction) {
    // Simple implementation - in production, use LLM to generate summaries
    const profile = await this.getUserProfile(userId);
    
    // Detect mood from message
    const moodKeywords = {
      happy: ['happy', 'excited', 'great', 'awesome', 'wonderful'],
      sad: ['sad', 'down', 'depressed', 'upset', 'unhappy'],
      angry: ['angry', 'frustrated', 'mad', 'annoyed'],
      curious: ['wonder', 'how', 'why', 'what', 'curious']
    };

    const message = interaction.message.toLowerCase();
    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        if (!this.sessions.has(interaction.sessionId)) {
          this.sessions.set(interaction.sessionId, {});
        }
        this.sessions.get(interaction.sessionId).mood = mood;
        break;
      }
    }
  }
}

module.exports = ChatbotService;