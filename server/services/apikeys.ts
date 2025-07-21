import { ckStorageExtended } from "../storage/ck-storage-extended";
import crypto from "crypto";

interface ApiKeyConfig {
  name: string;
  key: string;
  environment?: string;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

interface EnvironmentVariables {
  PINECONE_API_KEY?: string;
  PINECONE_ENVIRONMENT?: string;
  OPENAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  BRAVE_SEARCH_API_KEY?: string;
  EMAIL_SERVICE_API_KEY?: string;
  GOOGLE_OAUTH_CLIENT_ID?: string;
  GOOGLE_OAUTH_CLIENT_SECRET?: string;
  APPLE_OAUTH_CLIENT_ID?: string;
  APPLE_OAUTH_CLIENT_SECRET?: string;
}

export class ApiKeyService {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || "chatking-secure-key-2024";
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey).subarray(0, 32), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encrypted = textParts.join(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey).subarray(0, 32), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async storeApiKey(userId: string, service: string, config: Omit<ApiKeyConfig, 'createdAt' | 'usageCount'>): Promise<boolean> {
    try {
      const encryptedKey = this.encrypt(config.key);
      const apiKeyData: ApiKeyConfig = {
        ...config,
        key: encryptedKey,
        createdAt: new Date().toISOString(),
        usageCount: 0,
      };

      return await ckStorage.storeApiKey(userId, service, apiKeyData);
    } catch (error) {
      console.error("Failed to store API key:", error);
      return false;
    }
  }

  async getApiKey(userId: string, service: string): Promise<string | null> {
    try {
      const config = await ckStorage.getApiKey(userId, service);
      if (!config || !config.isActive) {
        return null;
      }

      // Update usage stats
      config.usageCount++;
      config.lastUsed = new Date().toISOString();
      await ckStorage.storeApiKey(userId, service, config);

      return this.decrypt(config.key);
    } catch (error) {
      console.error("Failed to get API key:", error);
      return null;
    }
  }

  async validateApiKey(service: string, key: string): Promise<boolean> {
    switch (service.toLowerCase()) {
      case 'pinecone':
        return key.startsWith('pcsk_') && key.length > 20;
      case 'openai':
        return key.startsWith('sk-') && key.length > 20;
      case 'openrouter':
        return key.startsWith('sk-or-') && key.length > 20;
      case 'brave':
        return key.length === 32 && /^[a-zA-Z0-9]+$/.test(key);
      case 'google':
        return key.length > 10 && key.includes('.googleusercontent.com');
      case 'apple':
        return key.length > 10;
      default:
        return key.length > 5;
    }
  }

  async listApiKeys(userId: string): Promise<Record<string, Omit<ApiKeyConfig, 'key'>>> {
    try {
      const keys = await ckStorage.getAllApiKeys(userId);
      const sanitized: Record<string, Omit<ApiKeyConfig, 'key'>> = {};

      for (const [service, config] of Object.entries(keys)) {
        sanitized[service] = {
          name: config.name,
          environment: config.environment,
          isActive: config.isActive,
          createdAt: config.createdAt,
          lastUsed: config.lastUsed,
          usageCount: config.usageCount,
        };
      }

      return sanitized;
    } catch (error) {
      console.error("Failed to list API keys:", error);
      return {};
    }
  }

  async deleteApiKey(userId: string, service: string): Promise<boolean> {
    try {
      return await ckStorage.deleteApiKey(userId, service);
    } catch (error) {
      console.error("Failed to delete API key:", error);
      return false;
    }
  }

  async updateEnvironmentVariables(variables: EnvironmentVariables): Promise<void> {
    // Update process.env with new variables
    for (const [key, value] of Object.entries(variables)) {
      if (value) {
        process.env[key] = value;
      }
    }

    // Store in persistent storage for future restarts
    await ckStorage.storeEnvironmentVariables(variables);
  }

  getEnvironmentVariables(): EnvironmentVariables {
    return {
      PINECONE_API_KEY: process.env.PINECONE_API_KEY,
      PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      BRAVE_SEARCH_API_KEY: process.env.BRAVE_SEARCH_API_KEY,
      EMAIL_SERVICE_API_KEY: process.env.EMAIL_SERVICE_API_KEY,
      GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
      GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      APPLE_OAUTH_CLIENT_ID: process.env.APPLE_OAUTH_CLIENT_ID,
      APPLE_OAUTH_CLIENT_SECRET: process.env.APPLE_OAUTH_CLIENT_SECRET,
    };
  }

  async testApiKey(service: string, key: string): Promise<{ valid: boolean; error?: string }> {
    try {
      switch (service.toLowerCase()) {
        case 'pinecone':
          // Test Pinecone connection
          const response = await fetch(`https://controller.us-east1-aws.pinecone.io/databases`, {
            headers: { 'Api-Key': key }
          });
          return { valid: response.ok };

        case 'openai':
          // Test OpenAI connection
          const openaiResponse = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${key}` }
          });
          return { valid: openaiResponse.ok };

        case 'openrouter':
          // Test OpenRouter connection
          const orResponse = await fetch('https://openrouter.ai/api/v1/models', {
            headers: { 'Authorization': `Bearer ${key}` }
          });
          return { valid: orResponse.ok };

        case 'brave':
          // Test Brave Search connection
          const braveResponse = await fetch('https://api.search.brave.com/res/v1/web/search?q=test', {
            headers: { 'X-Subscription-Token': key }
          });
          return { valid: braveResponse.ok };

        default:
          return { valid: this.validateApiKey(service, key) };
      }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  async initializeDefaultKeys(): Promise<void> {
    // Initialize with default development keys if no keys exist
    const defaultKeys = {
      pinecone: {
        name: "Default Pinecone",
        key: process.env.PINECONE_API_KEY || "pcsk_6DAaeQ_NHpbyRENkVBaBwwkrV2Hf9mzDyXKvWdnxGsg2WVmMBZcmv2QjMKR3xKP7EbrtnA",
        environment: process.env.PINECONE_ENVIRONMENT || "us-east1-aws",
        isActive: true,
      },
      openrouter: {
        name: "Default OpenRouter",
        key: process.env.OPENROUTER_API_KEY || "sk-or-v1-demo-key",
        isActive: true,
      },
      brave: {
        name: "Default Brave Search",
        key: process.env.BRAVE_SEARCH_API_KEY || "demo-brave-key",
        isActive: true,
      },
    };

    const userId = "owner";
    for (const [service, config] of Object.entries(defaultKeys)) {
      const existing = await ckStorage.getApiKey(userId, service);
      if (!existing) {
        await this.storeApiKey(userId, service, config);
      }
    }
  }
}

export const apiKeyService = new ApiKeyService();
