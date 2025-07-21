import { Request, Response } from "express";
import { pineconeService } from "../services/pinecone";
import { enhancedAuthService } from "../services/auth-enhanced";
import { contentFilterService } from "../services/content-filter";

export async function handlePineconeConnection(req: Request, res: Response) {
  try {
    const connection = await pineconeService.testConnection();
    const indexes = await pineconeService.listIndexes();

    res.json({
      success: true,
      connected: connection.connected,
      error: connection.error,
      indexCount: connection.indexCount,
      indexes: indexes.map((idx) => ({
        name: idx.name,
        dimension: idx.dimension,
        metric: idx.metric,
        vectorCount: idx.vectorCount,
      })),
    });
  } catch (error) {
    console.error("Pinecone connection test failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function handleSemanticSearch(req: Request, res: Response) {
  try {
    const { query, indexName, topK, filter } = req.body;
    const userId = req.session?.userId;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Query is required",
      });
    }

    // Content filtering
    const contentAnalysis = await contentFilterService.analyzeContent(
      query,
      userId,
    );
    if (!contentAnalysis.isAllowed) {
      return res.status(403).json({
        success: false,
        error: "Query blocked by content filter",
        reason: contentAnalysis.reasoning,
      });
    }

    // Perform semantic search
    const searchResults = await pineconeService.semanticSearch(query, {
      indexName,
      topK: topK || 10,
      filter,
      includeMetadata: true,
    });

    // Filter results through content filter
    const filteredResults = await contentFilterService.filterSearchResults(
      searchResults.results,
      userId,
    );

    res.json({
      success: true,
      query: searchResults.query,
      results: filteredResults,
      processingTime: searchResults.processingTime,
      totalResults: searchResults.results.length,
      filteredCount: filteredResults.length,
    });
  } catch (error) {
    console.error("Semantic search failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Search failed",
    });
  }
}

export async function handleAddKnowledge(req: Request, res: Response) {
  try {
    const { content, metadata, indexName } = req.body;
    const userId = req.session?.userId;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Content is required",
      });
    }

    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Content filtering
    const contentAnalysis = await contentFilterService.analyzeContent(
      content,
      userId,
    );
    if (!contentAnalysis.isAllowed) {
      return res.status(403).json({
        success: false,
        error: "Content blocked by content filter",
        reason: contentAnalysis.reasoning,
      });
    }

    // Add knowledge to vector database
    const success = await pineconeService.addKnowledge(
      content,
      {
        ...metadata,
        addedBy: userId,
        contentRating: contentAnalysis.ageRating,
      },
      indexName,
    );

    res.json({
      success,
      message: success
        ? "Knowledge added successfully"
        : "Failed to add knowledge",
      contentRating: contentAnalysis.ageRating,
    });
  } catch (error) {
    console.error("Add knowledge failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to add knowledge",
    });
  }
}

export async function handleConversationMemory(req: Request, res: Response) {
  try {
    const { conversationId, messages, metadata } = req.body;
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (!conversationId || !messages) {
      return res.status(400).json({
        success: false,
        error: "Conversation ID and messages are required",
      });
    }

    // Store conversation memory
    const success = await pineconeService.addConversationMemory(
      userId,
      conversationId,
      messages,
      metadata,
    );

    res.json({
      success,
      message: success
        ? "Conversation memory stored"
        : "Failed to store conversation memory",
    });
  } catch (error) {
    console.error("Store conversation memory failed:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to store conversation memory",
    });
  }
}

export async function handleSearchConversations(req: Request, res: Response) {
  try {
    const { query, limit } = req.body;
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Query is required",
      });
    }

    // Search user conversations
    const conversations = await pineconeService.searchUserConversations(
      userId,
      query,
      limit || 5,
    );

    res.json({
      success: true,
      query,
      conversations,
      count: conversations.length,
    });
  } catch (error) {
    console.error("Search conversations failed:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to search conversations",
    });
  }
}

export async function handleGetIndexStats(req: Request, res: Response) {
  try {
    const { indexName } = req.params;

    if (!indexName) {
      return res.status(400).json({
        success: false,
        error: "Index name is required",
      });
    }

    const stats = await pineconeService.getIndexStats(indexName);

    res.json({
      success: true,
      indexName,
      stats,
    });
  } catch (error) {
    console.error("Get index stats failed:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get index stats",
    });
  }
}

export async function handleCreateIndex(req: Request, res: Response) {
  try {
    const { name, dimension, metric } = req.body;
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Check if user is admin
    const userProfile = await enhancedAuthService.getEnhancedProfile(userId);
    if (!userProfile || userProfile.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Admin privileges required",
      });
    }

    if (!name || !dimension) {
      return res.status(400).json({
        success: false,
        error: "Index name and dimension are required",
      });
    }

    const success = await pineconeService.createIndex(
      name,
      dimension,
      metric || "cosine",
    );

    res.json({
      success,
      message: success
        ? "Index created successfully"
        : "Failed to create index",
      indexName: name,
    });
  } catch (error) {
    console.error("Create index failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create index",
    });
  }
}
