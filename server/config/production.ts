// Production Configuration for ChatKing AI
// This file contains production-ready API configurations

export interface ProductionConfig {
  openRouter: {
    apiKey: string;
    models: string[];
    defaultModel: string;
  };
  pinecone: {
    apiKey: string;
    environment: string;
    indexName: string;
  };
  braveSearch: {
    apiKey: string;
    endpoint: string;
  };
  googleWorkspace: {
    clientId: string;
    clientSecret: string;
    domain: string;
    adminEmail: string;
  };
  email: {
    provider: string;
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  security: {
    jwtSecret: string;
    encryptionKey: string;
    sessionTimeout: number;
  };
}

// Production API Keys - These should be set via environment variables
export const productionConfig: ProductionConfig = {
  openRouter: {
    // Use a real OpenRouter API key for production
    apiKey: process.env.OPENROUTER_API_KEY || "sk-or-v1-PRODUCTION-KEY-REQUIRED",
    models: [
      "google/gemma-2-9b-it:free",
      "meta-llama/llama-3.1-8b-instruct:free",
      "microsoft/phi-3-medium-128k-instruct:free",
      "qwen/qwen-2.5-7b-instruct:free",
      "openai/gpt-3.5-turbo",
      "openai/gpt-4o-mini",
      "anthropic/claude-3-haiku",
      "google/gemini-pro",
    ],
    defaultModel: "google/gemma-2-9b-it:free",
  },
  pinecone: {
    // Use real Pinecone API key for production
    apiKey: process.env.PINECONE_API_KEY || "pcsk-PRODUCTION-KEY-REQUIRED",
    environment: process.env.PINECONE_ENVIRONMENT || "us-east-1",
    indexName: "chatking-production",
  },
  braveSearch: {
    // Use real BraveSearch API key for production
    apiKey: process.env.BRAVE_SEARCH_API_KEY || "BSA-PRODUCTION-KEY-REQUIRED",
    endpoint: "https://api.search.brave.com/res/v1",
  },
  googleWorkspace: {
    clientId: process.env.GOOGLE_CLIENT_ID || "CLIENT-ID-REQUIRED",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "CLIENT-SECRET-REQUIRED",
    domain: "chatkingai.com",
    adminEmail: "Jayy.Sewell@chatkingai.com",
  },
  email: {
    provider: "sendgrid", // Production email provider
    apiKey: process.env.SENDGRID_API_KEY || "SG-PRODUCTION-KEY-REQUIRED",
    fromEmail: "noreply@chatkingai.com",
    fromName: "ChatKing AI",
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || "chatking-production-jwt-secret-2024",
    encryptionKey: process.env.ENCRYPTION_KEY || "chatking-production-encryption-key-2024",
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Validate that all required API keys are present
export function validateProductionConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (productionConfig.openRouter.apiKey.includes("REQUIRED")) {
    errors.push("OpenRouter API key is not configured");
  }
  
  if (productionConfig.pinecone.apiKey.includes("REQUIRED")) {
    errors.push("Pinecone API key is not configured");
  }
  
  if (productionConfig.braveSearch.apiKey.includes("REQUIRED")) {
    errors.push("BraveSearch API key is not configured");
  }
  
  if (productionConfig.googleWorkspace.clientId.includes("REQUIRED")) {
    errors.push("Google Workspace Client ID is not configured");
  }
  
  if (productionConfig.email.apiKey.includes("REQUIRED")) {
    errors.push("Email service API key is not configured");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Get the current environment
export function getEnvironment(): 'development' | 'production' {
  return (process.env.NODE_ENV as 'development' | 'production') || 'development';
}

// Check if we're in production mode
export function isProduction(): boolean {
  return getEnvironment() === 'production';
}

// Get configuration for current environment
export function getConfig(): ProductionConfig {
  return productionConfig;
}
