import { RequestHandler } from "express";
import { pineconeService } from "../services/pinecone";
import { ckStorage } from "../storage/ck-storage";
import crypto from "crypto";

interface CreateIndexRequest {
  name: string;
  dimension: number;
  metric: "cosine" | "euclidean" | "dotproduct";
  userId: string;
}

interface UpsertRequest {
  indexName: string;
  documents: Array<{
    id?: string;
    content: string;
    metadata?: Record<string, any>;
  }>;
  namespace?: string;
  userId: string;
}

interface QueryRequest {
  indexName: string;
  query: string;
  topK?: number;
  namespace?: string;
  filter?: Record<string, any>;
  userId: string;
}

interface DeleteVectorsRequest {
  indexName: string;
  ids: string[];
  namespace?: string;
  userId: string;
}

export const handleListIndexes: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    // Get both Pinecone indexes and user's local indexes
    const [pineconeIndexes, userIndexes] = await Promise.all([
      pineconeService.listIndexes(),
      ckStorage.getUserPineconeIndexes(userId),
    ]);

    res.json({
      pineconeIndexes,
      userIndexes,
      totalIndexes: pineconeIndexes.length + userIndexes.length,
    });
  } catch (error) {
    console.error("List Indexes Error:", error);
    res.status(500).json({
      error: "Failed to list indexes",
    });
  }
};

