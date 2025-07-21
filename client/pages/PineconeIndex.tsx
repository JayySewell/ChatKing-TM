import { Database, Search, Brain, Archive } from 'lucide-react';
import { Layout } from '../components/Layout';

export default function PineconeIndex() {
  return (
    <Layout isAuthenticated={true} isOwner={true} username="Owner">
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-neon-purple to-purple-400 flex items-center justify-center">
            <Database className="w-10 h-10 text-main-bg" />
          </div>
          
          <h1 className="font-orbitron font-bold text-4xl text-glow-cyber mb-4">
            Pinecone Index
          </h1>
          
          <p className="text-text-muted text-lg mb-8 max-w-2xl mx-auto">
            Knowledge indexing and vector search for intelligent data retrieval and analysis.
          </p>

          <div className="glass-card mb-8">
            <h3 className="font-semibold text-xl mb-4 text-text-primary">Coming Soon</h3>
            <p className="text-text-muted mb-6">
              This advanced knowledge management system will feature:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 text-left">
                <Search className="w-5 h-5 text-neon-purple" />
                <span className="text-text-primary">Vector Search</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <Brain className="w-5 h-5 text-neon-purple" />
                <span className="text-text-primary">Knowledge Indexing</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <Archive className="w-5 h-5 text-neon-purple" />
                <span className="text-text-primary">Private Data Storage</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <Database className="w-5 h-5 text-neon-purple" />
                <span className="text-text-primary">Session Tracking</span>
              </div>
            </div>
          </div>

          <p className="text-cyber-blue">
            Continue prompting to have this page built out with full Pinecone integration!
          </p>
        </div>
      </div>
    </Layout>
  );
}
