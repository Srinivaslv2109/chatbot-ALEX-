import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader } from 'lucide-react';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState(() => 'user_' + Math.random().toString(36).substr(2, 9));
  const [sessionId] = useState(() => 'session_' + Math.random().toString(36).substr(2, 9));
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    // Welcome message
    setMessages([{
      id: 1,
      text: "Hey there! I'm Alex. I love getting to know people - tell me a bit about yourself!",
      sender: 'bot',
      timestamp: new Date()
    }]);
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Replace with your backend URL
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          message: inputMessage,
          sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        text: data.response,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting right now. Could you try again?",
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const testScenarios = [
    "Hi, I'm Sarah and I love jazz music",
    "I'm feeling really down today",
    "What music should I listen to?",
    "Did you see me yesterday?",
    "What's your name?",
    "My favorite color is blue"
  ];

  const runTestScenario = (scenario) => {
    setInputMessage(scenario);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Alex</h1>
              <p className="text-sm text-gray-500">Your conversational companion</p>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            User: {userId.slice(-6)}
          </div>
        </div>
      </div>

      {/* Test Scenarios */}
      <div className="bg-yellow-50 border-b px-6 py-3">
        <p className="text-sm text-gray-600 mb-2">Quick test scenarios:</p>
        <div className="flex flex-wrap gap-2">
          {testScenarios.map((scenario, index) => (
            <button
              key={index}
              onClick={() => runTestScenario(scenario)}
              className="px-3 py-1 bg-yellow-200 hover:bg-yellow-300 rounded-full text-xs text-gray-700 transition-colors"
            >
              {scenario}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.sender === 'user' 
                ? 'bg-indigo-500' 
                : message.isError 
                  ? 'bg-red-500' 
                  : 'bg-gray-500'
            }`}>
              {message.sender === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.sender === 'user'
                ? 'bg-indigo-500 text-white'
                : message.isError
                  ? 'bg-red-100 text-red-800'
                  : 'bg-white text-gray-900 shadow-sm border'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              <p className={`text-xs mt-1 opacity-70 ${
                message.sender === 'user' ? 'text-indigo-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">Alex is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-6 py-4">
        <div className="flex items-center space-x-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows="1"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg p-2 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send • Session: {sessionId.slice(-6)}
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;