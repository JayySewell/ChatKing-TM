interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export class OpenRouterService {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";
  private rateLimitDelay: number;
  private lastRequestTime: number;
  private connectionTested: boolean;
  private requestCount: number;
  private errorCount: number;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || "";
    this.rateLimitDelay = 500; // 500ms between requests
    this.lastRequestTime = 0;
    this.connectionTested = false;
    this.requestCount = 0;
    this.errorCount = 0;
  }

  async sendMessage(
    model: string,
    messages: OpenRouterMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {},
  ): Promise<OpenRouterResponse> {
    const requestBody: OpenRouterRequest = {
      model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000,
      stream: options.stream || false,
    };

    // Rate limiting
    const now = Date.now();
    if (now - this.lastRequestTime < this.rateLimitDelay) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.rateLimitDelay - (now - this.lastRequestTime)),
      );
    }
    this.lastRequestTime = Date.now();
    this.requestCount++;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://chatkingai.com",
          "X-Title": "ChatKing AI Platform",
          "User-Agent": "ChatKing-AI/2.0",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        this.errorCount++;
        const errorText = await response.text().catch(() => "Unknown error");

        console.error(`OpenRouter API Error ${response.status}:`, errorText);

        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        if (response.status === 401) {
          throw new Error(
            "Invalid API key. Please check your OpenRouter API key.",
          );
        }
        if (response.status === 403) {
          throw new Error(
            "Access forbidden. Please check your API key permissions.",
          );
        }
        if (response.status === 400) {
          throw new Error(`Invalid request: ${errorText}`);
        }
        if (response.status === 503) {
          throw new Error(
            "OpenRouter service unavailable. Please try again later.",
          );
        }

        throw new Error(
          `OpenRouter API error: ${response.status} - ${errorText}`,
        );
      }

      const result = await response.json();

      // Log successful request for analytics
      if (result.usage) {
        console.log(
          `OpenRouter: ${result.usage.total_tokens} tokens used for model ${model}`,
        );
      }

      return result;
    } catch (error) {
      this.errorCount++;

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("Request timeout. Please try again.");
        }
        if (error.message.includes("fetch")) {
          throw new Error(
            "Network error. Please check your internet connection.",
          );
        }
        throw error;
      }

      throw new Error("Unknown error occurred while processing your request.");
    }
  }

  async getAvailableModels(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }

      // Return default models if API call fails
      return this.getDefaultModels();
    } catch (error) {
      console.error("Failed to fetch models from OpenRouter:", error);
      return this.getDefaultModels();
    }
  }

  private getDefaultModels() {
    return [
      {
        id: "google/gemma-2-9b-it:free",
        name: "Gemma 2 9B Free",
        description:
          "Google's powerful instruction-tuned model with excellent reasoning",
        context_length: 8192,
        pricing: { prompt: "0", completion: "0" },
        isFree: true,
        capabilities: ["text", "reasoning", "code"],
      },
      {
        id: "microsoft/phi-3-medium-128k-instruct:free",
        name: "Phi-3 Medium Free",
        description: "Microsoft's balanced capability model for general tasks",
        context_length: 128000,
        pricing: { prompt: "0", completion: "0" },
        isFree: true,
        capabilities: ["text", "reasoning", "code", "long-context"],
      },
      {
        id: "qwen/qwen-2.5-7b-instruct:free",
        name: "Qwen 2.5 7B Free",
        description: "Alibaba's efficient multilingual model",
        context_length: 32768,
        pricing: { prompt: "0", completion: "0" },
        isFree: true,
        capabilities: ["text", "multilingual", "reasoning"],
      },
      {
        id: "meta-llama/llama-3.2-3b-instruct:free",
        name: "Llama 3.2 3B Free",
        description: "Meta's compact but capable instruction-following model",
        context_length: 131072,
        pricing: { prompt: "0", completion: "0" },
        isFree: true,
        capabilities: ["text", "reasoning", "long-context"],
      },
      {
        id: "openai/gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        description: "OpenAI's fast and reliable model for most tasks",
        context_length: 16384,
        pricing: { prompt: "0.0015", completion: "0.002" },
        isFree: false,
        capabilities: ["text", "reasoning", "code", "function-calling"],
      },
      {
        id: "openai/gpt-4o-mini",
        name: "GPT-4o Mini",
        description:
          "OpenAI's advanced compact model with multimodal capabilities",
        context_length: 128000,
        pricing: { prompt: "0.00015", completion: "0.0006" },
        isFree: false,
        capabilities: [
          "text",
          "reasoning",
          "code",
          "vision",
          "function-calling",
        ],
      },
      {
        id: "anthropic/claude-3-haiku",
        name: "Claude 3 Haiku",
        description: "Anthropic's fast and efficient model for quick tasks",
        context_length: 200000,
        pricing: { prompt: "0.00025", completion: "0.00125" },
        isFree: false,
        capabilities: ["text", "reasoning", "code", "long-context"],
      },
      {
        id: "google/gemini-pro",
        name: "Gemini Pro",
        description: "Google's advanced model with multimodal capabilities",
        context_length: 32768,
        pricing: { prompt: "0.000125", completion: "0.000375" },
        isFree: false,
        capabilities: [
          "text",
          "reasoning",
          "code",
          "vision",
          "function-calling",
        ],
      },
    ];
  }

  validateApiKey(): boolean {
    return (
      this.apiKey &&
      this.apiKey.startsWith("sk-or-v1-") &&
      this.apiKey.length > 20
    );
  }

  updateApiKey(newKey: string): void {
    this.apiKey = newKey;
    this.connectionTested = false;
    this.requestCount = 0;
    this.errorCount = 0;
  }

  async testConnection(): Promise<{
    connected: boolean;
    error?: string;
    responseTime?: number;
    model?: string;
  }> {
    if (!this.validateApiKey()) {
      return { connected: false, error: "Invalid API key format" };
    }

    const startTime = Date.now();
    try {
      const testResponse = await this.sendMessage(
        "google/gemma-2-9b-it:free",
        [{ role: "user", content: "Hello" }],
        { maxTokens: 10, temperature: 0.1 },
      );

      const responseTime = Date.now() - startTime;
      this.connectionTested = true;

      return {
        connected: true,
        responseTime,
        model: testResponse.model,
      };
    } catch (error) {
      return {
        connected: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  getApiKeyStatus(): { valid: boolean; type: string; tested: boolean } {
    if (!this.apiKey) {
      return { valid: false, type: "missing", tested: false };
    }
    // Check if no API key is configured
    if (!this.apiKey) {
      return { valid: false, type: "missing", tested: false };
    }
    if (!this.apiKey.startsWith("sk-or-v1-") || this.apiKey.length < 20) {
      return { valid: false, type: "invalid", tested: false };
    }
    return { valid: true, type: "valid", tested: this.connectionTested };
  }

  getUsageStats(): { requests: number; errors: number; successRate: number } {
    const successRate =
      this.requestCount > 0
        ? (this.requestCount - this.errorCount) / this.requestCount
        : 0;
    return {
      requests: this.requestCount,
      errors: this.errorCount,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  async getAccountInfo(): Promise<{
    balance?: number;
    usage?: any;
    error?: string;
  }> {
    if (!this.validateApiKey()) {
      return { error: "Invalid API key" };
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/key`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return { balance: data.usage?.balance, usage: data.usage };
      } else {
        return { error: "Failed to get account info" };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const openRouterService = new OpenRouterService();
