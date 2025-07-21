import { Calculator as CalcIcon, History, Sigma, PlusCircle } from 'lucide-react';
import { Layout } from '../components/Layout';

export default function Calculator() {
  return (
    <Layout isAuthenticated={true} isOwner={true} username="Owner">
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-neon-amber to-yellow-400 flex items-center justify-center">
            <CalcIcon className="w-10 h-10 text-main-bg" />
          </div>
          
          <h1 className="font-orbitron font-bold text-4xl text-glow-cyber mb-4">
            Scientific Calculator
          </h1>
          
          <p className="text-text-muted text-lg mb-8 max-w-2xl mx-auto">
            Advanced calculator with computation history and per-user session tracking.
          </p>

          <div className="glass-card mb-8">
            <h3 className="font-semibold text-xl mb-4 text-text-primary">Coming Soon</h3>
            <p className="text-text-muted mb-6">
              This comprehensive calculator system will include:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 text-left">
                <PlusCircle className="w-5 h-5 text-neon-amber" />
                <span className="text-text-primary">Basic & Advanced Math</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <History className="w-5 h-5 text-neon-amber" />
                <span className="text-text-primary">Calculation History</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <Function className="w-5 h-5 text-neon-amber" />
                <span className="text-text-primary">Scientific Functions</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <CalcIcon className="w-5 h-5 text-neon-amber" />
                <span className="text-text-primary">User Session Logs</span>
              </div>
            </div>
          </div>

          <p className="text-cyber-blue">
            Continue prompting to have this page built out with full calculator functionality!
          </p>
        </div>
      </div>
    </Layout>
  );
}
