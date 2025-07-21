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

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  return app;
}
