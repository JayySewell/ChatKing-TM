import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Zap, Settings, Trash2, RotateCcw } from 'lucide-react';
import { Layout } from '../components/Layout';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
}

export default function AI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to ChatKing AI! I\'m powered by OpenRouter and have access to cutting-edge models like DeepSeek R1 Free and Gemma 3 27B Free. How can I assist you today?',
      timestamp: new Date(),
      model: 'ChatKing System'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('deepseek/deepseek-r1');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const models = [
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 Free', provider: 'DeepSeek' },
    { id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B Free', provider: 'Google' },
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B Free', provider: 'Meta' },
    { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini Free', provider: 'Microsoft' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate API call - In real implementation, this would call OpenRouter API
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `This is a simulated response using ${models.find(m => m.id === selectedModel)?.name}. In the full implementation, this would connect to OpenRouter API with key: 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`,
          timestamp: new Date(),
          model: selectedModel
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: 'Chat cleared. How can I help you?',
      timestamp: new Date(),
      model: 'ChatKing System'
    }]);
  };

  return (
    <Layout isAuthenticated={true} isOwner={true} username="Owner">
      <div className="flex h-screen pt-0">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="glass border-b border-border-glow p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyber-blue to-neon-purple rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-main-bg" />
                </div>
                <div>
                  <h1 className="font-orbitron font-bold text-xl text-glow-cyber">ChatKing AI</h1>
                  <p className="text-sm text-text-muted">
                    Model: {models.find(m => m.id === selectedModel)?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded hover:bg-cyber-blue/10 transition-colors"
                >
                  <Settings className="w-5 h-5 text-cyber-blue" />
                </button>
                <button
                  onClick={clearChat}
                  className="p-2 rounded hover:bg-neon-red/10 transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-neon-red" />
                </button>
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="glass border-b border-border-glow p-4">
              <h3 className="font-semibold text-lg mb-3 text-text-primary">Model Selection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`p-3 rounded border text-left transition-all ${
                      selectedModel === model.id
                        ? 'border-neon bg-cyber-blue/20 text-cyber-blue'
                        : 'border-border-glow hover:border-cyber-blue/50 text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs opacity-70">{model.provider}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-r from-neon-green to-green-400' 
                    : 'bg-gradient-to-r from-cyber-blue to-neon-purple'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-main-bg" />
                  ) : (
                    <Bot className="w-4 h-4 text-main-bg" />
                  )}
                </div>
                <div className={`flex-1 max-w-3xl ${
                  message.role === 'user' ? 'text-right' : ''
                }`}>
                  <div className={`glass-card ${
                    message.role === 'user' 
                      ? 'bg-neon-green/10 border-neon-green/30' 
                      : 'bg-cyber-blue/10 border-cyber-blue/30'
                  }`}>
                    <p className="text-text-primary whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-glow">
                      <span className="text-xs text-text-muted">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.model && (
                        <span className="text-xs text-cyber-blue">
                          {models.find(m => m.id === message.model)?.name || message.model}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyber-blue to-neon-purple flex items-center justify-center">
                  <Bot className="w-4 h-4 text-main-bg" />
                </div>
                <div className="glass-card bg-cyber-blue/10 border-cyber-blue/30">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-cyber-blue rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-cyber-blue rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-cyber-blue rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="glass border-t border-border-glow p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="w-full cyber-input pr-12"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded hover:bg-cyber-blue/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 text-cyber-blue" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
              <span>Press Enter to send</span>
              <span>{inputMessage.length}/4000</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
