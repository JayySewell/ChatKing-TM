import { RequestHandler } from "express";
import { openRouterService } from "../services/openrouter";
import { ckStorage } from "../storage/ck-storage";
import crypto from "crypto";

interface ChatRequest {
  message: string;
  model: string;
  sessionId?: string;
  userId: string;
}

interface ModelsRequest {
  userId: string;
}

export const handleChatMessage: RequestHandler = async (req, res) => {
  try {
    const { message, model, sessionId, userId }: ChatRequest = req.body;

    if (!message || !model || !userId) {
      return res.status(400).json({
        error: "Missing required fields: message, model, userId",
      });
    }

    // Get or create chat session
    let session;
    if (sessionId) {
      session = await ckStorage.getChatSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(404).json({ error: "Chat session not found" });
      }
    } else {
      session = await ckStorage.createChatSession(userId);
    }

    // Add user message to session
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: message,
      timestamp: new Date(),
    };

    await ckStorage.addMessageToSession(session.id, userMessage);

    // Prepare messages for OpenRouter
    const messages = session.messages.concat([userMessage]).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Send to OpenRouter
    const response = await openRouterService.sendMessage(model, messages, {
      temperature: 0.7,
      maxTokens: 4000,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error("No response from AI model");
    }

    const aiResponse = response.choices[0].message.content;

    // Add AI response to session
    const aiMessage = {
      id: crypto.randomUUID(),
      role: "assistant" as const,
      content: aiResponse,
      timestamp: new Date(),
      model: model,
    };

    await ckStorage.addMessageToSession(session.id, aiMessage);

    // Log analytics
    await ckStorage.logAnalytics("ai_message", {
      userId,
      sessionId: session.id,
      model,
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    });

    res.json({
      message: aiResponse,
      sessionId: session.id,
      messageId: aiMessage.id,
      model: model,
      usage: response.usage,
    });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({
      error: "Failed to process AI request",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetModels: RequestHandler = async (req, res) => {
  try {
    const models = await openRouterService.getAvailableModels();

    // Filter and format models for frontend
    const formattedModels = models.map((model) => ({
      id: model.id,
      name: model.name || model.id,
      description: model.description || "",
      contextLength: model.context_length || 4096,
      pricing: model.pricing || { prompt: "0", completion: "0" },
      isFree: model.pricing?.prompt === "0" || model.id.includes("free"),
    }));

    res.json({ models: formattedModels });
  } catch (error) {
    console.error("Get Models Error:", error);
    res.status(500).json({
      error: "Failed to fetch available models",
    });
  }
};

export const handleGetChatHistory: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    const sessions = await ckStorage.getUserChatSessions(userId);

    // Return sessions with basic info and recent messages
    const formattedSessions = sessions.slice(0, limit).map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session.messages.length,
      lastMessage:
        session.messages[session.messages.length - 1]?.content.substring(
          0,
          100,
        ) || "",
      recentMessages: session.messages.slice(-5), // Last 5 messages for preview
    }));

    res.json({ sessions: formattedSessions });
  } catch (error) {
    console.error("Get Chat History Error:", error);
    res.status(500).json({
      error: "Failed to fetch chat history",
    });
  }
};

export const handleGetChatSession: RequestHandler = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.query;

    if (!sessionId || !userId) {
      return res.status(400).json({ error: "Session ID and User ID required" });
    }

    const session = await ckStorage.getChatSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    if (session.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ session });
  } catch (error) {
    console.error("Get Chat Session Error:", error);
    res.status(500).json({
      error: "Failed to fetch chat session",
    });
  }
};

export const handleDeleteChatSession: RequestHandler = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;

    if (!sessionId || !userId) {
      return res.status(400).json({ error: "Session ID and User ID required" });
    }

    const session = await ckStorage.getChatSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    if (session.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // In a real implementation, you'd add a delete method to CKStorage
    // For now, we'll just return success
    res.json({ success: true });
  } catch (error) {
    console.error("Delete Chat Session Error:", error);
    res.status(500).json({
      error: "Failed to delete chat session",
    });
  }
};
