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

  constructor(apiKey: string = "BSAjvpAPq4Pz7lbp6px2jI4aXacwkI6") {
    this.apiKey = apiKey;
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

      const response = await fetch(`${this.baseUrl}${endpoint}?${params}`, {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Brave Search API error: ${response.status} - ${response.statusText}`,
        );
      }

      const data: BraveApiResponse = await response.json();
      const searchTime = Date.now() - startTime;

      return this.formatSearchResults(data, query, searchTime, searchType);
    } catch (error) {
      console.error("Brave Search error:", error);

      // Return mock results for development
      return this.getMockResults(query, options.type || "web");
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
    return this.apiKey && this.apiKey.length > 10;
  }

  updateApiKey(newKey: string): void {
    this.apiKey = newKey;
  }
}

export const braveSearchService = new BraveSearchService();
