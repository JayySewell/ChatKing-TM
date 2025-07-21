// Production Configuration for ChatKing AI
// This file contains production-ready API configurations

import crypto from "crypto";

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

// Production API Keys - These MUST be set via environment variables
export const productionConfig: ProductionConfig = {
  openRouter: {
    // OpenRouter API key is required for AI functionality
    apiKey: process.env.OPENROUTER_API_KEY || "",
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
    // Pinecone API key is required for vector database functionality
    apiKey: process.env.PINECONE_API_KEY || "",
    environment: process.env.PINECONE_ENVIRONMENT || "us-east-1",
    indexName: "chatking-production",
  },
  braveSearch: {
    // BraveSearch API key is optional but recommended for web search
    apiKey: process.env.BRAVE_SEARCH_API_KEY || "",
    endpoint: "https://api.search.brave.com/res/v1",
  },
  googleWorkspace: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    domain: "chatkingai.com",
    adminEmail: "Jayy.Sewell@chatkingai.com",
  },
  email: {
    provider: "sendgrid",
    apiKey: process.env.SENDGRID_API_KEY || "",
    fromEmail: "noreply@chatkingai.com",
    fromName: "ChatKing AI",
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
    encryptionKey: process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Validate that all required API keys are present (without exposing values)
export function validateProductionConfig(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required configurations
  if (!productionConfig.openRouter.apiKey) {
    errors.push("OpenRouter API key is required but not configured");
  }

  if (!productionConfig.pinecone.apiKey) {
    errors.push("Pinecone API key is required but not configured");
  }

  if (!productionConfig.security.jwtSecret || productionConfig.security.jwtSecret.length < 32) {
    errors.push("JWT secret must be at least 32 characters long");
  }

  if (!productionConfig.security.encryptionKey || productionConfig.security.encryptionKey.length < 32) {
    errors.push("Encryption key must be at least 32 characters long");
  }

  // Check optional but recommended configurations
  if (!productionConfig.braveSearch.apiKey) {
    warnings.push("BraveSearch API key not configured - web search may be limited");
  }

  if (!productionConfig.googleWorkspace.clientId) {
    warnings.push("Google Workspace OAuth not configured - single sign-on unavailable");
  }

  if (!productionConfig.email.apiKey) {
    warnings.push("Email service not configured - email features unavailable");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Get the current environment
export function getEnvironment(): "development" | "production" {
  return (
    (process.env.NODE_ENV as "development" | "production") || "development"
  );
}

// Check if we're in production mode
export function isProduction(): boolean {
  return getEnvironment() === "production";
}

// Get configuration for current environment
export function getConfig(): ProductionConfig {
  return productionConfig;
}
