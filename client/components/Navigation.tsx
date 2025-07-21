import { Link, useLocation } from 'react-router-dom';
import { Crown, Zap, Globe, Database, Calculator, Settings, User, LogOut } from 'lucide-react';
import { useState } from 'react';

interface NavigationProps {
  isAuthenticated?: boolean;
  isOwner?: boolean;
  username?: string;
}

export function Navigation({ isAuthenticated = false, isOwner = false, username = 'User' }: NavigationProps) {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const modes = [
    { path: '/ai', name: 'ChatKing AI', icon: Zap, color: 'text-cyber-blue' },
    { path: '/web', name: 'ChatKing Web', icon: Globe, color: 'text-neon-green' },
    { path: '/index', name: 'Pinecone Index', icon: Database, color: 'text-neon-purple' },
    { path: '/calculator', name: 'Calculator', icon: Calculator, color: 'text-neon-amber' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border-glow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-r from-cyber-blue to-neon-purple rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-main-bg" />
            </div>
            <span className="font-orbitron font-bold text-xl text-glow-cyber group-hover:text-cyber-blue-light transition-colors">
              ChatKing
            </span>
          </Link>

          {/* Mode Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {modes.map((mode) => (
              <Link
                key={mode.path}
                to={mode.path}
                className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center space-x-2 ${
                  location.pathname === mode.path
                    ? 'bg-cyber-blue/20 text-cyber-blue border-neon'
                    : 'text-text-muted hover:text-cyber-blue hover:bg-cyber-blue/10'
                }`}
              >
                <mode.icon className={`w-4 h-4 ${mode.color}`} />
                <span className="text-sm font-medium">{mode.name}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-cyber-blue/10 transition-colors"
                >
                  {isOwner && (
                    <Crown className="w-4 h-4 text-neon-amber animate-pulse" />
                  )}
                  <User className="w-4 h-4 text-cyber-blue" />
                  <span className="text-sm font-medium text-text-primary">{username}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 glass-card rounded-md shadow-lg border border-border-glow">
                    <div className="py-1">
                      {isOwner && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2 text-sm text-neon-amber hover:bg-neon-amber/10 transition-colors"
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      )}
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-text-primary hover:bg-cyber-blue/10 transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                      <button className="flex items-center w-full px-4 py-2 text-sm text-neon-red hover:bg-neon-red/10 transition-colors">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="btn-ghost-cyber text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-cyber text-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-border-glow">
        <div className="px-2 py-3 space-y-1">
          {modes.map((mode) => (
            <Link
              key={mode.path}
              to={mode.path}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === mode.path
                  ? 'bg-cyber-blue/20 text-cyber-blue'
                  : 'text-text-muted hover:text-cyber-blue hover:bg-cyber-blue/10'
              }`}
            >
              <div className="flex items-center space-x-2">
                <mode.icon className={`w-4 h-4 ${mode.color}`} />
                <span>{mode.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
