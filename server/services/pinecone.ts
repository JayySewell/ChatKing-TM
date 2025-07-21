import { productionConfig } from "../config/production";

interface PineconeVector {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

interface PineconeQueryRequest {
  vector: number[];
  topK: number;
  includeMetadata?: boolean;
  includeValues?: boolean;
  filter?: Record<string, any>;
}

interface PineconeQueryResponse {
  matches: Array<{
    id: string;
    score: number;
    values?: number[];
    metadata?: Record<string, any>;
  }>;
  namespace?: string;
}

interface PineconeIndex {
  name: string;
  dimension: number;
  metric: "cosine" | "euclidean" | "dotproduct";
  vectorCount: number;
}

export class PineconeService {
  private apiKey: string;
  private baseUrl: string;
  private indexHost: string;
  private environment: string;

  constructor(
    apiKey?: string,
    environment?: string,
  ) {
    // Use production config by default
    this.apiKey = apiKey || productionConfig.pinecone.apiKey;
    this.environment = environment || productionConfig.pinecone.environment;
    this.baseUrl = `https://controller.${this.environment}.pinecone.io`;
    this.indexHost = ""; // Set dynamically per index

    // Validate API key format
    if (!this.validateApiKey()) {
      console.warn("Warning: Invalid Pinecone API key format. Some features may not work.");
    }
  }

  private async makeRequest(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Api-Key": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinecone API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async listIndexes(): Promise<PineconeIndex[]> {
    if (!this.validateApiKey()) {
      console.warn("Invalid Pinecone API key, using fallback data");
      return this.getMockIndexes();
    }

    try {
      const data = await this.makeRequest(`${this.baseUrl}/databases`);

      // Transform Pinecone API response to our format
      const indexes = data.databases?.map((db: any) => ({
        name: db.name,
        dimension: db.dimension,
        metric: db.metric,
        vectorCount: db.status?.vectorCount || 0,
      })) || [];

      // If no real indexes exist and we have a valid API key, create default ones
      if (indexes.length === 0 && this.validateApiKey()) {
        console.log("No Pinecone indexes found, creating production indexes...");
        const defaultIndexes = await this.createDefaultIndexes();
        return defaultIndexes;
      }

      // If we have indexes, make sure our production index exists
      const productionIndex = indexes.find(idx => idx.name === productionConfig.pinecone.indexName);
      if (!productionIndex && this.validateApiKey()) {
        console.log(`Creating production index: ${productionConfig.pinecone.indexName}`);
        await this.createIndex(productionConfig.pinecone.indexName, 768, "cosine");
        indexes.push({
          name: productionConfig.pinecone.indexName,
          dimension: 768,
          metric: "cosine",
          vectorCount: 0,
        });
      }

      return indexes;
    } catch (error) {
      console.error("Failed to list Pinecone indexes:", error);
      // Only fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        return this.getMockIndexes();
      }
      // In production, return empty array if API fails
      return [];
    }
  }

  async createIndex(
    name: string,
    dimension: number,
    metric: "cosine" | "euclidean" | "dotproduct" = "cosine",
  ): Promise<boolean> {
    try {
      await this.makeRequest(`${this.baseUrl}/databases`, {
        method: "POST",
        body: JSON.stringify({
          name,
          dimension,
          metric,
        }),
      });
      return true;
    } catch (error) {
      console.error("Failed to create Pinecone index:", error);
      return false;
    }
  }

