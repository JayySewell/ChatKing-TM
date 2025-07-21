import { Link, useLocation } from "react-router-dom";
import {
  Crown,
  Zap,
  Globe,
  Database,
  Calculator,
  Settings,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

interface NavigationProps {
  isAuthenticated?: boolean;
  isOwner?: boolean;
  username?: string;
}

export function Navigation({
  isAuthenticated = false,
  isOwner = false,
  username = "User",
}: NavigationProps) {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowMobileMenu(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const modes = [
    { path: "/ai", name: "ChatKing AI", icon: Zap, color: "text-cyber-blue" },
    {
      path: "/web",
      name: "ChatKing Web",
      icon: Globe,
      color: "text-neon-green",
    },
    {
      path: "/index",
      name: "Pinecone Index",
      icon: Database,
      color: "text-neon-purple",
    },
    {
      path: "/calculator",
      name: "Calculator",
      icon: Calculator,
      color: "text-neon-amber",
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border-glow">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 group flex-shrink-0"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-cyber-blue to-neon-purple rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-main-bg" />
            </div>
            <span className="font-orbitron font-bold text-lg sm:text-xl text-glow-cyber group-hover:text-cyber-blue-light transition-colors">
              ChatKing
            </span>
          </Link>

          {/* Desktop Mode Navigation */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center max-w-2xl">
            {modes.map((mode) => (
              <Link
                key={mode.path}
                to={mode.path}
                className={`px-3 py-2 rounded-md transition-all duration-300 flex items-center space-x-2 ${
                  location.pathname === mode.path
                    ? "bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30"
                    : "text-text-muted hover:text-cyber-blue hover:bg-cyber-blue/10"
                }`}
              >
                <mode.icon className={`w-4 h-4 ${mode.color}`} />
                <span className="text-sm font-medium hidden xl:block">
                  {mode.name}
                </span>
                <span className="text-xs font-medium xl:hidden">
                  {mode.name.split(" ")[1] || mode.name}
                </span>
              </Link>
            ))}
          </div>

          {/* Tablet Mode Navigation */}
          <div className="hidden md:flex lg:hidden items-center space-x-1 flex-1 justify-center">
            {modes.map((mode) => (
              <Link
                key={mode.path}
                to={mode.path}
                className={`p-2 rounded-md transition-all duration-300 ${
                  location.pathname === mode.path
                    ? "bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30"
                    : "text-text-muted hover:text-cyber-blue hover:bg-cyber-blue/10"
                }`}
                title={mode.name}
              >
                <mode.icon className={`w-4 h-4 ${mode.color}`} />
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {isAuthenticated && (
              <div className="flex items-center space-x-1">
                {isOwner && <Crown className="w-3 h-3 text-neon-amber" />}
                <span className="text-xs font-medium text-text-primary max-w-16 truncate">
                  {username}
                </span>
              </div>
            )}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-md hover:bg-cyber-blue/10 transition-colors"
            >
              {showMobileMenu ? (
                <X className="w-5 h-5 text-cyber-blue" />
              ) : (
                <Menu className="w-5 h-5 text-cyber-blue" />
              )}
            </button>
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
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
                  <span className="text-sm font-medium text-text-primary hidden lg:block">
                    {username}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 glass-card rounded-md shadow-lg border border-border-glow">
                    <div className="py-1">
                      {isOwner && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center px-4 py-2 text-sm text-neon-amber hover:bg-neon-amber/10 transition-colors"
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center px-4 py-2 text-sm text-text-primary hover:bg-cyber-blue/10 transition-colors"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center px-4 py-2 text-sm text-text-primary hover:bg-cyber-blue/10 transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          // Add logout functionality
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-neon-red hover:bg-neon-red/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="btn-ghost-cyber text-sm px-3 py-2">
                  Login
                </Link>
                <Link to="/register" className="btn-cyber text-sm px-3 py-2">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="md:hidden absolute top-full left-0 right-0 glass border-b border-border-glow z-50 max-h-screen overflow-y-auto">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Mode Navigation */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Modes
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {modes.map((mode) => (
                  <Link
                    key={mode.path}
                    to={mode.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex flex-col items-center space-y-2 p-3 rounded-md transition-colors ${
                      location.pathname === mode.path
                        ? "bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30"
                        : "text-text-muted hover:text-cyber-blue hover:bg-cyber-blue/10"
                    }`}
                  >
                    <mode.icon className={`w-6 h-6 ${mode.color}`} />
                    <span className="text-xs font-medium text-center">
                      {mode.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile User Menu */}
            {isAuthenticated ? (
              <div className="space-y-2 pt-4 border-t border-border-glow">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Account
                </h3>
                <div className="space-y-1">
                  {isOwner && (
                    <Link
                      to="/admin"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center space-x-3 px-3 py-3 rounded-md text-neon-amber hover:bg-neon-amber/10 transition-colors"
                    >
                      <Crown className="w-5 h-5" />
                      <span className="font-medium">Admin Dashboard</span>
                    </Link>
                  )}
                  <Link
                    to="/settings"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center space-x-3 px-3 py-3 rounded-md text-text-primary hover:bg-cyber-blue/10 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      // Add logout functionality
                    }}
                    className="flex items-center space-x-3 px-3 py-3 rounded-md text-neon-red hover:bg-neon-red/10 transition-colors w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-4 border-t border-border-glow">
                <Link
                  to="/login"
                  onClick={() => setShowMobileMenu(false)}
                  className="block w-full text-center py-3 px-4 rounded-md border border-cyber-blue text-cyber-blue hover:bg-cyber-blue/10 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setShowMobileMenu(false)}
                  className="block w-full text-center py-3 px-4 rounded-md bg-cyber-blue text-main-bg hover:bg-cyber-blue-dark transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
