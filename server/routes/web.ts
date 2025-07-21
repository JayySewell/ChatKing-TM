import { RequestHandler } from "express";
import { braveSearchService } from "../services/bravesearch";
import { ckStorage } from "../storage/ck-storage";

interface SearchRequest {
  query: string;
  userId: string;
  type?: "web" | "news" | "images" | "videos";
  count?: number;
  offset?: number;
  safeSearch?: "strict" | "moderate" | "off";
  incognito?: boolean;
}

interface SuggestionRequest {
  query: string;
  userId: string;
}

export const handleSearch: RequestHandler = async (req, res) => {
  try {
    const {
      query,
      userId,
      type = "web",
      count = 10,
      offset = 0,
      safeSearch = "moderate",
      incognito = false,
    }: SearchRequest = req.body;

    if (!query || !userId) {
      return res.status(400).json({
        error: "Missing required fields: query, userId",
      });
    }

    // Perform search
    const searchResults = await braveSearchService.search(query, {
      type,
      count,
      offset,
      safeSearch,
    });

    // Log search to storage (unless incognito mode)
    if (!incognito) {
      await ckStorage.addSearchHistory(userId, query, searchResults.results);

      // Log analytics
      await ckStorage.logAnalytics("web_search", {
        userId,
        query,
        type,
        resultCount: searchResults.totalResults,
        searchTime: searchResults.searchTime,
        incognito: false,
      });
    } else {
      // Still log analytics for incognito (but not search history)
      await ckStorage.logAnalytics("web_search", {
        userId,
        type,
        resultCount: searchResults.totalResults,
        searchTime: searchResults.searchTime,
        incognito: true,
      });
    }

    res.json({
      ...searchResults,
      incognito,
    });
  } catch (error) {
    console.error("Web Search Error:", error);
    res.status(500).json({
      error: "Failed to perform search",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetSuggestions: RequestHandler = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter required" });
    }

    const suggestions = await braveSearchService.getSuggestions(query);

    res.json({ suggestions });
  } catch (error) {
    console.error("Get Suggestions Error:", error);
    res.status(500).json({
      error: "Failed to get search suggestions",
    });
  }
};

export const handleGetSearchHistory: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    const history = await ckStorage.getUserSearchHistory(userId, limit);

    res.json({
      history,
      count: history.length,
    });
  } catch (error) {
    console.error("Get Search History Error:", error);
    res.status(500).json({
      error: "Failed to fetch search history",
    });
  }
};

export const handleClearSearchHistory: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    // In a real implementation, you'd add a clear method to CKStorage
    // For now, we'll just return success

    // Log analytics
    await ckStorage.logAnalytics("search_history_cleared", {
      userId,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Clear Search History Error:", error);
    res.status(500).json({
      error: "Failed to clear search history",
    });
  }
};

export const handleGetPageContent: RequestHandler = async (req, res) => {
  try {
    const { url, userId } = req.body;

    if (!url || !userId) {
      return res.status(400).json({
        error: "Missing required fields: url, userId",
      });
    }

    // In a real implementation, this would fetch and parse web page content
    // For now, return mock content
    const mockContent = {
      url,
      title: "Web Page Content",
      content:
        "This feature would fetch and display the content of the requested web page in a safe, sanitized format.",
      timestamp: new Date().toISOString(),
      success: true,
    };

    // Log analytics
    await ckStorage.logAnalytics("page_view", {
      userId,
      url,
      timestamp: new Date(),
    });

    res.json(mockContent);
  } catch (error) {
    console.error("Get Page Content Error:", error);
    res.status(500).json({
      error: "Failed to fetch page content",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleProxyRequest: RequestHandler = async (req, res) => {
  try {
    const { url, userId, useVPN = false } = req.body;

    if (!url || !userId) {
      return res.status(400).json({
        error: "Missing required fields: url, userId",
      });
    }

    // In a real implementation, this would proxy the request through VPN/proxy
    // For now, return mock response
    const mockResponse = {
      url,
      success: true,
      vpnEnabled: useVPN,
      proxyLocation: useVPN ? "Netherlands" : "Direct",
      message:
        "This feature would proxy web requests through secure VPN endpoints for enhanced privacy.",
      timestamp: new Date().toISOString(),
    };

    // Log analytics
    await ckStorage.logAnalytics("proxy_request", {
      userId,
      url,
      vpnEnabled: useVPN,
      timestamp: new Date(),
    });

    res.json(mockResponse);
  } catch (error) {
    console.error("Proxy Request Error:", error);
    res.status(500).json({
      error: "Failed to proxy request",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
