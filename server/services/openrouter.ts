interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
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
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string = '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') {
    this.apiKey = apiKey;
  }

  async sendMessage(
    model: string,
    messages: OpenRouterMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<OpenRouterResponse> {
    const requestBody: OpenRouterRequest = {
      model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000,
      stream: options.stream || false,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://chatkingai.com',
        'X-Title': 'ChatKing AI Platform'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getAvailableModels(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      
      // Return default models if API call fails
      return this.getDefaultModels();
    } catch (error) {
      console.error('Failed to fetch models from OpenRouter:', error);
      return this.getDefaultModels();
    }
  }

  private getDefaultModels() {
    return [
      {
        id: 'deepseek/deepseek-r1',
        name: 'DeepSeek R1 Free',
        description: 'Advanced reasoning model with strong logical capabilities',
        context_length: 32768,
        pricing: { prompt: '0', completion: '0' }
      },
      {
        id: 'google/gemma-2-27b-it',
        name: 'Gemma 2 27B Free',
        description: 'Google\'s powerful instruction-tuned model',
        context_length: 8192,
        pricing: { prompt: '0', completion: '0' }
      },
      {
        id: 'meta-llama/llama-3.2-3b-instruct:free',
        name: 'Llama 3.2 3B Free',
        description: 'Meta\'s efficient instruction-following model',
        context_length: 128000,
        pricing: { prompt: '0', completion: '0' }
      },
      {
        id: 'microsoft/phi-3-mini-128k-instruct:free',
        name: 'Phi-3 Mini Free',
        description: 'Microsoft\'s compact but capable model',
        context_length: 128000,
        pricing: { prompt: '0', completion: '0' }
      },
      {
        id: 'openai/gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'OpenAI\'s fast and efficient model',
        context_length: 16384,
        pricing: { prompt: '0.0015', completion: '0.002' }
      },
      {
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'OpenAI\'s advanced mini model',
        context_length: 128000,
        pricing: { prompt: '0.00015', completion: '0.0006' }
      }
    ];
  }

  validateApiKey(): boolean {
    return this.apiKey && this.apiKey.startsWith('sk-or-v1-');
  }

  updateApiKey(newKey: string): void {
    this.apiKey = newKey;
  }
}

export const openRouterService = new OpenRouterService();