export const handleCreateIndex: RequestHandler = async (req, res) => {
  try {
    const { name, dimension, metric, userId }: CreateIndexRequest = req.body;

    if (!name || !dimension || !userId) {
      return res.status(400).json({
        error: "Missing required fields: name, dimension, userId",
      });
    }

    // Create index in Pinecone
    const created = await pineconeService.createIndex(name, dimension, metric);

    if (created) {
      // Also create local tracking
      await ckStorage.createPineconeIndex(userId, name);

      // Log analytics
      await ckStorage.logAnalytics("pinecone_index_created", {
        userId,
        indexName: name,
        dimension,
        metric,
      });
    }

    res.json({
      success: created,
      indexName: name,
      dimension,
      metric,
    });
  } catch (error) {
    console.error("Create Index Error:", error);
    res.status(500).json({
      error: "Failed to create index",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleUpsertVectors: RequestHandler = async (req, res) => {
  try {
    const { indexName, documents, namespace, userId }: UpsertRequest = req.body;

    if (!indexName || !documents || !Array.isArray(documents) || !userId) {
      return res.status(400).json({
        error: "Missing required fields: indexName, documents (array), userId",
      });
    }

    const vectors = [];
    const processedDocs = [];

    for (const doc of documents) {
      const id = doc.id || crypto.randomUUID();
      const embedding = await pineconeService.embedText(doc.content);

      vectors.push({
        id,
        values: embedding,
        metadata: {
          content: doc.content,
          ...doc.metadata,
          userId,
          timestamp: new Date().toISOString(),
        },
      });

      processedDocs.push({
        id,
        content: doc.content,
        metadata: doc.metadata,
      });
    }

    const success = await pineconeService.upsertVectors(
      indexName,
      vectors,
      namespace,
    );

    if (success) {
      // Log analytics
      await ckStorage.logAnalytics("pinecone_vectors_upserted", {
        userId,
        indexName,
        namespace,
        vectorCount: vectors.length,
      });
    }

    res.json({
      success,
      indexName,
      namespace,
      vectorsUpserted: vectors.length,
      documents: processedDocs,
    });
  } catch (error) {
    console.error("Upsert Vectors Error:", error);
    res.status(500).json({
      error: "Failed to upsert vectors",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleQueryVectors: RequestHandler = async (req, res) => {
  try {
    const {
      indexName,
      query,
      topK = 10,
      namespace,
      filter,
      userId,
    }: QueryRequest = req.body;

    if (!indexName || !query || !userId) {
      return res.status(400).json({
        error: "Missing required fields: indexName, query, userId",
      });
    }

    // Convert query text to embedding
    const queryVector = await pineconeService.embedText(query);

    // Query Pinecone
    const results = await pineconeService.queryVectors(
      indexName,
      {
        vector: queryVector,
        topK,
        includeMetadata: true,
        includeValues: false,
        filter,
      },
      namespace,
    );

    // Log analytics
    await ckStorage.logAnalytics("pinecone_query", {
      userId,
      indexName,
      namespace,
      query,
      resultCount: results.matches.length,
      topK,
    });

    res.json({
      query,
      indexName,
      namespace,
      results: results.matches.map((match) => ({
        id: match.id,
        score: match.score,
        content: match.metadata?.content || "",
        metadata: match.metadata,
      })),
      totalResults: results.matches.length,
    });
  } catch (error) {
    console.error("Query Vectors Error:", error);
    res.status(500).json({
      error: "Failed to query vectors",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleDeleteVectors: RequestHandler = async (req, res) => {
  try {
    const { indexName, ids, namespace, userId }: DeleteVectorsRequest =
      req.body;

    if (!indexName || !ids || !Array.isArray(ids) || !userId) {
      return res.status(400).json({
        error: "Missing required fields: indexName, ids (array), userId",
      });
    }

    const success = await pineconeService.deleteVectors(
      indexName,
      ids,
      namespace,
    );

    if (success) {
      // Log analytics
      await ckStorage.logAnalytics("pinecone_vectors_deleted", {
        userId,
        indexName,
        namespace,
        vectorCount: ids.length,
      });
    }

    res.json({
      success,
      indexName,
      namespace,
      deletedCount: ids.length,
    });
  } catch (error) {
    console.error("Delete Vectors Error:", error);
    res.status(500).json({
      error: "Failed to delete vectors",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetIndexStats: RequestHandler = async (req, res) => {
  try {
    const { indexName } = req.params;
    const { userId } = req.query;

    if (!indexName || !userId) {
      return res.status(400).json({
        error: "Index name and user ID required",
      });
    }

    const stats = await pineconeService.getIndexStats(indexName);

    res.json({
      indexName,
      stats,
    });
  } catch (error) {
    console.error("Get Index Stats Error:", error);
    res.status(500).json({
      error: "Failed to get index statistics",
    });
  }
};

export const handleDeleteIndex: RequestHandler = async (req, res) => {
  try {
    const { indexName } = req.params;
    const { userId } = req.body;

    if (!indexName || !userId) {
      return res.status(400).json({
        error: "Index name and user ID required",
      });
    }

    const success = await pineconeService.deleteIndex(indexName);

    if (success) {
      // Log analytics
      await ckStorage.logAnalytics("pinecone_index_deleted", {
        userId,
        indexName,
      });
    }

    res.json({
      success,
      indexName,
    });
  } catch (error) {
    console.error("Delete Index Error:", error);
    res.status(500).json({
      error: "Failed to delete index",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleSearchKnowledge: RequestHandler = async (req, res) => {
  try {
    const { query, userId, limit = 20 } = req.body;

    if (!query || !userId) {
      return res.status(400).json({
        error: "Missing required fields: query, userId",
      });
    }

    // Search across all user's indexes
    const userIndexes = await ckStorage.getUserPineconeIndexes(userId);
    const allResults = [];

    for (const index of userIndexes) {
      try {
        const queryVector = await pineconeService.embedText(query);
        const results = await pineconeService.queryVectors(index.name, {
          vector: queryVector,
          topK: Math.ceil(limit / userIndexes.length),
          includeMetadata: true,
        });

        allResults.push(
          ...results.matches.map((match) => ({
            ...match,
            indexName: index.name,
            content: match.metadata?.content || "",
            title: match.metadata?.title || `Document ${match.id}`,
          })),
        );
      } catch (error) {
        console.error(`Failed to search index ${index.name}:`, error);
      }
    }

    // Sort by score and limit results
    const sortedResults = allResults
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Log analytics
    await ckStorage.logAnalytics("knowledge_search", {
      userId,
      query,
      indexCount: userIndexes.length,
      resultCount: sortedResults.length,
    });

    res.json({
      query,
      results: sortedResults,
      indexesSearched: userIndexes.length,
      totalResults: sortedResults.length,
    });
  } catch (error) {
    console.error("Search Knowledge Error:", error);
    res.status(500).json({
      error: "Failed to search knowledge base",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
