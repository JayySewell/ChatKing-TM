import { useState, useEffect } from 'react';
import { 
  Database, Search, Plus, Trash2, Upload, Download, 
  Brain, Archive, Settings, BarChart3, FileText, 
  Zap, Target, BookOpen
} from 'lucide-react';
import { Layout } from '../components/Layout';

interface PineconeIndex {
  name: string;
  dimension: number;
  metric: 'cosine' | 'euclidean' | 'dotproduct';
  vectorCount: number;
}

interface UserIndex {
  id: string;
  name: string;
  vectors: any[];
  createdAt: string;
  updatedAt: string;
}

interface QueryResult {
  id: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
  indexName?: string;
  title?: string;
}

interface IndexStats {
  dimension: number;
  indexFullness: number;
  namespaces: Record<string, { vectorCount: number }>;
  totalVectorCount: number;
}

export default function PineconeIndex() {
  const [activeTab, setActiveTab] = useState<'search' | 'manage' | 'upload'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<QueryResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pineconeIndexes, setPineconeIndexes] = useState<PineconeIndex[]>([]);
  const [userIndexes, setUserIndexes] = useState<UserIndex[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<string>('');
  const [indexStats, setIndexStats] = useState<IndexStats | null>(null);
  const [newIndexName, setNewIndexName] = useState('');
  const [newIndexDimension, setNewIndexDimension] = useState(768);
  const [newIndexMetric, setNewIndexMetric] = useState<'cosine' | 'euclidean' | 'dotproduct'>('cosine');
  const [uploadText, setUploadText] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [userId] = useState('demo-user');

  useEffect(() => {
    loadIndexes();
  }, []);

  useEffect(() => {
    if (selectedIndex) {
      loadIndexStats(selectedIndex);
    }
  }, [selectedIndex]);

  const loadIndexes = async () => {
    try {
      const response = await fetch(`/api/pinecone/indexes/${userId}`);
      const data = await response.json();
      
      if (data.pineconeIndexes) {
        setPineconeIndexes(data.pineconeIndexes);
      }
      if (data.userIndexes) {
        setUserIndexes(data.userIndexes);
      }
      
      // Set first available index as selected
      if (data.pineconeIndexes?.length > 0 && !selectedIndex) {
        setSelectedIndex(data.pineconeIndexes[0].name);
      }
    } catch (error) {
      console.error('Failed to load indexes:', error);
    }
  };

  const loadIndexStats = async (indexName: string) => {
    try {
      const response = await fetch(`/api/pinecone/stats/${indexName}?userId=${userId}`);
      const data = await response.json();
      
      if (data.stats) {
        setIndexStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load index stats:', error);
    }
  };

  const searchKnowledge = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch('/api/pinecone/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          userId: userId,
          limit: 20
        })
      });

      const data = await response.json();
      
      if (data.results) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const createIndex = async () => {
    if (!newIndexName.trim()) return;

    try {
      const response = await fetch('/api/pinecone/indexes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newIndexName,
          dimension: newIndexDimension,
          metric: newIndexMetric,
          userId: userId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setNewIndexName('');
        loadIndexes();
      }
    } catch (error) {
      console.error('Failed to create index:', error);
    }
  };

  const uploadDocument = async () => {
    if (!uploadText.trim() || !selectedIndex) return;

    setIsUploading(true);
    try {
      const response = await fetch('/api/pinecone/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          indexName: selectedIndex,
          documents: [{
            content: uploadText,
            metadata: {
              title: uploadTitle || 'Untitled Document',
              category: uploadCategory || 'general',
              uploadedAt: new Date().toISOString()
            }
          }],
          userId: userId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setUploadText('');
        setUploadTitle('');
        setUploadCategory('');
        loadIndexStats(selectedIndex);
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const querySpecificIndex = async (indexName: string, query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch('/api/pinecone/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          indexName,
          query,
          topK: 10,
          userId: userId
        })
      });

      const data = await response.json();
      
      if (data.results) {
        setSearchResults(data.results);
        setSearchQuery(query);
        setActiveTab('search');
      }
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1) + '%';
  };

  return (
    <Layout isAuthenticated={true} isOwner={true} username="Owner">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-purple to-purple-400 flex items-center justify-center">
              <Database className="w-8 h-8 text-main-bg" />
            </div>
            <h1 className="font-orbitron font-bold text-4xl text-glow-cyber mb-2">
              Pinecone Index
            </h1>
            <p className="text-text-muted text-lg">
              Knowledge indexing and vector search for intelligent data retrieval
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-center space-x-1 mb-8">
            {[
              { id: 'search', label: 'Search Knowledge', icon: Search },
              { id: 'manage', label: 'Manage Indexes', icon: Settings },
              { id: 'upload', label: 'Upload Data', icon: Upload }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded transition-all ${
                  activeTab === id
                    ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/50'
                    : 'text-text-muted hover:text-text-primary hover:bg-neon-purple/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Search Tab */}
              {activeTab === 'search' && (
                <div className="space-y-6">
                  {/* Search Interface */}
                  <div className="glass-card">
                    <h3 className="font-semibold text-xl mb-4 text-text-primary flex items-center">
                      <Brain className="w-6 h-6 mr-2 text-neon-purple" />
                      Knowledge Search
                    </h3>
                    
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && searchKnowledge()}
                          placeholder="Search across all your knowledge bases..."
                          className="w-full cyber-input pr-12"
                        />
                        <button
                          onClick={searchKnowledge}
                          disabled={isSearching}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded hover:bg-neon-purple/20 transition-colors"
                        >
                          {isSearching ? (
                            <div className="w-4 h-4 border-2 border-neon-purple border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Search className="w-4 h-4 text-neon-purple" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-text-muted">
                      Vector search across {pineconeIndexes.length + userIndexes.length} knowledge indexes
                    </p>
                  </div>

                  {/* Search Results */}
                  <div className="space-y-4">
                    {searchResults.map((result, index) => (
                      <div key={index} className="glass-card hover-glow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-lg text-neon-purple">
                                {result.title || `Document ${result.id}`}
                              </h4>
                              <span className="text-sm text-neon-green font-mono">
                                {formatScore(result.score)} match
                              </span>
                              {result.indexName && (
                                <span className="text-xs text-text-muted px-2 py-1 bg-secondary-bg rounded">
                                  {result.indexName}
                                </span>
                              )}
                            </div>
                            <p className="text-text-muted leading-relaxed mb-3">
                              {result.content.length > 300 
                                ? result.content.substring(0, 300) + '...' 
                                : result.content}
                            </p>
                            {result.metadata?.category && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-cyber-blue px-2 py-1 bg-cyber-blue/10 rounded">
                                  {result.metadata.category}
                                </span>
                                {result.metadata?.uploadedAt && (
                                  <span className="text-xs text-text-muted">
                                    {new Date(result.metadata.uploadedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <Target className="w-5 h-5 text-neon-purple" />
                          </div>
                        </div>
                      </div>
                    ))}

                    {searchQuery && searchResults.length === 0 && !isSearching && (
                      <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-text-muted mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-text-primary mb-2">No results found</h3>
                        <p className="text-text-muted">
                          Try different keywords or upload more documents to your knowledge base.
                        </p>
                      </div>
                    )}

                    {!searchQuery && (
                      <div className="text-center py-12">
                        <Brain className="w-16 h-16 text-text-muted mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-text-primary mb-2">Search Your Knowledge</h3>
                        <p className="text-text-muted mb-6">
                          Enter a query to search across all your indexed documents and data.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                          <button
                            onClick={() => querySpecificIndex('chatking-knowledge', 'machine learning')}
                            className="p-3 text-left rounded border border-border-glow hover:border-neon-purple/50 transition-colors"
                          >
                            <div className="font-medium text-neon-purple">Try: "machine learning"</div>
                            <div className="text-xs text-text-muted">Sample technical query</div>
                          </button>
                          <button
                            onClick={() => querySpecificIndex('chatking-documents', 'project documentation')}
                            className="p-3 text-left rounded border border-border-glow hover:border-neon-purple/50 transition-colors"
                          >
                            <div className="font-medium text-neon-purple">Try: "project documentation"</div>
                            <div className="text-xs text-text-muted">Sample document search</div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Manage Tab */}
              {activeTab === 'manage' && (
                <div className="space-y-6">
                  {/* Create New Index */}
                  <div className="glass-card">
                    <h3 className="font-semibold text-xl mb-4 text-text-primary flex items-center">
                      <Plus className="w-6 h-6 mr-2 text-neon-green" />
                      Create New Index
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Index Name
                        </label>
                        <input
                          type="text"
                          value={newIndexName}
                          onChange={(e) => setNewIndexName(e.target.value)}
                          placeholder="my-knowledge-base"
                          className="w-full cyber-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Dimension
                        </label>
                        <select
                          value={newIndexDimension}
                          onChange={(e) => setNewIndexDimension(Number(e.target.value))}
                          className="w-full cyber-input"
                        >
                          <option value={384}>384 (Small)</option>
                          <option value={768}>768 (Standard)</option>
                          <option value={1536}>1536 (Large)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Metric
                        </label>
                        <select
                          value={newIndexMetric}
                          onChange={(e) => setNewIndexMetric(e.target.value as any)}
                          className="w-full cyber-input"
                        >
                          <option value="cosine">Cosine</option>
                          <option value="euclidean">Euclidean</option>
                          <option value="dotproduct">Dot Product</option>
                        </select>
                      </div>
                    </div>
                    
                    <button
                      onClick={createIndex}
                      disabled={!newIndexName.trim()}
                      className="btn-cyber"
                    >
                      Create Index
                    </button>
                  </div>

                  {/* Existing Indexes */}
                  <div className="glass-card">
                    <h3 className="font-semibold text-xl mb-4 text-text-primary flex items-center">
                      <Archive className="w-6 h-6 mr-2 text-cyber-blue" />
                      Your Indexes
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pineconeIndexes.map((index) => (
                        <div 
                          key={index.name}
                          className={`p-4 rounded border cursor-pointer transition-all ${
                            selectedIndex === index.name
                              ? 'border-neon-purple bg-neon-purple/10'
                              : 'border-border-glow hover:border-neon-purple/50'
                          }`}
                          onClick={() => setSelectedIndex(index.name)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-text-primary">{index.name}</h4>
                            <Database className="w-4 h-4 text-neon-purple" />
                          </div>
                          <div className="text-sm text-text-muted space-y-1">
                            <div>Dimension: {index.dimension}</div>
                            <div>Metric: {index.metric}</div>
                            <div>Vectors: {index.vectorCount.toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {pineconeIndexes.length === 0 && (
                      <div className="text-center py-8">
                        <Archive className="w-12 h-12 text-text-muted mx-auto mb-3" />
                        <p className="text-text-muted">No indexes found. Create your first index above.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <div className="space-y-6">
                  <div className="glass-card">
                    <h3 className="font-semibold text-xl mb-4 text-text-primary flex items-center">
                      <Upload className="w-6 h-6 mr-2 text-neon-amber" />
                      Upload Document
                    </h3>
                    
                    {selectedIndex ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Target Index
                          </label>
                          <select
                            value={selectedIndex}
                            onChange={(e) => setSelectedIndex(e.target.value)}
                            className="w-full cyber-input"
                          >
                            {pineconeIndexes.map((index) => (
                              <option key={index.name} value={index.name}>
                                {index.name} ({index.vectorCount.toLocaleString()} vectors)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                              Document Title
                            </label>
                            <input
                              type="text"
                              value={uploadTitle}
                              onChange={(e) => setUploadTitle(e.target.value)}
                              placeholder="Enter document title..."
                              className="w-full cyber-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                              Category
                            </label>
                            <input
                              type="text"
                              value={uploadCategory}
                              onChange={(e) => setUploadCategory(e.target.value)}
                              placeholder="e.g., technical, research, general"
                              className="w-full cyber-input"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Document Content
                          </label>
                          <textarea
                            value={uploadText}
                            onChange={(e) => setUploadText(e.target.value)}
                            placeholder="Paste or type your document content here..."
                            rows={12}
                            className="w-full cyber-input resize-y"
                          />
                        </div>

                        <button
                          onClick={uploadDocument}
                          disabled={!uploadText.trim() || isUploading}
                          className="btn-cyber"
                        >
                          {isUploading ? 'Uploading...' : 'Upload Document'}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-text-muted mx-auto mb-3" />
                        <p className="text-text-muted">Select or create an index first to upload documents.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Index Stats */}
              {selectedIndex && indexStats && (
                <div className="glass-card">
                  <h4 className="font-semibold text-lg mb-3 text-text-primary flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-neon-green" />
                    Index Stats
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-text-muted">Total Vectors</div>
                      <div className="text-xl font-bold text-neon-green">
                        {indexStats.totalVectorCount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-text-muted">Dimension</div>
                      <div className="text-lg font-semibold text-text-primary">
                        {indexStats.dimension}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-text-muted">Index Fullness</div>
                      <div className="text-lg font-semibold text-cyber-blue">
                        {(indexStats.indexFullness * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-text-muted">Namespaces</div>
                      <div className="text-lg font-semibold text-neon-purple">
                        {Object.keys(indexStats.namespaces).length}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="glass-card">
                <h4 className="font-semibold text-lg mb-3 text-text-primary flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-neon-amber" />
                  Quick Actions
                </h4>
                <div className="space-y-2">
                  <button 
                    onClick={() => setActiveTab('search')}
                    className="w-full text-left p-3 rounded border border-border-glow hover:border-cyber-blue/50 transition-colors"
                  >
                    <div className="font-medium text-cyber-blue">Search Knowledge</div>
                    <div className="text-xs text-text-muted">Find information in your data</div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('upload')}
                    className="w-full text-left p-3 rounded border border-border-glow hover:border-neon-amber/50 transition-colors"
                  >
                    <div className="font-medium text-neon-amber">Upload Data</div>
                    <div className="text-xs text-text-muted">Add new documents</div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('manage')}
                    className="w-full text-left p-3 rounded border border-border-glow hover:border-neon-purple/50 transition-colors"
                  >
                    <div className="font-medium text-neon-purple">Manage Indexes</div>
                    <div className="text-xs text-text-muted">Create and configure</div>
                  </button>
                </div>
              </div>

              {/* API Status */}
              <div className="glass-card">
                <h4 className="font-semibold text-lg mb-3 text-text-primary">API Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Pinecone</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                      <span className="text-xs text-neon-green">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Embeddings</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                      <span className="text-xs text-neon-green">Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
