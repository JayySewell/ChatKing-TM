import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleChatMessage,
  handleGetModels,
  handleGetChatHistory,
  handleGetChatSession,
  handleDeleteChatSession
} from "./routes/ai";
import {
  handleCalculate,
  handleConvertUnits,
  handleConvertBase,
  handleGetCalculatorHistory,
  handleClearCalculatorHistory,
  handleGetCalculatorConstants
} from "./routes/calculator";
import {
  handleSearch,
  handleGetSuggestions,
  handleGetSearchHistory,
  handleClearSearchHistory,
  handleGetPageContent,
  handleProxyRequest
} from "./routes/web";
import {
  handleListIndexes,
  handleCreateIndex,
  handleUpsertVectors,
  handleQueryVectors,
  handleDeleteVectors,
  handleGetIndexStats,
  handleDeleteIndex,
  handleSearchKnowledge
} from "./routes/pinecone";
import {
  handleRegister,
  handleLogin,
  handleValidateSession,
  handleChangePassword,
  handleLogout,
  handleGetUserProfile,
  handleUpdateUserProfile,
  handleGetSystemStats
} from "./routes/auth";
import {
  handleGetApiKeys,
  handleUpdateApiKey,
  handleTestApiKey,
  handleRotateApiKey,
  handleGetApiKeyUsage,
  handleGetSystemApiHealth,
  handleValidateAllApiKeys
} from "./routes/apikeys";
import { authService } from "./services/auth";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize default owner account
  authService.createDefaultOwner();

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // AI Chat API routes
  app.post("/api/ai/chat", handleChatMessage);
  app.get("/api/ai/models", handleGetModels);
  app.get("/api/ai/history/:userId", handleGetChatHistory);
  app.get("/api/ai/session/:sessionId", handleGetChatSession);
  app.delete("/api/ai/session/:sessionId", handleDeleteChatSession);

  // Calculator API routes
  app.post("/api/calculator/calculate", handleCalculate);
  app.post("/api/calculator/convert-units", handleConvertUnits);
  app.post("/api/calculator/convert-base", handleConvertBase);
  app.get("/api/calculator/history/:userId", handleGetCalculatorHistory);
  app.post("/api/calculator/clear-history", handleClearCalculatorHistory);
  app.get("/api/calculator/constants", handleGetCalculatorConstants);

  // Web Search API routes
  app.post("/api/web/search", handleSearch);
  app.get("/api/web/suggestions", handleGetSuggestions);
  app.get("/api/web/history/:userId", handleGetSearchHistory);
  app.post("/api/web/clear-history", handleClearSearchHistory);
  app.post("/api/web/page-content", handleGetPageContent);
  app.post("/api/web/proxy", handleProxyRequest);

  // Pinecone Vector Search API routes
  app.get("/api/pinecone/indexes/:userId", handleListIndexes);
  app.post("/api/pinecone/indexes", handleCreateIndex);
  app.post("/api/pinecone/upsert", handleUpsertVectors);
  app.post("/api/pinecone/query", handleQueryVectors);
  app.post("/api/pinecone/delete-vectors", handleDeleteVectors);
  app.get("/api/pinecone/stats/:indexName", handleGetIndexStats);
  app.delete("/api/pinecone/indexes/:indexName", handleDeleteIndex);
  app.post("/api/pinecone/search", handleSearchKnowledge);

  // Authentication API routes
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/validate", handleValidateSession);
  app.post("/api/auth/change-password", handleChangePassword);
  app.post("/api/auth/logout", handleLogout);
  app.get("/api/auth/profile/:userId", handleGetUserProfile);
  app.put("/api/auth/profile/:userId", handleUpdateUserProfile);
  app.get("/api/auth/system-stats", handleGetSystemStats);

  return app;
}
