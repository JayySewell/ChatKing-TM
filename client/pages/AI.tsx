import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Zap, Settings, Trash2, History, Sparkles } from 'lucide-react';
import { Layout } from '../components/Layout';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
}

interface Model {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  pricing: { prompt: string; completion: string };
  isFree: boolean;
}

interface ChatSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string;
}

export default function AI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to ChatKing AI! I\'m powered by OpenRouter and have access to cutting-edge models like DeepSeek R1, Gemma 2 27B, and more. How can I assist you today?',
      timestamp: new Date(),
      model: 'ChatKing System'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('deepseek/deepseek-r1');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [userId] = useState('demo-user'); // In real app, get from auth
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadAvailableModels();
    loadChatHistory();
  }, []);

  const loadAvailableModels = async () => {
    try {
      const response = await fetch('/api/ai/models');
      const data = await response.json();
      
      if (data.models) {
        setModels(data.models);
        // Set first free model as default
        const freeModel = data.models.find((m: Model) => m.isFree);
        if (freeModel) {
          setSelectedModel(freeModel.id);
        }
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      // Fallback to default models
      setModels([
        {
          id: 'deepseek/deepseek-r1',
          name: 'DeepSeek R1 Free',
          description: 'Advanced reasoning model',
          contextLength: 32768,
          pricing: { prompt: '0', completion: '0' },
          isFree: true
        }
      ]);
    }
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/ai/history/${userId}`);
      const data = await response.json();
      
      if (data.sessions) {
        setChatSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

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
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          model: selectedModel,
          sessionId: currentSessionId,
          userId: userId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessage: Message = {
        id: data.messageId || (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        model: selectedModel
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Update session ID if new session was created
      if (data.sessionId && !currentSessionId) {
        setCurrentSessionId(data.sessionId);
        loadChatHistory(); // Refresh history
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
        model: 'Error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
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
    setCurrentSessionId(null);
  };

  const loadChatSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/ai/session/${sessionId}?userId=${userId}`);
      const data = await response.json();
      
      if (data.session) {
        setMessages(data.session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
        setCurrentSessionId(sessionId);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Failed to load chat session:', error);
    }
  };

  const formatModelName = (model: Model) => {
    return model.isFree ? `${model.name} (Free)` : `${model.name}`;
  };

  return (
    <Layout isAuthenticated={true} isOwner={true} username="Owner">
      <div className="flex h-screen pt-0">
        {/* History Sidebar */}
        {showHistory && (
          <div className="w-80 glass border-r border-border-glow p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orbitron font-bold text-lg text-text-primary">Chat History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 rounded hover:bg-cyber-blue/10 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2">
              {chatSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => loadChatSession(session.id)}
                  className={`w-full text-left p-3 rounded border transition-all ${
                    currentSessionId === session.id
                      ? 'border-cyber-blue bg-cyber-blue/20 text-cyber-blue'
                      : 'border-border-glow hover:border-cyber-blue/50 text-text-muted hover:text-text-primary'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs opacity-70 truncate">
                    {session.lastMessage || 'No messages'}
                  </div>
                  <div className="text-xs opacity-50 mt-1">
                    {session.messageCount} messages
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

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
                    Model: {models.find(m => m.id === selectedModel)?.name || selectedModel}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-2 rounded hover:bg-cyber-blue/10 transition-colors"
                >
                  <History className="w-5 h-5 text-cyber-blue" />
                </button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
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
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium">{formatModelName(model)}</div>
                      {model.isFree && (
                        <Sparkles className="w-4 h-4 text-neon-green" />
                      )}
                    </div>
                    <div className="text-xs opacity-70 mb-1">{model.description}</div>
                    <div className="text-xs opacity-50">
                      Context: {model.contextLength.toLocaleString()} tokens
                    </div>
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
                  maxLength={4000}
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
              <span>Press Enter to send • OpenRouter API Active</span>
              <span>{inputMessage.length}/4000</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
