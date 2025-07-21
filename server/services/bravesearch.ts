interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  favicon?: string;
  age?: string;
  type: "web" | "news" | "image" | "video";
}

interface BraveSearchResponse {
  query: string;
  results: BraveSearchResult[];
  totalResults: number;
  suggestedQueries?: string[];
  searchTime: number;
}

interface BraveApiResponse {
  web?: {
    results: Array<{
      title: string;
      url: string;
      description: string;
      favicon?: string;
      age?: string;
    }>;
  };
  news?: {
    results: Array<{
      title: string;
      url: string;
      description: string;
      age?: string;
    }>;
  };
  images?: {
    results: Array<{
      title: string;
      url: string;
      thumbnail: string;
      source: string;
    }>;
  };
  videos?: {
    results: Array<{
      title: string;
      url: string;
      thumbnail: string;
      description: string;
      duration?: string;
    }>;
  };
  query: {
    original: string;
    altered?: string;
  };
}

export class BraveSearchService {
  private apiKey: string;
  private baseUrl = "https://api.search.brave.com/res/v1";
  private rateLimitDelay: number;
  private lastRequestTime: number;
  private connectionTested: boolean;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.BRAVE_SEARCH_API_KEY || "BSAjvpAPq4Pz7lbp6px2jI4aXacwkI6";
    this.rateLimitDelay = 1000; // 1 second between requests
    this.lastRequestTime = 0;
    this.connectionTested = false;
  }

  async search(
    query: string,
    options: {
      type?: "web" | "news" | "images" | "videos";
      count?: number;
      offset?: number;
      safeSearch?: "strict" | "moderate" | "off";
      country?: string;
      freshness?: "pd" | "pw" | "pm" | "py"; // past day, week, month, year
    } = {},
  ): Promise<BraveSearchResponse> {
    const startTime = Date.now();

    try {
      const searchType = options.type || "web";
      const endpoint =
        searchType === "web" ? "/web/search" : `/${searchType}/search`;

      const params = new URLSearchParams({
        q: query,
        count: (options.count || 10).toString(),
        offset: (options.offset || 0).toString(),
        safesearch: options.safeSearch || "moderate",
        country: options.country || "US",
        ...(options.freshness && { freshness: options.freshness }),
      });

      // Rate limiting
      const now = Date.now();
      if (now - this.lastRequestTime < this.rateLimitDelay) {
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - (now - this.lastRequestTime)));
      }
      this.lastRequestTime = Date.now();

      const response = await fetch(`${this.baseUrl}${endpoint}?${params}`, {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": this.apiKey,
          "User-Agent": "ChatKing-AI/2.0",
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`Brave Search API Error ${response.status}:`, errorText);

        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Brave Search API key.');
        }
        if (response.status === 403) {
          throw new Error('Access forbidden. Please check your API key permissions.');
        }
        if (response.status === 400) {
          throw new Error('Invalid search query or parameters.');
        }

        throw new Error(`Brave Search API error: ${response.status} - ${errorText || response.statusText}`);
      }

      const data: BraveApiResponse = await response.json();
      const searchTime = Date.now() - startTime;

      return this.formatSearchResults(data, query, searchTime, searchType);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error("Brave Search request timeout:", error);
        } else if (error.message.includes('fetch')) {
          console.error("Network error connecting to Brave Search:", error);
        } else {
          console.error("Brave Search error:", error.message);
        }
      } else {
        console.error("Unknown Brave Search error:", error);
      }

      // Return mock results for development/fallback
      const mockResponse = this.getMockResults(query, options.type || "web");
      mockResponse.error = error instanceof Error ? error.message : 'Unknown error';
      return mockResponse;
    }
  }

  private formatSearchResults(
    data: BraveApiResponse,
    query: string,
    searchTime: number,
    type: string,
  ): BraveSearchResponse {
    let results: BraveSearchResult[] = [];
    let totalResults = 0;

    if (type === "web" && data.web?.results) {
      results = data.web.results.map((result) => ({
        title: result.title,
        url: result.url,
        description: result.description,
        favicon: result.favicon,
        age: result.age,
        type: "web" as const,
      }));
      totalResults = data.web.results.length;
    }

    if (type === "news" && data.news?.results) {
      results = data.news.results.map((result) => ({
        title: result.title,
        url: result.url,
        description: result.description,
        age: result.age,
        type: "news" as const,
      }));
      totalResults = data.news.results.length;
    }

    if (type === "images" && data.images?.results) {
      results = data.images.results.map((result) => ({
        title: result.title,
        url: result.url,
        description: result.source,
        favicon: result.thumbnail,
        type: "image" as const,
      }));
      totalResults = data.images.results.length;
    }

    if (type === "videos" && data.videos?.results) {
      results = data.videos.results.map((result) => ({
        title: result.title,
        url: result.url,
        description: result.description,
        favicon: result.thumbnail,
        type: "video" as const,
      }));
      totalResults = data.videos.results.length;
    }

    return {
      query: data.query.original || query,
      results,
      totalResults,
      searchTime,
    };
  }

  private getMockResults(query: string, type: string): BraveSearchResponse {
    const mockResults: BraveSearchResult[] = [
      {
        title: `Search results for "${query}"`,
        url: "https://example.com",
        description:
          "This is a mock result while the BraveSearch API is being configured. The real implementation will show actual search results.",
        type: type as any,
      },
      {
        title: "ChatKing Web Browser",
        url: "https://chatkingai.com/web",
        description:
          "ChatKing's integrated web browser with privacy features and real-time search capabilities.",
        type: type as any,
      },
      {
        title: "Sample Result 3",
        url: "https://example.org",
        description:
          "Another mock result to demonstrate the search interface. Real results will come from BraveSearch API.",
        type: type as any,
      },
    ];

    return {
      query,
      results: mockResults,
      totalResults: mockResults.length,
      searchTime: 150,
    };
  }

  async getSuggestions(query: string): Promise<string[]> {
    try {
      // In a real implementation, this would call Brave's suggestion API
      const commonSuggestions = [
        `${query} tutorial`,
        `${query} examples`,
        `${query} guide`,
        `${query} documentation`,
        `${query} vs alternatives`,
      ];

      return commonSuggestions.slice(0, 5);
    } catch (error) {
      console.error("Failed to get search suggestions:", error);
      return [];
    }
  }

  validateApiKey(): boolean {
    return this.apiKey && this.apiKey.length > 20 && this.apiKey !== "BSAjvpAPq4Pz7lbp6px2jI4aXacwkI6";
  }

  updateApiKey(newKey: string): void {
    this.apiKey = newKey;
    this.connectionTested = false; // Reset connection test when key changes
  }

  async testConnection(): Promise<{ connected: boolean; error?: string; responseTime?: number }> {
    if (!this.validateApiKey()) {
      return { connected: false, error: 'Invalid or default API key' };
    }

    const startTime = Date.now();
    try {
      const testResult = await this.search('test connection', { count: 1 });
      const responseTime = Date.now() - startTime;
      this.connectionTested = true;

      return {
        connected: !testResult.error,
        responseTime,
        error: testResult.error
      };
    } catch (error) {
      return {
        connected: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getApiKeyStatus(): { valid: boolean; type: string; tested: boolean } {
    if (!this.apiKey) {
      return { valid: false, type: 'missing', tested: false };
    }
    if (this.apiKey === 'BSAjvpAPq4Pz7lbp6px2jI4aXacwkI6') {
      return { valid: false, type: 'default', tested: false };
    }
    if (this.apiKey.length < 20) {
      return { valid: false, type: 'invalid', tested: false };
    }
    return { valid: true, type: 'valid', tested: this.connectionTested };
  }

  async getSearchStats(): Promise<{ totalSearches: number; successRate: number; avgResponseTime: number }> {
    // In a real implementation, you'd track these metrics
    return {
      totalSearches: 0,
      successRate: 0.95,
      avgResponseTime: 250,
    };
  }
}

export const braveSearchService = new BraveSearchService();
