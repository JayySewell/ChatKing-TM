import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleChatMessage,
  handleGetModels,
  handleGetChatHistory,
  handleGetChatSession,
  handleDeleteChatSession,
} from "./routes/ai";
import {
  handleCalculate,
  handleConvertUnits,
  handleConvertBase,
  handleGetCalculatorHistory,
  handleClearCalculatorHistory,
  handleGetCalculatorConstants,
} from "./routes/calculator";
import {
  handleSearch,
  handleGetSuggestions,
  handleGetSearchHistory,
  handleClearSearchHistory,
  handleGetPageContent,
  handleProxyRequest,
} from "./routes/web";
import {
  handleListIndexes,
  handleCreateIndex,
  handleUpsertVectors,
  handleQueryVectors,
  handleDeleteVectors,
  handleGetIndexStats,
  handleDeleteIndex,
  handleSearchKnowledge,
} from "./routes/pinecone";
import {
  handlePineconeConnection,
  handleSemanticSearch,
  handleAddKnowledge,
  handleConversationMemory,
  handleSearchConversations,
  handleGetIndexStats as handleGetEnhancedIndexStats,
  handleCreateIndex as handleCreateEnhancedIndex,
} from "./routes/pinecone-enhanced";
import {
  handleRegister,
  handleLogin,
  handleValidateSession,
  handleChangePassword,
  handleLogout,
  handleGetUserProfile,
  handleUpdateUserProfile,
  handleGetSystemStats,
} from "./routes/auth";
import {
  handleUploadAvatar,
  handleDeleteAvatar,
  handleGetAvatarTemplates,
  handleSetAvatarTemplate,
  uploadMiddleware,
} from "./routes/avatar";
import {
  handleSubmitFeedback,
  handleGetUserFeedback,
  handleGetFeedback,
  handleVoteFeedback,
  handleGetAllFeedback,
  handleUpdateFeedbackStatus,
  handleGetFeedbackStats,
  handleGetSystemLogs,
  handleGetAdminActions,
  handleLogEvent,
} from "./routes/feedback";
import {
  handleGetSystemMetrics,
  handleGetUsageStats,
  handleGetRecentActivity,
  handleGetPerformanceMetrics,
  handleGetTopQueries,
  handleGetResourceUsage,
  handleGenerateReport,
  handleGetAnalyticsDashboard,
} from "./routes/analytics";
import {
  handleGoogleAuth,
  handleAppleAuth,
  handleGoogleCallback,
  handleAppleCallback,
  handleOAuthStatus,
  handleUnlinkOAuth,
  sessionMiddleware,
} from "./routes/oauth";
import { authService } from "./services/auth";
import { apiKeyService } from "./services/apikeys";
import {
  securityMiddleware,
  rateLimitMiddleware,
  bruteForceProtection,
  honeypotMiddleware,
  antiScanMiddleware,
  headerSecurityMiddleware,
  geoBlockMiddleware,
} from "./middleware/security";
import apiKeysRouter from "./routes/apikeys";
import securityRouter from "./routes/security";
import emailRouter from "./routes/email";
import systemRouter from "./routes/system";

export function createServer() {
  const app = express();

  // Security middleware (applied first)
  app.use(headerSecurityMiddleware);
  app.use(geoBlockMiddleware);
  app.use(honeypotMiddleware);
  app.use(antiScanMiddleware);
  app.use(securityMiddleware);
  app.use(rateLimitMiddleware());
  app.use(bruteForceProtection);

  // Standard middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(sessionMiddleware);

  // Initialize services
  authService.createDefaultOwner();
  apiKeyService.initializeDefaultKeys();

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

  // Enhanced Pinecone API routes
  app.get("/api/pinecone-enhanced/connection", handlePineconeConnection);
  app.post("/api/pinecone-enhanced/search", handleSemanticSearch);
  app.post("/api/pinecone-enhanced/knowledge", handleAddKnowledge);
  app.post("/api/pinecone-enhanced/memory", handleConversationMemory);
  app.post("/api/pinecone-enhanced/conversations", handleSearchConversations);
  app.get("/api/pinecone-enhanced/stats/:indexName", handleGetEnhancedIndexStats);
  app.post("/api/pinecone-enhanced/indexes", handleCreateEnhancedIndex);

  // Authentication API routes
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/validate", handleValidateSession);
  app.post("/api/auth/change-password", handleChangePassword);
  app.post("/api/auth/logout", handleLogout);
  app.get("/api/auth/profile/:userId", handleGetUserProfile);
  app.put("/api/auth/profile/:userId", handleUpdateUserProfile);
  app.get("/api/auth/system-stats", handleGetSystemStats);

  // Avatar management routes
  app.post("/api/auth/upload-avatar", uploadMiddleware, handleUploadAvatar);
  app.delete("/api/auth/delete-avatar", handleDeleteAvatar);
  app.get("/api/auth/avatar-templates", handleGetAvatarTemplates);
  app.post("/api/auth/set-avatar-template", handleSetAvatarTemplate);

  // Enhanced API Key Management routes
  app.use("/api/keys", apiKeysRouter);

  // Analytics and Monitoring routes
  app.get("/api/analytics/metrics", handleGetSystemMetrics);
  app.get("/api/analytics/usage/:userId", handleGetUsageStats);
  app.get("/api/analytics/activity", handleGetRecentActivity);
  app.get("/api/analytics/performance", handleGetPerformanceMetrics);
  app.get("/api/analytics/queries/:service", handleGetTopQueries);
  app.get("/api/analytics/resources", handleGetResourceUsage);
  app.post("/api/analytics/report", handleGenerateReport);
  app.get("/api/analytics/dashboard", handleGetAnalyticsDashboard);

  // OAuth Authentication routes
  app.get("/api/auth/google", handleGoogleAuth);
  app.get("/api/auth/apple", handleAppleAuth);
  app.get("/auth/google/callback", handleGoogleCallback);
  app.post("/auth/apple/callback", handleAppleCallback);
  app.get("/api/auth/oauth-status/:userId", handleOAuthStatus);
  app.post("/api/auth/unlink-oauth", handleUnlinkOAuth);

  // Security and Monitoring routes
  app.use("/api/security", securityRouter);

  // Email Service routes
  app.use("/api/email", emailRouter);

  // System Health and Monitoring routes
  app.use("/api/system", systemRouter);

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: "2.0.0",
    });
  });

  // Catch-all for undefined routes (security measure)
  app.use("*", (req, res) => {
    // Log potential scanning attempt
    console.log(`404 request to: ${req.originalUrl} from ${req.ip}`);

    // Return 404 with minimal information
    res.status(404).json({
      error: "Not Found",
      message: "The requested resource does not exist",
    });
  });

  return app;
}
