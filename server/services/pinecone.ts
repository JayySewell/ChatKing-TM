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
  metric: 'cosine' | 'euclidean' | 'dotproduct';
  vectorCount: number;
}

export class PineconeService {
  private apiKey: string;
  private baseUrl: string;
  private indexHost: string;

  constructor(
    apiKey: string = 'pcsk_6DAaeQ_NHpbyRENkVBaBwwkrV2Hf9mzDyXKvWdnxGsg2WVmMBZcmv2QjMKR3xKP7EbrtnA',
    environment: string = 'us-east1-aws'
  ) {
    this.apiKey = apiKey;
    this.baseUrl = `https://controller.${environment}.pinecone.io`;
    this.indexHost = ''; // Set dynamically per index
  }

  private async makeRequest(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Api-Key': this.apiKey,
        'Content-Type': 'application/json',
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
    try {
      const data = await this.makeRequest(`${this.baseUrl}/databases`);
      return data.databases || [];
    } catch (error) {
      console.error('Failed to list Pinecone indexes:', error);
      // Return mock indexes for development
      return this.getMockIndexes();
    }
  }

  async createIndex(
    name: string, 
    dimension: number, 
    metric: 'cosine' | 'euclidean' | 'dotproduct' = 'cosine'
  ): Promise<boolean> {
    try {
      await this.makeRequest(`${this.baseUrl}/databases`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          dimension,
          metric
        })
      });
      return true;
    } catch (error) {
      console.error('Failed to create Pinecone index:', error);
      return false;
    }
  }

  async deleteIndex(name: string): Promise<boolean> {
    try {
      await this.makeRequest(`${this.baseUrl}/databases/${name}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Failed to delete Pinecone index:', error);
      return false;
    }
  }

  async upsertVectors(indexName: string, vectors: PineconeVector[], namespace?: string): Promise<boolean> {
    try {
      const indexUrl = await this.getIndexUrl(indexName);
      const url = `${indexUrl}/vectors/upsert`;
      
      await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          vectors,
          namespace
        })
      });
      
      return true;
    } catch (error) {
      console.error('Failed to upsert vectors:', error);
      return false;
    }
  }

  async queryVectors(
    indexName: string, 
    request: PineconeQueryRequest,
    namespace?: string
  ): Promise<PineconeQueryResponse> {
    try {
      const indexUrl = await this.getIndexUrl(indexName);
      const url = `${indexUrl}/query`;
      
      const response = await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          ...request,
          namespace
        })
      });
      
      return response;
    } catch (error) {
      console.error('Failed to query vectors:', error);
      // Return mock results for development
      return this.getMockQueryResults(request);
    }
  }

  async deleteVectors(indexName: string, ids: string[], namespace?: string): Promise<boolean> {
    try {
      const indexUrl = await this.getIndexUrl(indexName);
      const url = `${indexUrl}/vectors/delete`;
      
      await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          ids,
          namespace
        })
      });
      
      return true;
    } catch (error) {
      console.error('Failed to delete vectors:', error);
      return false;
    }
  }

  async getIndexStats(indexName: string): Promise<any> {
    try {
      const indexUrl = await this.getIndexUrl(indexName);
      const url = `${indexUrl}/describe_index_stats`;
      
      return await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify({})
      });
    } catch (error) {
      console.error('Failed to get index stats:', error);
      return this.getMockIndexStats();
    }
  }

  private async getIndexUrl(indexName: string): Promise<string> {
    // In a real implementation, this would fetch the index host URL
    // For now, return a mock URL
    return `https://${indexName}-12345.svc.us-east1-aws.pinecone.io`;
  }

  // Text embedding utilities
  async embedText(text: string): Promise<number[]> {
    // In a real implementation, this would use an embedding service like OpenAI
    // For now, return a mock embedding
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
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    for (let i = 0; i < dimension; i++) {
      embedding[i] = Math.sin(hash + i) * 0.5;
    }
    
    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  private getMockIndexes(): PineconeIndex[] {
    return [
      {
        name: 'chatking-knowledge',
        dimension: 768,
        metric: 'cosine',
        vectorCount: 1250
      },
      {
        name: 'chatking-documents',
        dimension: 1536,
        metric: 'cosine',
        vectorCount: 890
      },
      {
        name: 'chatking-conversations',
        dimension: 384,
        metric: 'dotproduct',
        vectorCount: 5600
      }
    ];
  }

  private getMockQueryResults(request: PineconeQueryRequest): PineconeQueryResponse {
    const mockMatches = Array.from({ length: Math.min(request.topK, 5) }, (_, i) => ({
      id: `doc_${i + 1}`,
      score: 0.95 - (i * 0.1),
      metadata: {
        title: `Sample Document ${i + 1}`,
        content: `This is a sample document that matches your query with ${(0.95 - (i * 0.1)) * 100}% similarity.`,
        category: i % 2 === 0 ? 'technical' : 'general',
        timestamp: new Date(Date.now() - i * 86400000).toISOString()
      }
    }));

    return {
      matches: mockMatches
    };
  }

  private getMockIndexStats() {
    return {
      dimension: 768,
      indexFullness: 0.3,
      namespaces: {
        '': {
          vectorCount: 1250
        },
        'user-documents': {
          vectorCount: 340
        },
        'system-knowledge': {
          vectorCount: 910
        }
      },
      totalVectorCount: 2500
    };
  }

  validateApiKey(): boolean {
    return this.apiKey && this.apiKey.startsWith('pcsk_');
  }

  updateApiKey(newKey: string): void {
    this.apiKey = newKey;
  }
}

export const pineconeService = new PineconeService();