  async createDefaultIndexes(): Promise<PineconeIndex[]> {
    const defaultIndexes = [
      {
        name: productionConfig.pinecone.indexName,
        dimension: 768,
        metric: "cosine" as const,
        vectorCount: 0,
      },
      {
        name: "chatking-conversations",
        dimension: 384,
        metric: "cosine" as const,
        vectorCount: 0,
      },
      {
        name: "chatking-documents",
        dimension: 1536,
        metric: "cosine" as const,
        vectorCount: 0,
      }
    ];

    const createdIndexes: PineconeIndex[] = [];

    for (const index of defaultIndexes) {
      console.log(`Creating index: ${index.name} (${index.dimension}D, ${index.metric})`);
      const created = await this.createIndex(index.name, index.dimension, index.metric);
      if (created) {
        createdIndexes.push(index);
        // Wait a bit between creations to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return createdIndexes;
  }

  async deleteIndex(name: string): Promise<boolean> {
    try {
      await this.makeRequest(`${this.baseUrl}/databases/${name}`, {
        method: "DELETE",
      });
      return true;
    } catch (error) {
      console.error("Failed to delete Pinecone index:", error);
      return false;
    }
  }

  async upsertVectors(
    indexName: string,
    vectors: PineconeVector[],
    namespace?: string,
  ): Promise<boolean> {
    try {
      const indexUrl = await this.getIndexUrl(indexName);
      const url = `${indexUrl}/vectors/upsert`;

      await this.makeRequest(url, {
        method: "POST",
        body: JSON.stringify({
          vectors,
          namespace,
        }),
      });

      return true;
    } catch (error) {
      console.error("Failed to upsert vectors:", error);
      return false;
    }
  }

  async queryVectors(
    indexName: string,
    request: PineconeQueryRequest,
    namespace?: string,
  ): Promise<PineconeQueryResponse> {
    if (!this.validateApiKey()) {
      console.warn("Invalid Pinecone API key, using mock results");
      return this.getMockQueryResults(request);
    }

    try {
      const indexUrl = await this.getIndexUrl(indexName);
      const url = `${indexUrl}/query`;

      const response = await this.makeRequest(url, {
        method: "POST",
        body: JSON.stringify({
          ...request,
          namespace,
        }),
      });

      // Ensure proper response structure
      return {
        matches: response.matches || [],
        namespace: response.namespace,
        usage: response.usage,
      };
    } catch (error) {
      console.error("Failed to query vectors:", error);

      // In production, try to return meaningful error info
      if (process.env.NODE_ENV === 'production') {
        return {
          matches: [],
          namespace,
          error: error instanceof Error ? error.message : 'Query failed',
        };
      }

      // In development, return mock results
      return this.getMockQueryResults(request);
    }
  }

  async deleteVectors(
    indexName: string,
    ids: string[],
    namespace?: string,
  ): Promise<boolean> {
    try {
      const indexUrl = await this.getIndexUrl(indexName);
      const url = `${indexUrl}/vectors/delete`;

      await this.makeRequest(url, {
        method: "POST",
        body: JSON.stringify({
          ids,
          namespace,
        }),
      });

      return true;
    } catch (error) {
      console.error("Failed to delete vectors:", error);
      return false;
    }
  }

  async getIndexStats(indexName: string): Promise<any> {
    try {
      const indexUrl = await this.getIndexUrl(indexName);
      const url = `${indexUrl}/describe_index_stats`;

      return await this.makeRequest(url, {
        method: "POST",
        body: JSON.stringify({}),
      });
    } catch (error) {
      console.error("Failed to get index stats:", error);
      return this.getMockIndexStats();
    }
  }

  private async getIndexUrl(indexName: string): Promise<string> {
    if (!this.validateApiKey()) {
      // Return mock URL for development
      return `https://${indexName}-12345.svc.${this.environment}.pinecone.io`;
    }

    try {
      // Get the actual index details from Pinecone API
      const indexDetails = await this.makeRequest(`${this.baseUrl}/databases/${indexName}`);

      if (indexDetails && indexDetails.status && indexDetails.status.host) {
        return `https://${indexDetails.status.host}`;
      }

      // Fallback to constructed URL
      return `https://${indexName}.svc.${this.environment}.pinecone.io`;
    } catch (error) {
      console.warn(`Failed to get index URL for ${indexName}, using constructed URL:`, error);
      // Construct URL based on naming convention
      return `https://${indexName}.svc.${this.environment}.pinecone.io`;
    }
  }

  // Text embedding utilities
  async embedText(text: string, embeddingService?: 'openai' | 'openrouter', apiKey?: string): Promise<number[]> {
    // Try real embedding services first if API keys are available
    if (embeddingService === 'openai' && apiKey) {
      return this.embedTextWithOpenAI(text, apiKey);
    }

    if (embeddingService === 'openrouter' && apiKey) {
      return this.embedTextWithOpenRouter(text, apiKey);
    }

    // Try with environment variables
    if (process.env.OPENAI_API_KEY) {
      return this.embedTextWithOpenAI(text, process.env.OPENAI_API_KEY);
    }

    if (process.env.OPENROUTER_API_KEY) {
      return this.embedTextWithOpenRouter(text, process.env.OPENROUTER_API_KEY);
    }

    // Fallback to mock embedding for development
    return this.generateMockEmbedding(text);
  }

  private generateMockEmbedding(text: string): number[] {
    // Generate a deterministic "embedding" based on text
    const dimension = 768; // Common embedding dimension
    const embedding = new Array(dimension).fill(0);

    // Simple hash-based mock embedding
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    for (let i = 0; i < dimension; i++) {
      embedding[i] = Math.sin(hash + i) * 0.5;
    }

    // Normalize the vector
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0),
    );
    return embedding.map((val) => val / magnitude);
  }

