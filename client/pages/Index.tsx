import { Link } from "react-router-dom";
import {
  Zap,
  Globe,
  Database,
  Calculator,
  Crown,
  Shield,
  Cpu,
  Sparkles,
} from "lucide-react";
import { Layout } from "../components/Layout";

export default function Index() {
  const modes = [
    {
      id: "ai",
      title: "ChatKing AI",
      description:
        "Advanced AI chat powered by OpenRouter with access to DeepSeek R1 Free, Gemma 3 27B Free, and more cutting-edge models.",
      icon: Zap,
      path: "/ai",
      color: "cyber-blue",
      gradient: "from-cyber-blue to-cyber-blue-dark",
    },
    {
      id: "web",
      title: "ChatKing Web",
      description:
        "Full BraveSearch-powered browser with real search results, privacy modes, and VPN/proxy integration.",
      icon: Globe,
      path: "/web",
      color: "neon-green",
      gradient: "from-neon-green to-green-400",
    },
    {
      id: "index",
      title: "Pinecone Index",
      description:
        "Knowledge indexing and vector search powered by Pinecone for intelligent data retrieval and analysis.",
      icon: Database,
      path: "/index",
      color: "neon-purple",
      gradient: "from-neon-purple to-purple-400",
    },
    {
      id: "calculator",
      title: "Calculator",
      description:
        "Scientific calculator with full computation history, advanced math functions, and per-user session tracking.",
      icon: Calculator,
      path: "/calculator",
      color: "neon-amber",
      gradient: "from-neon-amber to-yellow-400",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "CK-Storage Engine",
      description:
        "Encrypted, file-based storage system for complete data ownership and privacy",
    },
    {
      icon: Crown,
      title: "Owner Dashboard",
      description:
        "Full admin control with golden crown access, API management, and user analytics",
    },
    {
      icon: Cpu,
      title: "Real-time Processing",
      description:
        "High-performance backend with instant responses and seamless mode switching",
    },
    {
      icon: Sparkles,
      title: "Cyberpunk UI",
      description:
        "Stunning glassmorphic interface with neon effects and smooth animations",
    },
  ];

  return (
    <Layout isAuthenticated={true} isOwner={true} username="Owner">
      <div className="relative min-h-screen overflow-hidden">
        {/* Hero Section */}
        <section className="relative px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="font-orbitron font-black text-5xl md:text-7xl lg:text-8xl text-glow-cyber mb-6">
                Chat<span className="text-neon-amber">King</span>
              </h1>
              <p className="text-xl md:text-2xl text-text-muted max-w-4xl mx-auto leading-relaxed">
                The Next-Gen All-in-One AI Platform
              </p>
              <p className="text-lg text-cyber-blue mt-4 max-w-3xl mx-auto">
                Unlimited power, expansion, and control. Built from scratch for
                the future.
              </p>
            </div>

            {/* Mode Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
              {modes.map((mode) => (
                <Link key={mode.id} to={mode.path} className="mode-card group">
                  <div className="text-center">
                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${mode.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      <mode.icon className="w-8 h-8 text-main-bg" />
                    </div>
                    <h3 className="font-orbitron font-bold text-xl mb-2 text-text-primary group-hover:text-glow-cyber transition-all">
                      {mode.title}
                    </h3>
                    <p className="text-text-muted text-sm leading-relaxed">
                      {mode.description}
                    </p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyber-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                </Link>
              ))}
            </div>

            {/* Quick Start Button */}
            <div className="mb-20">
              <Link
                to="/ai"
                className="inline-flex items-center space-x-2 btn-cyber text-lg px-8 py-4 font-semibold"
              >
                <Zap className="w-5 h-5" />
                <span>Start with ChatKing AI</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 border-t border-border-glow">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-orbitron font-bold text-4xl md:text-5xl text-glow-cyber mb-6">
                Platform Features
              </h2>
              <p className="text-text-muted text-lg max-w-3xl mx-auto">
                Built for unlimited expansion with complete ownership and
                control
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="glass-card text-center hover-glow">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyber-blue to-neon-purple flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-main-bg" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-text-primary">
                    {feature.title}
                  </h3>
                  <p className="text-text-muted text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* API Status Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 border-t border-border-glow">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card">
              <h3 className="font-orbitron font-bold text-2xl text-center mb-8 text-glow-cyber">
                System Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-3 h-3 bg-neon-green rounded-full mx-auto mb-2 animate-pulse"></div>
                  <p className="text-sm font-medium text-text-primary">
                    OpenRouter AI
                  </p>
                  <p className="text-xs text-neon-green">Connected</p>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 bg-neon-green rounded-full mx-auto mb-2 animate-pulse"></div>
                  <p className="text-sm font-medium text-text-primary">
                    BraveSearch
                  </p>
                  <p className="text-xs text-neon-green">Active</p>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 bg-neon-green rounded-full mx-auto mb-2 animate-pulse"></div>
                  <p className="text-sm font-medium text-text-primary">
                    Pinecone Index
                  </p>
                  <p className="text-xs text-neon-green">Online</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-blue/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-green/3 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
      </div>
    </Layout>
  );
}
