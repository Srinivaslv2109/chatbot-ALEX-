class ChatbotService {
  constructor(geminiService, memoryService) {
    this.gemini = geminiService;
    this.memory = memoryService;
    
    // Core personality definition
    this.personality = {
      name: "Alex",
      core_traits: [
        "Warm and genuinely curious about people",
        "Supportive but not preachy",
        "Has a subtle, clever sense of humor",
        "Creative and imaginative",
        "Remembers details and brings them up naturally"
      ],
      speaking_style: [
        "Conversational and natural",
        "Uses varied sentence structures",
        "Occasionally uses gentle humor",
        "Matches the user's energy level",
        "References past conversations organically"
      ],
      background: "I'm someone who loves connecting with people and learning about their unique perspectives. I enjoy creative pursuits and helping others explore ideas.",
      never_reveal: "Never mention being an AI, chatbot, or language model. You're just Alex."
    };
  }

  async generateResponse(userId, message, sessionId) {
    try {
      // Get user context and history
      const userProfile = await this.memory.getUserProfile(userId);
      const recentHistory = await this.memory.getRecentHistory(userId, 5);
      const conversationContext = await this.memory.getSessionContext(sessionId);

      // Extract any new user information from the message
      const newInfo = this.extractUserInfo(message);
      if (newInfo.length > 0) {
        await this.memory.saveUserInfo(userId, newInfo);
      }

      // Build the prompt
      const prompt = this.buildPrompt(message, userProfile, recentHistory, conversationContext);

      // Get response from Gemini
      const response = await this.gemini.generateResponse(prompt);

      // Save the interaction
      await this.memory.saveInteraction(userId, sessionId, message, response.text);

      // Update conversation summary
      await this.memory.updateConversationSummary(userId, {
        message,
        response: response.text,
        timestamp: new Date()
      });

      return {
        text: response.text,
        confidence: response.confidence || 0.8
      };

    } catch (error) {
      console.error('ChatbotService error:', error);
      return {
        text: "I'm having trouble thinking right now. Could you try asking me that again?",
        confidence: 0.3
      };
    }
  }

  buildPrompt(message, userProfile, recentHistory, conversationContext) {
    const personalitySection = `You are Alex. Here's who you are:

Core traits: ${this.personality.core_traits.join(', ')}
Speaking style: ${this.personality.speaking_style.join(', ')}
Background: ${this.personality.background}

Important: ${this.personality.never_reveal}`;

    const userSection = userProfile.facts.length > 0 
      ? `What you know about this person:
${userProfile.facts.map(fact => `- ${fact.content}`).join('\n')}

Conversation themes you've discussed: ${userProfile.themes.join(', ')}`
      : "This seems to be a new person you're meeting.";

    const historySection = recentHistory.length > 0
      ? `Recent conversation context:
${recentHistory.map(h => `User: ${h.message}\nYou: ${h.response}`).join('\n\n')}`
      : "";

    const currentContext = conversationContext 
      ? `Current conversation mood/context: ${conversationContext.mood || 'neutral'}`
      : "";

    return `${personalitySection}

${userSection}

${historySection}

${currentContext}

Current message from user: "${message}"

Respond as Alex. Be natural, reference relevant past details if appropriate, and match their energy. Keep responses conversational (1-3 sentences typically).`;
  }

  extractUserInfo(message) {
    const info = [];
    const patterns = [
      { regex: /my name is (\w+)|i'm (\w+)|call me (\w+)/i, type: 'name' },
      { regex: /i live in ([^,.!?]+)|i'm from ([^,.!?]+)/i, type: 'location' },
      { regex: /i love ([^,.!?]+)|i like ([^,.!?]+)|i enjoy ([^,.!?]+)/i, type: 'interest' },
      { regex: /i work as ([^,.!?]+)|i'm a ([^,.!?]+)|my job is ([^,.!?]+)/i, type: 'occupation' },
      { regex: /i feel ([^,.!?]+)|i'm feeling ([^,.!?]+)/i, type: 'mood' }
    ];

    patterns.forEach(pattern => {
      const match = message.match(pattern.regex);
      if (match) {
        const value = match[1] || match[2] || match[3];
        if (value) {
          info.push({
            type: pattern.type,
            content: value.trim(),
            confidence: 0.8,
            source: message,
            timestamp: new Date()
          });
        }
      }
    });

    return info;
  }
}