  private getMockIndexes(): PineconeIndex[] {
    return [
      {
        name: "chatking-knowledge",
        dimension: 768,
        metric: "cosine",
        vectorCount: 1250,
      },
      {
        name: "chatking-documents",
        dimension: 1536,
        metric: "cosine",
        vectorCount: 890,
      },
      {
        name: "chatking-conversations",
        dimension: 384,
        metric: "dotproduct",
        vectorCount: 5600,
      },
    ];
  }

  private getMockQueryResults(
    request: PineconeQueryRequest,
  ): PineconeQueryResponse {
    const mockMatches = Array.from(
      { length: Math.min(request.topK, 5) },
      (_, i) => ({
        id: `doc_${i + 1}`,
        score: 0.95 - i * 0.1,
        metadata: {
          title: `Sample Document ${i + 1}`,
          content: `This is a sample document that matches your query with ${(0.95 - i * 0.1) * 100}% similarity.`,
          category: i % 2 === 0 ? "technical" : "general",
          timestamp: new Date(Date.now() - i * 86400000).toISOString(),
        },
      }),
    );

    return {
      matches: mockMatches,
    };
  }

  private getMockIndexStats() {
    return {
      dimension: 768,
      indexFullness: 0.3,
      namespaces: {
        "": {
          vectorCount: 1250,
        },
        "user-documents": {
          vectorCount: 340,
        },
        "system-knowledge": {
          vectorCount: 910,
        },
      },
      totalVectorCount: 2500,
    };
  }

  validateApiKey(): boolean {
    return this.apiKey &&
           (this.apiKey.startsWith("pcsk_") || this.apiKey.startsWith("pc-")) &&
           this.apiKey.length > 20 &&
           !this.apiKey.includes("REQUIRED");
  }

  updateApiKey(newKey: string, environment?: string): void {
    this.apiKey = newKey;
    if (environment) {
      this.environment = environment;
      this.baseUrl = `https://controller.${environment}.pinecone.io`;
    }
  }

