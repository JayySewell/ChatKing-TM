import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Home,
  Shield,
  Globe,
  ExternalLink,
  Download,
  Bookmark,
  Star,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Lock,
  Unlock,
  Search,
  Image,
  Video,
  Map,
  FileText,
  Zap,
} from "lucide-react";

interface BrowserProps {
  initialUrl?: string;
  searchType?: "web" | "images" | "videos" | "maps" | "news";
  searchQuery?: string;
  onNavigate?: (url: string) => void;
  showControls?: boolean;
  embedded?: boolean;
}

interface SearchResult {
  title: string;
  url: string;
  description: string;
  favicon?: string;
  age?: string;
  type: "web" | "news" | "image" | "video";
  thumbnail?: string;
  metadata?: any;
}

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isActive: boolean;
  isLoading: boolean;
  searchType?: string;
}

export default function InternalBrowser({
  initialUrl = "",
  searchType = "web",
  searchQuery = "",
  onNavigate,
  showControls = true,
  embedded = false,
}: BrowserProps) {
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: "main",
      title: "ChatKing Web",
      url: initialUrl,
      isActive: true,
      isLoading: false,
      searchType,
    },
  ]);
  
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeSearchType, setActiveSearchType] = useState(searchType);
  const [addressBar, setAddressBar] = useState(initialUrl);
  const [isSecure, setIsSecure] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showPrivacyMode, setShowPrivacyMode] = useState(false);
  const [contentFilter, setContentFilter] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery, activeSearchType);
    }
  }, [searchQuery, activeSearchType]);

  useEffect(() => {
    if (currentUrl) {
      setIsSecure(currentUrl.startsWith("https://"));
      setAddressBar(currentUrl);
    }
  }, [currentUrl]);

  const performSearch = async (query: string, type: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/web/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          userId: "current-user",
          type: type === "web" ? "web" : type,
          count: 20,
          incognito: showPrivacyMode,
        }),
      });

      const data = await response.json();
      
      if (data.results) {
        setSearchResults(data.results);
        updateActiveTab({ title: `${query} - ChatKing Search`, url: `search://${query}` });
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToUrl = async (url: string) => {
    setIsLoading(true);
    
    // Add to history
    const newHistory = [...history.slice(0, historyIndex + 1), url];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCanGoBack(newHistory.length > 1);
    setCanGoForward(false);
    
    setCurrentUrl(url);
    setAddressBar(url);
    
    if (onNavigate) {
      onNavigate(url);
    }
    
    // Simulate loading time
    setTimeout(() => setIsLoading(false), 500);
  };

  const goBack = () => {
    if (canGoBack && historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
      setCanGoBack(newIndex > 0);
      setCanGoForward(true);
    }
  };

  const goForward = () => {
    if (canGoForward && historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
      setCanGoForward(newIndex < history.length - 1);
      setCanGoBack(true);
    }
  };

  const refresh = () => {
    setIsLoading(true);
    if (currentUrl.startsWith("search://")) {
      const query = currentUrl.replace("search://", "");
      performSearch(query, activeSearchType);
    } else {
      // Refresh iframe
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src;
      }
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const handleAddressBarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (addressBar.includes(".") || addressBar.startsWith("http")) {
      // It's a URL
      navigateToUrl(addressBar);
    } else {
      // It's a search query
      performSearch(addressBar, activeSearchType);
    }
  };

  const updateActiveTab = (updates: Partial<BrowserTab>) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.isActive ? { ...tab, ...updates } : tab
      )
    );
  };

  const addNewTab = () => {
    const newTab: BrowserTab = {
      id: Date.now().toString(),
      title: "New Tab",
      url: "",
      isActive: true,
      isLoading: false,
    };
    
    setTabs(prevTabs => [
      ...prevTabs.map(tab => ({ ...tab, isActive: false })),
      newTab,
    ]);
    setCurrentUrl("");
    setAddressBar("");
  };

  const closeTab = (tabId: string) => {
    setTabs(prevTabs => {
      const newTabs = prevTabs.filter(tab => tab.id !== tabId);
      if (newTabs.length === 0) {
        return [
          {
            id: "main",
            title: "ChatKing Web",
            url: "",
            isActive: true,
            isLoading: false,
          },
        ];
      }
      return newTabs;
    });
  };

  const switchTab = (tabId: string) => {
    setTabs(prevTabs =>
      prevTabs.map(tab => ({
        ...tab,
        isActive: tab.id === tabId,
      }))
    );
    
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setCurrentUrl(tab.url);
      setAddressBar(tab.url);
    }
  };

  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Globe className="w-16 h-16 text-text-muted mb-4" />
          <h3 className="text-xl font-medium text-text-primary mb-2">
            No Results Found
          </h3>
          <p className="text-text-muted">Try a different search term or check your spelling.</p>
        </div>
      );
    }

    if (activeSearchType === "images") {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
          {searchResults.map((result, index) => (
            <div
              key={index}
              className="group cursor-pointer rounded-lg overflow-hidden border border-border-glow hover:border-neon-purple/50 transition-all"
              onClick={() => navigateToUrl(result.url)}
            >
              <div className="aspect-square bg-secondary-bg relative">
                {result.thumbnail ? (
                  <img
                    src={result.thumbnail}
                    alt={result.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-8 h-8 text-text-muted" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
              <div className="p-2">
                <h4 className="text-sm font-medium text-text-primary truncate">
                  {result.title}
                </h4>
                <p className="text-xs text-text-muted truncate">{result.url}</p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeSearchType === "videos") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {searchResults.map((result, index) => (
            <div
              key={index}
              className="group cursor-pointer rounded-lg overflow-hidden border border-border-glow hover:border-neon-purple/50 transition-all"
              onClick={() => navigateToUrl(result.url)}
            >
              <div className="aspect-video bg-secondary-bg relative">
                {result.thumbnail ? (
                  <img
                    src={result.thumbnail}
                    alt={result.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-8 h-8 text-text-muted" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-3">
                <h4 className="font-medium text-text-primary line-clamp-2 mb-1">
                  {result.title}
                </h4>
                <p className="text-sm text-text-muted line-clamp-2 mb-2">
                  {result.description}
                </p>
                <p className="text-xs text-text-muted">{result.url}</p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Default web results
    return (
      <div className="space-y-4 p-4">
        {searchResults.map((result, index) => (
          <div
            key={index}
            className="group cursor-pointer p-4 rounded-lg border border-border-glow hover:border-neon-purple/50 hover:bg-secondary-bg/30 transition-all"
            onClick={() => navigateToUrl(result.url)}
          >
            <div className="flex items-start space-x-3">
              {result.favicon && (
                <img
                  src={result.favicon}
                  alt=""
                  className="w-4 h-4 mt-1 flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-neon-purple group-hover:text-purple-300 transition-colors line-clamp-1">
                  {result.title}
                </h3>
                <div className="flex items-center space-x-2 mt-1 mb-2">
                  <span className="text-sm text-neon-green">{result.url}</span>
                  {result.age && (
                    <span className="text-xs text-text-muted">• {result.age}</span>
                  )}
                  <ExternalLink className="w-3 h-3 text-text-muted" />
                </div>
                <p className="text-text-muted line-clamp-2 leading-relaxed">
                  {result.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderWebPage = () => {
    if (!currentUrl || currentUrl.startsWith("search://")) {
      return renderSearchResults();
    }

    // Check if it's a safe URL to embed
    const isSafeToEmbed = (url: string) => {
      const unsafeHosts = ["youtube.com", "vimeo.com", "facebook.com", "twitter.com"];
      try {
        const urlObj = new URL(url);
        return !unsafeHosts.some(host => urlObj.hostname.includes(host));
      } catch {
        return false;
      }
    };

    if (!isSafeToEmbed(currentUrl)) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <ExternalLink className="w-16 h-16 text-text-muted mb-4" />
          <h3 className="text-xl font-medium text-text-primary mb-2">
            External Site
          </h3>
          <p className="text-text-muted mb-4 text-center">
            This site cannot be displayed in the internal browser for security reasons.
          </p>
          <button
            onClick={() => window.open(currentUrl, "_blank")}
            className="btn-cyber"
          >
            Open in New Tab
          </button>
        </div>
      );
    }

    return (
      <iframe
        ref={iframeRef}
        src={currentUrl}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        title="Internal Browser"
        onLoad={() => setIsLoading(false)}
      />
    );
  };

  if (embedded) {
    return (
      <div className="w-full h-96 border border-border-glow rounded-lg overflow-hidden">
        {renderWebPage()}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-main-bg">
      {/* Tab Bar */}
      {showControls && (
        <div className="flex items-center bg-secondary-bg border-b border-border-glow">
          <div className="flex-1 flex items-center overflow-x-auto">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center space-x-2 px-4 py-2 border-r border-border-glow cursor-pointer min-w-0 max-w-xs ${
                  tab.isActive ? "bg-main-bg" : "hover:bg-main-bg/50"
                }`}
                onClick={() => switchTab(tab.id)}
              >
                <div className="w-4 h-4 flex-shrink-0">
                  {tab.isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : tab.favicon ? (
                    <img src={tab.favicon} alt="" className="w-4 h-4" />
                  ) : (
                    <Globe className="w-4 h-4 text-text-muted" />
                  )}
                </div>
                <span className="text-sm truncate flex-1">{tab.title}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="text-text-muted hover:text-text-primary"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addNewTab}
            className="px-3 py-2 text-text-muted hover:text-text-primary"
          >
            +
          </button>
        </div>
      )}

      {/* Controls Bar */}
      {showControls && (
        <div className="flex items-center space-x-2 p-2 bg-secondary-bg border-b border-border-glow">
          <div className="flex items-center space-x-1">
            <button
              onClick={goBack}
              disabled={!canGoBack}
              className="p-2 rounded hover:bg-main-bg/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goForward}
              disabled={!canGoForward}
              className="p-2 rounded hover:bg-main-bg/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={refresh}
              className="p-2 rounded hover:bg-main-bg/50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => navigateToUrl("")}
              className="p-2 rounded hover:bg-main-bg/50"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddressBarSubmit} className="flex-1 flex items-center">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                {isSecure ? (
                  <Lock className="w-4 h-4 text-green-500" />
                ) : (
                  <Unlock className="w-4 h-4 text-text-muted" />
                )}
              </div>
              <input
                type="text"
                value={addressBar}
                onChange={(e) => setAddressBar(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-main-bg border border-border-glow rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-transparent"
                placeholder="Search or enter URL..."
              />
            </div>
          </form>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowPrivacyMode(!showPrivacyMode)}
              className={`p-2 rounded hover:bg-main-bg/50 ${
                showPrivacyMode ? "text-neon-purple" : "text-text-muted"
              }`}
              title="Privacy Mode"
            >
              {showPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setContentFilter(!contentFilter)}
              className={`p-2 rounded hover:bg-main-bg/50 ${
                contentFilter ? "text-neon-green" : "text-text-muted"
              }`}
              title="Content Filter"
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search Type Selector */}
      {(currentUrl.startsWith("search://") || !currentUrl) && (
        <div className="flex items-center space-x-1 p-2 bg-secondary-bg/50 border-b border-border-glow">
          {[
            { id: "web", label: "All", icon: Search },
            { id: "images", label: "Images", icon: Image },
            { id: "videos", label: "Videos", icon: Video },
            { id: "maps", label: "Maps", icon: Map },
            { id: "news", label: "News", icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSearchType(id)}
              className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-all ${
                activeSearchType === id
                  ? "bg-neon-purple text-main-bg"
                  : "text-text-muted hover:text-text-primary hover:bg-main-bg/30"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-main-bg/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-6 h-6 animate-spin text-neon-purple" />
              <span className="text-text-primary">Loading...</span>
            </div>
          </div>
        )}
        {renderWebPage()}
      </div>

      {/* Status Bar */}
      {showControls && (
        <div className="flex items-center justify-between px-4 py-1 bg-secondary-bg border-t border-border-glow text-xs text-text-muted">
          <div className="flex items-center space-x-4">
            <span>Ready</span>
            {showPrivacyMode && (
              <span className="flex items-center space-x-1">
                <EyeOff className="w-3 h-3" />
                <span>Private Browsing</span>
              </span>
            )}
            {contentFilter && (
              <span className="flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>Content Filtered</span>
              </span>
            )}
          </div>
          <div>
            {searchResults.length > 0 && (
              <span>{searchResults.length} results</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
