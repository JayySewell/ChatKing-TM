import { Globe, Search, Shield, Wifi } from 'lucide-react';
import { Layout } from '../components/Layout';

export default function Web() {
  return (
    <Layout isAuthenticated={true} isOwner={true} username="Owner">
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-neon-green to-green-400 flex items-center justify-center">
            <Globe className="w-10 h-10 text-main-bg" />
          </div>
          
          <h1 className="font-orbitron font-bold text-4xl text-glow-cyber mb-4">
            ChatKing Web
          </h1>
          
          <p className="text-text-muted text-lg mb-8 max-w-2xl mx-auto">
            Full BraveSearch-powered browser with real search results, privacy modes, and VPN/proxy integration.
          </p>

          <div className="glass-card mb-8">
            <h3 className="font-semibold text-xl mb-4 text-text-primary">Coming Soon</h3>
            <p className="text-text-muted mb-6">
              This powerful web browsing mode is under development and will include:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 text-left">
                <Search className="w-5 h-5 text-neon-green" />
                <span className="text-text-primary">BraveSearch Integration</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <Shield className="w-5 h-5 text-neon-green" />
                <span className="text-text-primary">Privacy & Incognito Mode</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <Wifi className="w-5 h-5 text-neon-green" />
                <span className="text-text-primary">VPN/Proxy Support</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <Globe className="w-5 h-5 text-neon-green" />
                <span className="text-text-primary">Real-time Search Results</span>
              </div>
            </div>
          </div>

          <p className="text-cyber-blue">
            Continue prompting to have this page built out with full functionality!
          </p>
        </div>
      </div>
    </Layout>
  );
}
