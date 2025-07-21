import { useState, useEffect } from "react";
import {
  Crown,
  Users,
  Database,
  Activity,
  Settings,
  Key,
  BarChart3,
  Shield,
  Zap,
  Globe,
  Brain,
  Calculator,
  Server,
  HardDrive,
  Cpu,
  Wifi,
  AlertTriangle,
} from "lucide-react";
import { Layout } from "../components/Layout";

interface SystemStats {
  totalUsers: number;
  totalChats: number;
  totalSearches: number;
  totalCalculations: number;
  totalIndexes: number;
  storageSize: number;
}

interface ApiKeyStatus {
  name: string;
  key: string;
  status: "active" | "inactive" | "error";
  lastUsed?: string;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "analytics" | "settings" | "api-keys"
  >("overview");
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId] = useState("demo-user"); // In real app, get from auth

  useEffect(() => {
    loadSystemStats();
    loadApiKeyStatus();
  }, []);

  const loadSystemStats = async () => {
    try {
      const response = await fetch(`/api/auth/system-stats?userId=${userId}`);
      const data = await response.json();

      if (data.success && data.stats) {
        setSystemStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to load system stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadApiKeyStatus = () => {
    // Mock API key status for demo
    setApiKeys([
      {
        name: "OpenRouter AI",
        key: "sk-or-v1-5770c4b5...090274",
        status: "active",
        lastUsed: new Date().toISOString(),
      },
      {
        name: "BraveSearch",
        key: "BSAjvpAPq4Pz...acwkI6",
        status: "active",
        lastUsed: new Date().toISOString(),
      },
      {
        name: "Pinecone",
        key: "pcsk_6DAaeQ_N...xKP7EbrtnA",
        status: "active",
        lastUsed: new Date().toISOString(),
      },
    ]);
  };

  const updateApiKey = async (service: string, newKey: string) => {
    // In real implementation, this would update the API key
    console.log(`Updating ${service} API key:`, newKey);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-neon-green";
      case "inactive":
        return "text-neon-amber";
      case "error":
        return "text-neon-red";
      default:
        return "text-text-muted";
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Layout isAuthenticated={true} isOwner={true} username="Owner">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-amber to-yellow-400 flex items-center justify-center">
              <Crown className="w-8 h-8 text-main-bg" />
            </div>
            <h1 className="font-orbitron font-bold text-4xl text-glow-cyber mb-2">
              Admin Dashboard
            </h1>
            <p className="text-text-muted text-lg">
              System monitoring and management console
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-center space-x-1 mb-8">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "users", label: "Users", icon: Users },
              { id: "analytics", label: "Analytics", icon: Activity },
              { id: "api-keys", label: "API Keys", icon: Key },
              { id: "settings", label: "Settings", icon: Settings },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded transition-all ${
                  activeTab === id
                    ? "bg-neon-amber/20 text-neon-amber border border-neon-amber/50"
                    : "text-text-muted hover:text-text-primary hover:bg-neon-amber/10"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* System Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-muted text-sm">Total Users</p>
                      <p className="text-2xl font-bold text-neon-green">
                        {systemStats?.totalUsers || 0}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-neon-green" />
                  </div>
                </div>

                <div className="glass-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-muted text-sm">
                        AI Conversations
                      </p>
                      <p className="text-2xl font-bold text-cyber-blue">
                        {systemStats?.totalChats || 0}
                      </p>
                    </div>
                    <Brain className="w-8 h-8 text-cyber-blue" />
                  </div>
                </div>

                <div className="glass-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-muted text-sm">Web Searches</p>
                      <p className="text-2xl font-bold text-neon-purple">
                        {systemStats?.totalSearches || 0}
                      </p>
                    </div>
                    <Globe className="w-8 h-8 text-neon-purple" />
                  </div>
                </div>

                <div className="glass-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-muted text-sm">Calculations</p>
                      <p className="text-2xl font-bold text-neon-amber">
                        {systemStats?.totalCalculations || 0}
                      </p>
                    </div>
                    <Calculator className="w-8 h-8 text-neon-amber" />
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card">
                  <h3 className="font-semibold text-xl mb-4 text-text-primary flex items-center">
                    <Server className="w-6 h-6 mr-2 text-neon-green" />
                    System Health
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-secondary-bg rounded">
                      <div className="flex items-center space-x-2">
                        <Cpu className="w-5 h-5 text-cyber-blue" />
                        <span className="text-text-primary">CPU Usage</span>
                      </div>
                      <span className="text-neon-green">23%</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-secondary-bg rounded">
                      <div className="flex items-center space-x-2">
                        <HardDrive className="w-5 h-5 text-neon-purple" />
                        <span className="text-text-primary">Storage</span>
                      </div>
                      <span className="text-neon-green">
                        {formatBytes(systemStats?.storageSize || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-secondary-bg rounded">
                      <div className="flex items-center space-x-2">
                        <Wifi className="w-5 h-5 text-neon-amber" />
                        <span className="text-text-primary">Network</span>
                      </div>
                      <span className="text-neon-green">Online</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-secondary-bg rounded">
                      <div className="flex items-center space-x-2">
                        <Database className="w-5 h-5 text-cyber-blue" />
                        <span className="text-text-primary">CK-Storage</span>
                      </div>
                      <span className="text-neon-green">Operational</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card">
                  <h3 className="font-semibold text-xl mb-4 text-text-primary flex items-center">
                    <Shield className="w-6 h-6 mr-2 text-neon-green" />
                    API Status
                  </h3>

                  <div className="space-y-4">
                    {apiKeys.map((api) => (
                      <div
                        key={api.name}
                        className="flex items-center justify-between p-3 bg-secondary-bg rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <Zap className="w-5 h-5 text-cyber-blue" />
                          <span className="text-text-primary">{api.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full bg-current ${getStatusColor(api.status)}`}
                          ></div>
                          <span
                            className={`text-sm ${getStatusColor(api.status)}`}
                          >
                            {api.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === "api-keys" && (
            <div className="space-y-6">
              <div className="glass-card">
                <h3 className="font-semibold text-xl mb-6 text-text-primary flex items-center">
                  <Key className="w-6 h-6 mr-2 text-neon-amber" />
                  API Key Management
                </h3>

                <div className="space-y-6">
                  {apiKeys.map((api) => (
                    <div
                      key={api.name}
                      className="border border-border-glow rounded-lg p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-text-primary text-lg">
                            {api.name}
                          </h4>
                          <p className="text-text-muted text-sm">
                            Last used:{" "}
                            {api.lastUsed
                              ? new Date(api.lastUsed).toLocaleDateString()
                              : "Never"}
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded text-sm ${getStatusColor(api.status)} bg-current bg-opacity-10`}
                        >
                          {api.status}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-text-primary">
                          API Key
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="password"
                            value={api.key}
                            className="flex-1 cyber-input font-mono text-sm"
                            readOnly
                          />
                          <button className="btn-cyber px-4">Update</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-neon-amber/10 border border-neon-amber/30 rounded">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-neon-amber mt-0.5" />
                    <div className="text-sm text-neon-amber">
                      <p className="font-medium mb-1">Security Notice</p>
                      <p>
                        API keys are encrypted and stored securely in the
                        CK-Storage system. Only you have access to these keys.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="glass-card">
                <h3 className="font-semibold text-xl mb-6 text-text-primary flex items-center">
                  <Activity className="w-6 h-6 mr-2 text-cyber-blue" />
                  Platform Analytics
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-secondary-bg rounded-lg">
                    <Brain className="w-12 h-12 mx-auto mb-3 text-cyber-blue" />
                    <div className="text-2xl font-bold text-cyber-blue mb-1">
                      {systemStats?.totalChats || 0}
                    </div>
                    <div className="text-sm text-text-muted">
                      AI Conversations
                    </div>
                  </div>

                  <div className="text-center p-6 bg-secondary-bg rounded-lg">
                    <Globe className="w-12 h-12 mx-auto mb-3 text-neon-green" />
                    <div className="text-2xl font-bold text-neon-green mb-1">
                      {systemStats?.totalSearches || 0}
                    </div>
                    <div className="text-sm text-text-muted">Web Searches</div>
                  </div>

                  <div className="text-center p-6 bg-secondary-bg rounded-lg">
                    <Database className="w-12 h-12 mx-auto mb-3 text-neon-purple" />
                    <div className="text-2xl font-bold text-neon-purple mb-1">
                      {systemStats?.totalIndexes || 0}
                    </div>
                    <div className="text-sm text-text-muted">
                      Vector Indexes
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="glass-card">
                <h3 className="font-semibold text-xl mb-6 text-text-primary flex items-center">
                  <Settings className="w-6 h-6 mr-2 text-neon-green" />
                  System Settings
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-text-primary mb-3">
                      Security Settings
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="rounded"
                          defaultChecked
                        />
                        <span className="text-text-primary">
                          Enable encryption for all data
                        </span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="rounded"
                          defaultChecked
                        />
                        <span className="text-text-primary">
                          Require authentication for API access
                        </span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="rounded"
                          defaultChecked
                        />
                        <span className="text-text-primary">
                          Enable audit logging
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-text-primary mb-3">
                      Storage Settings
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-text-muted mb-1">
                          Storage Location
                        </label>
                        <input
                          type="text"
                          value="./ck-data"
                          className="cyber-input w-full"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-text-muted mb-1">
                          Max Storage Size (GB)
                        </label>
                        <input
                          type="number"
                          defaultValue={100}
                          className="cyber-input w-32"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-text-primary mb-3">
                      System Limits
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-text-muted mb-1">
                          Max Users
                        </label>
                        <input
                          type="number"
                          defaultValue={1000}
                          className="cyber-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-text-muted mb-1">
                          Max API Requests/Hour
                        </label>
                        <input
                          type="number"
                          defaultValue={10000}
                          className="cyber-input w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="glass-card">
                <h3 className="font-semibold text-xl mb-6 text-text-primary flex items-center">
                  <Users className="w-6 h-6 mr-2 text-neon-green" />
                  User Management
                </h3>

                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-text-muted mx-auto mb-4" />
                  <h4 className="text-xl font-medium text-text-primary mb-2">
                    User Management
                  </h4>
                  <p className="text-text-muted mb-6">
                    Manage user accounts, permissions, and access levels.
                  </p>
                  <p className="text-cyber-blue">
                    Continue prompting to have this section built out with full
                    user management!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
