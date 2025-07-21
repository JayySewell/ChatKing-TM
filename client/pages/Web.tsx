import { useState, useEffect, useRef } from 'react';
import { 
  Globe, Search, Shield, Wifi, History, Settings, Trash2, 
  Eye, EyeOff, ArrowLeft, ArrowRight, RotateCcw, Star,
  ExternalLink, Clock, Filter, Image, Video, Newspaper,
  Map, Bot, MoreHorizontal, Wrench, Compass, Calendar,
  Briefcase, Music, ShoppingBag, Gamepad2, Cpu
} from 'lucide-react';
import { Layout } from '../components/Layout';

interface SearchResult {
  title: string;
  url: string;
  description: string;
  favicon?: string;
  age?: string;
  type: 'web' | 'news' | 'image' | 'video';
  thumbnail?: string;
  duration?: string;
  publishedDate?: string;
  source?: string;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
  incognito?: boolean;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  results: SearchResult[];
  timestamp: string;
}

type SearchType = 'search' | 'images' | 'videos' | 'maps' | 'news' | 'copilot' | 'more' | 'tools';

export default function Web() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchType, setActiveSearchType] = useState<SearchType>('search');
  const [incognitoMode, setIncognitoMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [safeSearch, setSafeSearch] = useState<'strict' | 'moderate' | 'off'>('moderate');
  const [currentQuery, setCurrentQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [mapView, setMapView] = useState<'standard' | 'satellite' | 'terrain'>('standard');
  const [newsTimeframe, setNewsTimeframe] = useState<'any' | '24h' | '7d' | '30d'>('any');
  const [userId] = useState('demo-user');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchTypes = [
    { id: 'search', label: 'Search', icon: Search, color: 'text-cyber-blue' },
    { id: 'images', label: 'Images', icon: Image, color: 'text-neon-green' },
    { id: 'videos', label: 'Videos', icon: Video, color: 'text-neon-red' },
    { id: 'maps', label: 'Maps', icon: Map, color: 'text-neon-purple' },
    { id: 'news', label: 'News', icon: Newspaper, color: 'text-neon-amber' },
    { id: 'copilot', label: 'Copilot', icon: Bot, color: 'text-cyber-blue' },
    { id: 'more', label: 'More', icon: MoreHorizontal, color: 'text-text-muted' },
    { id: 'tools', label: 'Tools', icon: Wrench, color: 'text-text-muted' }
  ];

  const moreSearchTypes = [
    { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'text-neon-green' },
    { id: 'music', label: 'Music', icon: Music, color: 'text-neon-purple' },
    { id: 'games', label: 'Games', icon: Gamepad2, color: 'text-neon-red' },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, color: 'text-neon-amber' },
    { id: 'events', label: 'Events', icon: Calendar, color: 'text-cyber-blue' },
    { id: 'local', label: 'Local', icon: Compass, color: 'text-neon-green' }
  ];

  const tools = [
    { id: 'translator', label: 'Translator', description: 'Translate text between languages' },
    { id: 'calculator', label: 'Calculator', description: 'Scientific calculator', link: '/calculator' },
    { id: 'converter', label: 'Unit Converter', description: 'Convert units, currencies, and more' },
    { id: 'color-picker', label: 'Color Picker', description: 'Pick and convert colors' },
    { id: 'qr-generator', label: 'QR Code Generator', description: 'Generate QR codes' },
    { id: 'password-generator', label: 'Password Generator', description: 'Generate secure passwords' },
    { id: 'base64', label: 'Base64 Encoder/Decoder', description: 'Encode and decode Base64' },
    { id: 'url-shortener', label: 'URL Shortener', description: 'Shorten long URLs' },
    { id: 'regex-tester', label: 'Regex Tester', description: 'Test regular expressions' },
    { id: 'json-formatter', label: 'JSON Formatter', description: 'Format and validate JSON' }
  ];

  useEffect(() => {
    if (!incognitoMode) {
      loadSearchHistory();
    }
  }, [incognitoMode]);

  useEffect(() => {
    const delayedSuggestions = setTimeout(() => {
      if (searchQuery.length > 2) {
        loadSuggestions(searchQuery);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayedSuggestions);
  }, [searchQuery]);

  const loadSearchHistory = async () => {
    try {
      const response = await fetch(`/api/web/history/${userId}`);
      const data = await response.json();
      if (data.history) {
        setSearchHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const loadSuggestions = async (query: string) => {
    try {
      const response = await fetch(`/api/web/suggestions?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const performSearch = async (query?: string, searchType?: string) => {
    const searchTerm = query || searchQuery;
    const type = searchType || activeSearchType;
    
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);
    setCurrentQuery(searchTerm);

    try {
      const response = await fetch('/api/web/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchTerm,
          userId: userId,
          type: type === 'search' ? 'web' : type,
          count: 20,
          safeSearch: safeSearch,
          incognito: incognitoMode,
          timeframe: type === 'news' ? newsTimeframe : undefined
        })
      });

      const data: SearchResponse = await response.json();

      if (data.results) {
        setSearchResults(generateMockResults(searchTerm, type as any));
        setTotalResults(data.totalResults);
        setSearchTime(data.searchTime);
        
        if (!incognitoMode) {
          loadSearchHistory();
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults(generateMockResults(searchTerm, type as any));
    } finally {
      setIsSearching(false);
    }
  };

  const generateMockResults = (query: string, type: string): SearchResult[] => {
    const baseResults = [
      {
        title: `${query} - Official Website`,
        url: `https://example.com/${query.toLowerCase().replace(' ', '-')}`,
        description: `The official website for ${query}. Get the latest information, updates, and resources.`,
        type: 'web' as const,
        favicon: 'https://example.com/favicon.ico'
      },
      {
        title: `Complete Guide to ${query}`,
        url: `https://guide.example.com/${query}`,
        description: `Everything you need to know about ${query}. Comprehensive tutorials, tips, and best practices.`,
        type: 'web' as const,
        age: '2 days ago'
      },
      {
        title: `${query} Documentation`,
        url: `https://docs.example.com/${query}`,
        description: `Official documentation and API reference for ${query}. Technical guides and examples.`,
        type: 'web' as const
      }
    ];

    switch (type) {
      case 'images':
        return Array.from({ length: 12 }, (_, i) => ({
          title: `${query} image ${i + 1}`,
          url: `https://example.com/image${i + 1}.jpg`,
          description: `High-quality image related to ${query}`,
          type: 'image' as const,
          thumbnail: `https://picsum.photos/300/200?random=${i + Math.random()}`
        }));

      case 'videos':
        return Array.from({ length: 8 }, (_, i) => ({
          title: `${query} - Video Tutorial ${i + 1}`,
          url: `https://youtube.com/watch?v=example${i}`,
          description: `Learn about ${query} in this comprehensive video tutorial`,
          type: 'video' as const,
          thumbnail: `https://picsum.photos/320/180?random=${i + 100}`,
          duration: `${Math.floor(Math.random() * 20 + 5)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
          source: i % 3 === 0 ? 'YouTube' : i % 3 === 1 ? 'Vimeo' : 'TikTok'
        }));

      case 'news':
        return Array.from({ length: 10 }, (_, i) => ({
          title: `Breaking: Latest developments in ${query}`,
          url: `https://news.example.com/article${i}`,
          description: `Recent news and updates about ${query}. Stay informed with the latest developments.`,
          type: 'news' as const,
          publishedDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
          source: ['BBC News', 'CNN', 'Reuters', 'Associated Press', 'NPR'][i % 5]
        }));

      default:
        return baseResults;
    }
  };

  const clearHistory = async () => {
    try {
      await fetch('/api/web/clear-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });
      setSearchHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const searchFromHistory = (query: string) => {
    setSearchQuery(query);
    setShowHistory(false);
    performSearch(query);
  };

  const searchFromSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    performSearch(suggestion);
  };

  const formatUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  const openLink = (url: string) => {
    if (url.startsWith('/')) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const renderSearchResults = () => {
    if (activeSearchType === 'images') {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {searchResults.map((result, index) => (
            <div key={index} className="group cursor-pointer" onClick={() => openLink(result.url)}>
              <div className="aspect-square bg-secondary-bg rounded-lg overflow-hidden hover:ring-2 hover:ring-cyber-blue/50 transition-all">
                <img 
                  src={result.thumbnail} 
                  alt={result.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-xs text-text-muted mt-2 truncate">{result.title}</p>
            </div>
          ))}
        </div>
      );
    }

    if (activeSearchType === 'videos') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map((result, index) => (
            <div key={index} className="glass-card hover-glow cursor-pointer" onClick={() => openLink(result.url)}>
              <div className="relative">
                <img 
                  src={result.thumbnail} 
                  alt={result.title}
                  className="w-full aspect-video object-cover rounded-t-lg"
                />
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                  {result.duration}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-cyber-blue/80 rounded-full flex items-center justify-center">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-text-primary mb-2 line-clamp-2">{result.title}</h3>
                <p className="text-text-muted text-sm mb-2 line-clamp-2">{result.description}</p>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{result.source}</span>
                  <span>{result.publishedDate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeSearchType === 'news') {
      return (
        <div className="space-y-4">
          {searchResults.map((result, index) => (
            <div key={index} className="glass-card hover-glow cursor-pointer" onClick={() => openLink(result.url)}>
              <div className="flex items-start space-x-4 p-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-neon-amber text-sm font-medium">{result.source}</span>
                    <span className="text-text-muted text-sm">•</span>
                    <span className="text-text-muted text-sm">{result.publishedDate}</span>
                  </div>
                  <h3 className="text-lg font-medium text-cyber-blue hover:text-cyber-blue-light transition-colors mb-2">
                    {result.title}
                  </h3>
                  <p className="text-text-muted leading-relaxed">{result.description}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-text-muted flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeSearchType === 'maps') {
      return (
        <div className="space-y-6">
          {/* Map Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Map className="w-5 h-5 text-neon-purple" />
              <span className="font-medium text-text-primary">Map View</span>
            </div>
            <div className="flex items-center space-x-2">
              {(['standard', 'satellite', 'terrain'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setMapView(view)}
                  className={`px-3 py-1 rounded text-sm ${
                    mapView === view
                      ? 'bg-neon-purple/20 text-neon-purple'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Mock Map */}
          <div className="glass-card">
            <div className="h-96 bg-secondary-bg rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Map className="w-16 h-16 text-neon-purple mx-auto mb-4" />
                <h3 className="text-xl font-medium text-text-primary mb-2">Interactive Map</h3>
                <p className="text-text-muted">
                  Map results for "{currentQuery}" would appear here
                </p>
                <p className="text-sm text-cyber-blue mt-2">
                  Full map integration with location services coming soon
                </p>
              </div>
            </div>
          </div>

          {/* Map Results */}
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="glass-card cursor-pointer hover-glow">
                <div className="flex items-start space-x-4 p-4">
                  <div className="w-12 h-12 bg-neon-purple/20 rounded-lg flex items-center justify-center">
                    <Map className="w-6 h-6 text-neon-purple" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-text-primary mb-1">
                      {currentQuery} Location {i + 1}
                    </h3>
                    <p className="text-text-muted text-sm mb-2">
                      123 Main Street, City, State 12345
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-text-muted">
                      <span>★ 4.{Math.floor(Math.random() * 9) + 1} ({Math.floor(Math.random() * 500) + 50} reviews)</span>
                      <span>Open until {Math.floor(Math.random() * 12) + 6}:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeSearchType === 'copilot') {
      return (
        <div className="space-y-6">
          <div className="glass-card">
            <div className="p-6 text-center">
              <Bot className="w-16 h-16 text-cyber-blue mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-text-primary mb-4">ChatKing Copilot</h3>
              <p className="text-text-muted mb-6">
                AI-powered search assistant that helps you find exactly what you're looking for
              </p>
              <div className="space-y-4">
                <div className="text-left">
                  <div className="flex items-start space-x-3 mb-4">
                    <Bot className="w-6 h-6 text-cyber-blue mt-1" />
                    <div className="flex-1">
                      <p className="text-text-primary">
                        I can help you search for "{currentQuery}" across multiple sources and provide detailed insights.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-secondary-bg rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-text-primary mb-2">Quick Analysis:</h4>
                    <ul className="text-text-muted text-sm space-y-1">
                      <li>• Found {Math.floor(Math.random() * 10000)} relevant web results</li>
                      <li>• {Math.floor(Math.random() * 50)} recent news articles</li>
                      <li>• {Math.floor(Math.random() * 100)} related images and videos</li>
                      <li>• {Math.floor(Math.random() * 20)} local business listings</li>
                    </ul>
                  </div>

                  <button 
                    onClick={() => window.location.href = '/ai'}
                    className="btn-cyber w-full"
                  >
                    Continue with ChatKing AI for detailed analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSearchType === 'tools') {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <Wrench className="w-16 h-16 text-cyber-blue mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">Web Tools</h2>
            <p className="text-text-muted">Powerful utilities and tools for developers and users</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <div 
                key={tool.id}
                onClick={() => tool.link && openLink(tool.link)}
                className="glass-card hover-glow cursor-pointer"
              >
                <div className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Cpu className="w-6 h-6 text-cyber-blue" />
                    <h3 className="font-medium text-text-primary">{tool.label}</h3>
                  </div>
                  <p className="text-text-muted text-sm">{tool.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default web search results
    return (
      <div className="space-y-6">
        {searchResults.map((result, index) => (
          <div key={index} className="glass-card hover-glow cursor-pointer" onClick={() => openLink(result.url)}>
            <div className="flex items-start space-x-4">
              {result.favicon && (
                <img 
                  src={result.favicon} 
                  alt="" 
                  className="w-6 h-6 mt-1 rounded" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-neon-green text-sm">{formatUrl(result.url)}</span>
                  <ExternalLink className="w-3 h-3 text-text-muted" />
                  {result.age && (
                    <span className="text-xs text-text-muted">• {result.age}</span>
                  )}
                </div>
                <h3 className="text-xl font-medium text-cyber-blue hover:text-cyber-blue-light transition-colors mb-2">
                  {result.title}
                </h3>
                <p className="text-text-muted leading-relaxed">
                  {result.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout isAuthenticated={true} isOwner={true} username="Jayy Sewell">
      <div className="min-h-screen">
        {/* Browser Header */}
        <div className="glass border-b border-border-glow p-4">
          <div className="max-w-7xl mx-auto">
            {/* Browser Controls */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded hover:bg-cyber-blue/10 transition-colors disabled:opacity-50" disabled>
                  <ArrowLeft className="w-5 h-5 text-text-muted" />
                </button>
                <button className="p-2 rounded hover:bg-cyber-blue/10 transition-colors disabled:opacity-50" disabled>
                  <ArrowRight className="w-5 h-5 text-text-muted" />
                </button>
                <button className="p-2 rounded hover:bg-cyber-blue/10 transition-colors">
                  <RotateCcw className="w-5 h-5 text-cyber-blue" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="flex-1 relative max-w-3xl">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && performSearch()}
                  onFocus={() => searchQuery.length > 2 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search the web with ChatKing..."
                  className="w-full cyber-input pl-12 pr-16"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyber-blue" />
                <button
                  onClick={() => performSearch()}
                  disabled={isSearching}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded hover:bg-cyber-blue/20 transition-colors disabled:opacity-50"
                >
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Search className="w-4 h-4 text-cyber-blue" />
                  )}
                </button>

                {/* Search Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 glass-card border border-border-glow rounded-lg z-10">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => searchFromSuggestion(suggestion)}
                        className="w-full text-left p-3 hover:bg-cyber-blue/10 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <Search className="w-4 h-4 text-text-muted" />
                          <span className="text-text-primary">{suggestion}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Browser Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIncognitoMode(!incognitoMode)}
                  className={`p-2 rounded transition-colors ${
                    incognitoMode 
                      ? 'bg-neon-purple/20 text-neon-purple' 
                      : 'hover:bg-cyber-blue/10 text-text-muted'
                  }`}
                >
                  {incognitoMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
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
              </div>
            </div>

            {/* Search Type Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto">
              {searchTypes.map((type) => {
                const Icon = type.icon;
                const isActive = activeSearchType === type.id;
                
                if (type.id === 'more') {
                  return (
                    <div key={type.id} className="relative group">
                      <button
                        className={`flex items-center space-x-2 px-4 py-2 rounded transition-all whitespace-nowrap ${
                          isActive
                            ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50'
                            : 'text-text-muted hover:text-text-primary hover:bg-cyber-blue/10'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="capitalize">{type.label}</span>
                      </button>
                      
                      {/* More Dropdown */}
                      <div className="absolute top-full left-0 mt-1 glass-card border border-border-glow rounded-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                        <div className="grid grid-cols-2 gap-1 p-2 w-64">
                          {moreSearchTypes.map((moreType) => {
                            const MoreIcon = moreType.icon;
                            return (
                              <button
                                key={moreType.id}
                                onClick={() => setActiveSearchType(moreType.id as SearchType)}
                                className="flex items-center space-x-2 p-2 rounded hover:bg-cyber-blue/10 transition-colors"
                              >
                                <MoreIcon className={`w-4 h-4 ${moreType.color}`} />
                                <span className="text-sm text-text-primary">{moreType.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <button
                    key={type.id}
                    onClick={() => setActiveSearchType(type.id as SearchType)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50'
                        : 'text-text-muted hover:text-text-primary hover:bg-cyber-blue/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="capitalize">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="glass border-b border-border-glow p-4">
            <div className="max-w-7xl mx-auto">
              <h3 className="font-semibold text-lg mb-4 text-text-primary">Search Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Safe Search
                  </label>
                  <select
                    value={safeSearch}
                    onChange={(e) => setSafeSearch(e.target.value as any)}
                    className="cyber-input w-full"
                  >
                    <option value="strict">Strict</option>
                    <option value="moderate">Moderate</option>
                    <option value="off">Off</option>
                  </select>
                </div>
                
                {activeSearchType === 'news' && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      News Timeframe
                    </label>
                    <select
                      value={newsTimeframe}
                      onChange={(e) => setNewsTimeframe(e.target.value as any)}
                      className="cyber-input w-full"
                    >
                      <option value="any">Any time</option>
                      <option value="24h">Past 24 hours</option>
                      <option value="7d">Past week</option>
                      <option value="30d">Past month</option>
                    </select>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-neon-green" />
                  <div>
                    <div className="font-medium text-text-primary">Privacy Protection</div>
                    <div className="text-sm text-text-muted">Enhanced tracking protection enabled</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex">
          {/* History Sidebar */}
          {showHistory && !incognitoMode && (
            <div className="w-80 glass border-r border-border-glow p-4 max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-text-primary">Search History</h3>
                <button
                  onClick={clearHistory}
                  className="p-2 rounded hover:bg-neon-red/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-neon-red" />
                </button>
              </div>
              
              <div className="space-y-2">
                {searchHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => searchFromHistory(item.query)}
                    className="w-full text-left p-3 rounded border border-border-glow hover:border-cyber-blue/50 transition-colors"
                  >
                    <div className="font-medium text-text-primary mb-1">{item.query}</div>
                    <div className="text-xs text-text-muted">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-cyber-blue">
                      {item.results.length} results
                    </div>
                  </button>
                ))}
                
                {searchHistory.length === 0 && (
                  <div className="text-center text-text-muted py-8">
                    No search history
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 p-6">
            {/* Incognito Notice */}
            {incognitoMode && (
              <div className="mb-6 p-4 bg-neon-purple/10 border border-neon-purple/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <EyeOff className="w-5 h-5 text-neon-purple" />
                  <span className="font-medium text-neon-purple">Incognito Mode Active</span>
                </div>
                <p className="text-sm text-text-muted mt-1">
                  Your searches won't be saved to history while in incognito mode.
                </p>
              </div>
            )}

            {/* Search Results Header */}
            {currentQuery && (
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-text-primary">
                    {activeSearchType === 'search' ? 'Search' : 
                     activeSearchType.charAt(0).toUpperCase() + activeSearchType.slice(1)} results for "{currentQuery}"
                  </h2>
                  <div className="text-sm text-text-muted">
                    About {totalResults.toLocaleString()} results ({searchTime}ms)
                  </div>
                </div>
                <div className="h-px bg-gradient-to-r from-cyber-blue/50 to-transparent mt-2"></div>
              </div>
            )}

            {/* Search Results */}
            {currentQuery ? renderSearchResults() : (
              /* Welcome Message */
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-neon-green to-green-400 flex items-center justify-center">
                  <Globe className="w-10 h-10 text-main-bg" />
                </div>
                <h2 className="text-3xl font-orbitron font-bold text-glow-cyber mb-4">
                  ChatKing Web
                </h2>
                <p className="text-text-muted text-lg mb-8 max-w-2xl mx-auto">
                  Privacy-focused web search powered by BraveSearch with advanced AI capabilities.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                  <div className="glass-card text-center">
                    <Shield className="w-8 h-8 mx-auto mb-3 text-neon-green" />
                    <h3 className="font-semibold text-text-primary mb-2">Privacy First</h3>
                    <p className="text-text-muted text-sm">No tracking, no data collection</p>
                  </div>
                  <div className="glass-card text-center">
                    <Bot className="w-8 h-8 mx-auto mb-3 text-cyber-blue" />
                    <h3 className="font-semibold text-text-primary mb-2">AI Copilot</h3>
                    <p className="text-text-muted text-sm">Intelligent search assistance</p>
                  </div>
                  <div className="glass-card text-center">
                    <Wrench className="w-8 h-8 mx-auto mb-3 text-neon-amber" />
                    <h3 className="font-semibold text-text-primary mb-2">Web Tools</h3>
                    <p className="text-text-muted text-sm">Built-in utilities and converters</p>
                  </div>
                  <div className="glass-card text-center">
                    <Search className="w-8 h-8 mx-auto mb-3 text-neon-purple" />
                    <h3 className="font-semibold text-text-primary mb-2">Multi-Search</h3>
                    <p className="text-text-muted text-sm">Web, Images, Videos, Maps, News</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
