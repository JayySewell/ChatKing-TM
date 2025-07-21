import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, Crown, Shield } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user info
        localStorage.setItem('chatking_token', data.token);
        localStorage.setItem('chatking_user', JSON.stringify(data.user));
        
        // Redirect to home
        navigate('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = () => {
    setEmail('owner@chatkingai.com');
    setPassword('chatking123');
  };

  return (
    <div className="min-h-screen bg-main-bg flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-blue/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-green/3 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyber-blue to-neon-purple flex items-center justify-center">
            <Zap className="w-8 h-8 text-main-bg" />
          </div>
          <h1 className="font-orbitron font-black text-4xl text-glow-cyber mb-2">
            Chat<span className="text-neon-amber">King</span>
          </h1>
          <p className="text-text-muted">Sign in to your AI platform</p>
        </div>

        {/* Login Form */}
        <div className="glass-card">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 bg-neon-red/10 border border-neon-red/30 rounded text-neon-red text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full cyber-input"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full cyber-input pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-cyber text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-main-bg border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Login */}
          <div className="mt-6 pt-6 border-t border-border-glow">
            <button
              onClick={loginAsDemo}
              className="w-full btn-ghost-cyber text-sm py-2 flex items-center justify-center space-x-2"
            >
              <Crown className="w-4 h-4 text-neon-amber" />
              <span>Use Demo Owner Account</span>
            </button>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-text-muted text-sm">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-cyber-blue hover:text-cyber-blue-light transition-colors font-medium"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 glass-card">
          <div className="flex items-center space-x-2 text-sm text-text-muted">
            <Shield className="w-4 h-4 text-neon-green" />
            <span>Your data is encrypted and stored locally using CK-Storage</span>
          </div>
        </div>

        {/* API Status */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-4 text-xs text-text-muted">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
              <span>OpenRouter</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
              <span>BraveSearch</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
              <span>Pinecone</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