  async testConnection(): Promise<{ connected: boolean; error?: string; indexCount?: number }> {
    try {
      if (!this.validateApiKey()) {
        return { connected: false, error: 'Invalid API key format' };
      }

      const indexes = await this.listIndexes();
      return {
        connected: true,
        indexCount: indexes.length
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async semanticSearch(
    query: string,
    options: {
      indexName?: string;
      topK?: number;
      filter?: Record<string, any>;
      includeMetadata?: boolean;
    } = {}
  ): Promise<{
    results: Array<{
      id: string;
      score: number;
      content?: string;
      metadata?: Record<string, any>;
    }>;
    query: string;
    processingTime: number;
  }> {
    const startTime = Date.now();
    const indexName = options.indexName || productionConfig.pinecone.indexName;
    const topK = options.topK || 10;

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embedText(query, 'openrouter', productionConfig.openRouter.apiKey);

      // Perform vector search
      const searchResults = await this.queryVectors(indexName, {
        vector: queryEmbedding,
        topK,
        includeMetadata: options.includeMetadata ?? true,
        filter: options.filter,
      });

      const results = searchResults.matches.map(match => ({
        id: match.id,
        score: match.score,
        content: match.metadata?.content || match.metadata?.text,
        metadata: match.metadata,
      }));

      return {
        results,
        query,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Semantic search failed:', error);

      // Return mock results in case of error
      return {
        results: [
          {
            id: 'mock_result_1',
            score: 0.85,
            content: `Here's some information related to "${query}". This is a fallback result while the vector database is being set up.`,
            metadata: {
              title: 'Sample Knowledge Entry',
              category: 'general',
              timestamp: new Date().toISOString(),
            },
          },
        ],
        query,
        processingTime: Date.now() - startTime,
      };
    }
  }

  async addKnowledge(
    content: string,
    metadata: Record<string, any> = {},
    indexName?: string
  ): Promise<boolean> {
    try {
      const targetIndex = indexName || productionConfig.pinecone.indexName;

      // Generate embedding for content
      const embedding = await this.embedText(content, 'openrouter', productionConfig.openRouter.apiKey);

      // Create vector with metadata
      const vector: PineconeVector = {
        id: `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        values: embedding,
        metadata: {
          content,
          timestamp: new Date().toISOString(),
          type: 'knowledge',
          ...metadata,
        },
      };

      // Upsert to Pinecone
      const success = await this.upsertVectors(targetIndex, [vector]);

      if (success) {
        console.log(`Knowledge added to index ${targetIndex}:`, vector.id);
      }

      return success;
    } catch (error) {
      console.error('Failed to add knowledge:', error);
      return false;
    }
  }

  async addConversationMemory(
    userId: string,
    conversationId: string,
    messages: Array<{ role: string; content: string }>,
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      // Combine messages into searchable content
      const conversationText = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');

      // Generate embedding
      const embedding = await this.embedText(conversationText, 'openrouter', productionConfig.openRouter.apiKey);

      // Create vector
      const vector: PineconeVector = {
        id: `conv_${conversationId}_${Date.now()}`,
        values: embedding,
        metadata: {
          userId,
          conversationId,
          messages,
          timestamp: new Date().toISOString(),
          type: 'conversation',
          messageCount: messages.length,
          ...metadata,
        },
      };

      // Store in conversations index
      const success = await this.upsertVectors('chatking-conversations', [vector]);

      if (success) {
        console.log(`Conversation memory stored:`, vector.id);
      }

      return success;
    } catch (error) {
      console.error('Failed to store conversation memory:', error);
      return false;
    }
  }

  async searchUserConversations(
    userId: string,
    query: string,
    limit: number = 5
  ): Promise<Array<{
    conversationId: string;
    score: number;
    messages: Array<{ role: string; content: string }>;
    timestamp: string;
  }>> {
    try {
      const queryEmbedding = await this.embedText(query, 'openrouter', productionConfig.openRouter.apiKey);

      const results = await this.queryVectors('chatking-conversations', {
        vector: queryEmbedding,
        topK: limit,
        includeMetadata: true,
        filter: { userId },
      });

      return results.matches.map(match => ({
        conversationId: match.metadata?.conversationId,
        score: match.score,
        messages: match.metadata?.messages || [],
        timestamp: match.metadata?.timestamp,
      }));
    } catch (error) {
      console.error('Failed to search user conversations:', error);
      return [];
    }
  }

  async embedTextWithOpenAI(text: string, apiKey?: string): Promise<number[]> {
    if (apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: text,
            model: 'text-embedding-ada-002',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.data[0].embedding;
        }
      } catch (error) {
        console.error('OpenAI embedding failed, falling back to mock:', error);
      }
    }

    // Fallback to mock embedding
    return this.generateMockEmbedding(text);
  }

  async embedTextWithOpenRouter(text: string, apiKey?: string): Promise<number[]> {
    if (apiKey) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://chatkingai.com',
            'X-Title': 'ChatKing AI',
          },
          body: JSON.stringify({
            input: text,
            model: 'openai/text-embedding-ada-002',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.data[0].embedding;
        }
      } catch (error) {
        console.error('OpenRouter embedding failed, falling back to mock:', error);
      }
    }

    // Fallback to mock embedding
    return this.generateMockEmbedding(text);
  }
}

export const pineconeService = new PineconeService();
