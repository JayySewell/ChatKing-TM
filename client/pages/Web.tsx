import { useState, useEffect, useRef } from "react";
import {
  Globe,
  Search,
  Shield,
  Wifi,
  History,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Star,
  ExternalLink,
  Clock,
  Filter,
  Image,
  Video,
  Newspaper,
} from "lucide-react";
import { Layout } from "../components/Layout";

interface SearchResult {
  title: string;
  url: string;
  description: string;
  favicon?: string;
  age?: string;
  type: "web" | "news" | "image" | "video";
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

export default function Web() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<
    "web" | "news" | "images" | "videos"
  >("web");
  const [incognitoMode, setIncognitoMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [safeSearch, setSafeSearch] = useState<"strict" | "moderate" | "off">(
    "moderate",
  );
  const [currentQuery, setCurrentQuery] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [userId] = useState("demo-user");
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      console.error("Failed to load search history:", error);
    }
  };

  const loadSuggestions = async (query: string) => {
    try {
      const response = await fetch(
        `/api/web/suggestions?query=${encodeURIComponent(query)}`,
      );
      const data = await response.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    }
  };

  const performSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);
    setCurrentQuery(searchTerm);

    try {
      const response = await fetch("/api/web/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchTerm,
          userId: userId,
          type: searchType,
          count: 20,
          safeSearch: safeSearch,
          incognito: incognitoMode,
        }),
      });

      const data: SearchResponse = await response.json();

      if (data.results) {
        setSearchResults(data.results);
        setTotalResults(data.totalResults);
        setSearchTime(data.searchTime);

        if (!incognitoMode) {
          loadSearchHistory();
        }
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearHistory = async () => {
    try {
      await fetch("/api/web/clear-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      setSearchHistory([]);
    } catch (error) {
      console.error("Failed to clear history:", error);
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

  const getSearchTypeIcon = (type: typeof searchType) => {
    switch (type) {
      case "web":
        return Globe;
      case "news":
        return Newspaper;
      case "images":
        return Image;
      case "videos":
        return Video;
      default:
        return Globe;
    }
  };

  const formatUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace("www.", "");
    } catch {
      return url;
    }
  };

  const openLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Layout isAuthenticated={true} isOwner={true} username="Owner">
      <div className="min-h-screen">
        {/* Browser Header */}
        <div className="glass border-b border-border-glow p-4">
          <div className="max-w-7xl mx-auto">
            {/* Browser Controls */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <button
                  className="p-2 rounded hover:bg-cyber-blue/10 transition-colors disabled:opacity-50"
                  disabled
                >
                  <ArrowLeft className="w-5 h-5 text-text-muted" />
                </button>
                <button
                  className="p-2 rounded hover:bg-cyber-blue/10 transition-colors disabled:opacity-50"
                  disabled
                >
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
                  onKeyPress={(e) => e.key === "Enter" && performSearch()}
                  onFocus={() =>
                    searchQuery.length > 2 && setShowSuggestions(true)
                  }
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 200)
                  }
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
                          <span className="text-text-primary">
                            {suggestion}
                          </span>
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
                      ? "bg-neon-purple/20 text-neon-purple"
                      : "hover:bg-cyber-blue/10 text-text-muted"
                  }`}
                >
                  {incognitoMode ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
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
            <div className="flex items-center space-x-1">
              {(["web", "news", "images", "videos"] as const).map((type) => {
                const Icon = getSearchTypeIcon(type);
                return (
                  <button
                    key={type}
                    onClick={() => setSearchType(type)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded transition-all ${
                      searchType === type
                        ? "bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50"
                        : "text-text-muted hover:text-text-primary hover:bg-cyber-blue/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="capitalize">{type}</span>
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
              <h3 className="font-semibold text-lg mb-4 text-text-primary">
                Search Settings
              </h3>
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
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-neon-green" />
                  <div>
                    <div className="font-medium text-text-primary">
                      Privacy Protection
                    </div>
                    <div className="text-sm text-text-muted">
                      Enhanced tracking protection enabled
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Wifi className="w-5 h-5 text-neon-amber" />
                  <div>
                    <div className="font-medium text-text-primary">
                      VPN Status
                    </div>
                    <div className="text-sm text-text-muted">
                      Ready for secure browsing
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex">
          {/* History Sidebar */}
          {showHistory && !incognitoMode && (
            <div className="w-80 glass border-r border-border-glow p-4 h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-text-primary">
                  Search History
                </h3>
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
                    <div className="font-medium text-text-primary mb-1">
                      {item.query}
                    </div>
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
                  <span className="font-medium text-neon-purple">
                    Incognito Mode Active
                  </span>
                </div>
                <p className="text-sm text-text-muted mt-1">
                  Your searches won't be saved to history while in incognito
                  mode.
                </p>
              </div>
            )}

            {/* Search Results Header */}
            {currentQuery && (
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-text-primary">
                    Search results for "{currentQuery}"
                  </h2>
                  <div className="text-sm text-text-muted">
                    About {totalResults.toLocaleString()} results ({searchTime}
                    ms)
                  </div>
                </div>
                <div className="h-px bg-gradient-to-r from-cyber-blue/50 to-transparent mt-2"></div>
              </div>
            )}

            {/* Search Results */}
            <div className="space-y-6">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="glass-card hover-glow cursor-pointer"
                  onClick={() => openLink(result.url)}
                >
                  <div className="flex items-start space-x-4">
                    {result.favicon && (
                      <img
                        src={result.favicon}
                        alt=""
                        className="w-6 h-6 mt-1 rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-neon-green text-sm">
                          {formatUrl(result.url)}
                        </span>
                        <ExternalLink className="w-3 h-3 text-text-muted" />
                        {result.age && (
                          <span className="text-xs text-text-muted">
                            • {result.age}
                          </span>
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

              {/* No Results */}
              {currentQuery && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-12">
                  <Globe className="w-16 h-16 text-text-muted mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-text-primary mb-2">
                    No results found
                  </h3>
                  <p className="text-text-muted">
                    Try different keywords or check your spelling.
                  </p>
                </div>
              )}

              {/* Loading */}
              {isSearching && (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-cyber-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-text-muted">Searching the web...</p>
                </div>
              )}

              {/* Welcome Message */}
              {!currentQuery && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-neon-green to-green-400 flex items-center justify-center">
                    <Globe className="w-10 h-10 text-main-bg" />
                  </div>
                  <h2 className="text-3xl font-orbitron font-bold text-glow-cyber mb-4">
                    ChatKing Web
                  </h2>
                  <p className="text-text-muted text-lg mb-8 max-w-2xl mx-auto">
                    Privacy-focused web search powered by BraveSearch. Browse
                    with confidence using built-in tracking protection and VPN
                    capabilities.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                    <div className="glass-card text-center">
                      <Shield className="w-8 h-8 mx-auto mb-3 text-neon-green" />
                      <h3 className="font-semibold text-text-primary mb-2">
                        Privacy First
                      </h3>
                      <p className="text-text-muted text-sm">
                        No tracking, no data collection
                      </p>
                    </div>
                    <div className="glass-card text-center">
                      <Wifi className="w-8 h-8 mx-auto mb-3 text-neon-amber" />
                      <h3 className="font-semibold text-text-primary mb-2">
                        VPN Ready
                      </h3>
                      <p className="text-text-muted text-sm">
                        Secure global browsing
                      </p>
                    </div>
                    <div className="glass-card text-center">
                      <Search className="w-8 h-8 mx-auto mb-3 text-cyber-blue" />
                      <h3 className="font-semibold text-text-primary mb-2">
                        Fast Results
                      </h3>
                      <p className="text-text-muted text-sm">
                        Powered by BraveSearch
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
