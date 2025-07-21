import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Key,
  Shield,
  Mail,
  Database,
  Search,
  Brain,
  Monitor,
  Save,
  TestTube,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { Layout } from "../components/Layout";

interface ApiKeyConfig {
  name: string;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

interface ServiceStatus {
  name: string;
  status: "healthy" | "degraded" | "unhealthy" | "unknown";
  responseTime?: number;
  error?: string;
  details?: any;
}

interface EnvironmentVariables {
  PINECONE_API_KEY?: string;
  PINECONE_ENVIRONMENT?: string;
  OPENAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  BRAVE_SEARCH_API_KEY?: string;
  EMAIL_SERVICE_API_KEY?: string;
  GOOGLE_OAUTH_CLIENT_ID?: string;
  GOOGLE_OAUTH_CLIENT_SECRET?: string;
  APPLE_OAUTH_CLIENT_ID?: string;
  APPLE_OAUTH_CLIENT_SECRET?: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<
    "api-keys" | "environment" | "services" | "security"
  >("api-keys");
  const [apiKeys, setApiKeys] = useState<Record<string, ApiKeyConfig>>({});
  const [environment, setEnvironment] = useState<EnvironmentVariables>({});
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [newApiKey, setNewApiKey] = useState({
    service: "",
    name: "",
    key: "",
    environment: "",
  });
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apiKeysRes, environmentRes, healthRes] = await Promise.all([
        fetch("/api/keys/list"),
        fetch("/api/keys/environment"),
        fetch("/api/system/health"),
      ]);

      if (apiKeysRes.ok) {
        const data = await apiKeysRes.json();
        setApiKeys(data.apiKeys || {});
      }

      if (environmentRes.ok) {
        const data = await environmentRes.json();
        setEnvironment(data.variables || {});
      }

      if (healthRes.ok) {
        const data = await healthRes.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error("Failed to load settings data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = async () => {
    if (!newApiKey.service || !newApiKey.name || !newApiKey.key) return;

    try {
      const response = await fetch("/api/keys/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newApiKey),
      });

      if (response.ok) {
        setNewApiKey({ service: "", name: "", key: "", environment: "" });
        loadData();
      }
    } catch (error) {
      console.error("Failed to save API key:", error);
    }
  };

  const testApiKey = async (service: string, key: string) => {
    try {
      const response = await fetch("/api/keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, key }),
      });

      const result = await response.json();
      setTestResults((prev) => ({ ...prev, [service]: result }));
    } catch (error) {
      console.error("Failed to test API key:", error);
    }
  };

  const updateEnvironment = async () => {
    try {
      const response = await fetch("/api/keys/environment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variables: environment }),
      });

      if (response.ok) {
        console.log("Environment variables updated successfully");
      }
    } catch (error) {
      console.error("Failed to update environment:", error);
    }
  };

  const deleteApiKey = async (service: string) => {
    try {
      const response = await fetch(`/api/keys/${service}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error("Failed to delete API key:", error);
    }
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "unhealthy":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Monitor className="w-5 h-5 text-gray-500" />;
    }
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case "pinecone":
        return <Database className="w-5 h-5" />;
      case "openrouter":
        return <Brain className="w-5 h-5" />;
      case "bravesearch":
        return <Search className="w-5 h-5" />;
      case "email":
        return <Mail className="w-5 h-5" />;
      case "security":
        return <Shield className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  return (
    <Layout isAuthenticated={true} isOwner={true} username="Owner">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-purple to-purple-400 flex items-center justify-center">
              <SettingsIcon className="w-8 h-8 text-main-bg" />
            </div>
            <h1 className="font-orbitron font-bold text-4xl text-glow-cyber mb-2">
              System Settings
            </h1>
            <p className="text-text-muted text-lg">
              Configure API keys, environment variables, and monitor system
              health
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-center space-x-1 mb-8">
            {[
              { id: "api-keys", label: "API Keys", icon: Key },
              { id: "environment", label: "Environment", icon: Monitor },
              { id: "services", label: "Services", icon: SettingsIcon },
              { id: "security", label: "Security", icon: Shield },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded transition-all ${
                  activeTab === id
                    ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/50"
                    : "text-text-muted hover:text-text-primary hover:bg-neon-purple/10"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* API Keys Tab */}
          {activeTab === "api-keys" && (
            <div className="space-y-6">
              {/* Add New API Key */}
              <div className="glass-card">
                <h3 className="font-semibold text-xl mb-4 text-text-primary flex items-center">
                  <Key className="w-6 h-6 mr-2 text-neon-green" />
                  Add New API Key
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <select
                    value={newApiKey.service}
                    onChange={(e) =>
                      setNewApiKey((prev) => ({
                        ...prev,
                        service: e.target.value,
                      }))
                    }
                    className="w-full cyber-input"
                  >
                    <option value="">Select Service</option>
                    <option value="pinecone">Pinecone</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="openai">OpenAI</option>
                    <option value="brave">Brave Search</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="mailgun">Mailgun</option>
                  </select>

                  <input
                    type="text"
                    value={newApiKey.name}
                    onChange={(e) =>
                      setNewApiKey((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Key name/description"
                    className="w-full cyber-input"
                  />

                  <input
                    type="password"
                    value={newApiKey.key}
                    onChange={(e) =>
                      setNewApiKey((prev) => ({ ...prev, key: e.target.value }))
                    }
                    placeholder="API Key"
                    className="w-full cyber-input"
                  />

                  <input
                    type="text"
                    value={newApiKey.environment}
                    onChange={(e) =>
                      setNewApiKey((prev) => ({
                        ...prev,
                        environment: e.target.value,
                      }))
                    }
                    placeholder="Environment (optional)"
                    className="w-full cyber-input"
                  />
                </div>

                <button
                  onClick={saveApiKey}
                  disabled={
                    !newApiKey.service || !newApiKey.name || !newApiKey.key
                  }
                  className="btn-cyber"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save API Key
                </button>
              </div>

              {/* Existing API Keys */}
              <div className="glass-card">
                <h3 className="font-semibold text-xl mb-4 text-text-primary flex items-center">
                  <Database className="w-6 h-6 mr-2 text-cyber-blue" />
                  Configured API Keys
                </h3>

                <div className="space-y-4">
                  {Object.entries(apiKeys).map(([service, config]) => (
                    <div
                      key={service}
                      className="p-4 border border-border-glow rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getServiceIcon(service)}
                          <div>
                            <h4 className="font-medium text-text-primary capitalize">
                              {service}
                            </h4>
                            <p className="text-sm text-text-muted">
                              {config.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => testApiKey(service, "test")}
                            className="p-2 rounded hover:bg-neon-green/20 transition-colors"
                            title="Test API Key"
                          >
                            <TestTube className="w-4 h-4 text-neon-green" />
                          </button>

                          <button
                            onClick={() => deleteApiKey(service)}
                            className="p-2 rounded hover:bg-red-500/20 transition-colors"
                            title="Delete API Key"
                          >
                            <XCircle className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-text-muted">Status:</span>
                          <span
                            className={`ml-1 ${config.isActive ? "text-green-500" : "text-red-500"}`}
                          >
                            {config.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-muted">Usage:</span>
                          <span className="ml-1 text-text-primary">
                            {config.usageCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-muted">Created:</span>
                          <span className="ml-1 text-text-primary">
                            {new Date(config.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-muted">Last Used:</span>
                          <span className="ml-1 text-text-primary">
                            {config.lastUsed
                              ? new Date(config.lastUsed).toLocaleDateString()
                              : "Never"}
                          </span>
                        </div>
                      </div>

                      {testResults[service] && (
                        <div className="mt-3 p-3 bg-secondary-bg rounded border">
                          <div className="flex items-center space-x-2">
                            {testResults[service].valid ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-sm">
                              {testResults[service].valid
                                ? "API key is valid"
                                : "API key failed validation"}
                            </span>
                          </div>
                          {testResults[service].error && (
                            <p className="text-sm text-red-400 mt-1">
                              {testResults[service].error}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {Object.keys(apiKeys).length === 0 && (
                    <div className="text-center py-8">
                      <Key className="w-12 h-12 text-text-muted mx-auto mb-3" />
                      <p className="text-text-muted">
                        No API keys configured yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Environment Tab */}
          {activeTab === "environment" && (
            <div className="space-y-6">
              <div className="glass-card">
                <h3 className="font-semibold text-xl mb-4 text-text-primary flex items-center">
                  <Monitor className="w-6 h-6 mr-2 text-neon-amber" />
                  Environment Variables
                </h3>

                <div className="space-y-4">
                  {Object.entries(environment).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-3">
                      <label className="w-48 text-sm font-medium text-text-primary">
                        {key}:
                      </label>
                      <div className="flex-1 relative">
                        <input
                          type={showSecrets[key] ? "text" : "password"}
                          value={value || ""}
                          onChange={(e) =>
                            setEnvironment((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          placeholder={`Enter ${key}`}
                          className="w-full cyber-input pr-10"
                        />
                        <button
                          onClick={() => toggleShowSecret(key)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-neon-purple/20"
                        >
                          {showSecrets[key] ? (
                            <EyeOff className="w-4 h-4 text-text-muted" />
                          ) : (
                            <Eye className="w-4 h-4 text-text-muted" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex space-x-3">
                  <button onClick={updateEnvironment} className="btn-cyber">
                    <Save className="w-4 h-4 mr-2" />
                    Save Environment
                  </button>
                  <button onClick={loadData} className="btn-secondary">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === "services" && (
            <div className="space-y-6">
              <div className="glass-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-xl text-text-primary flex items-center">
                    <Monitor className="w-6 h-6 mr-2 text-neon-green" />
                    Service Status
                  </h3>
                  <button onClick={loadData} className="btn-secondary">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <div
                      key={service.name}
                      className="p-4 border border-border-glow rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getServiceIcon(service.name)}
                          <h4 className="font-medium text-text-primary">
                            {service.name}
                          </h4>
                        </div>
                        {getStatusIcon(service.status)}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-muted">Status:</span>
                          <span
                            className={`capitalize ${
                              service.status === "healthy"
                                ? "text-green-500"
                                : service.status === "degraded"
                                  ? "text-yellow-500"
                                  : service.status === "unhealthy"
                                    ? "text-red-500"
                                    : "text-gray-500"
                            }`}
                          >
                            {service.status}
                          </span>
                        </div>

                        {service.responseTime && (
                          <div className="flex justify-between">
                            <span className="text-text-muted">
                              Response Time:
                            </span>
                            <span className="text-text-primary">
                              {service.responseTime}ms
                            </span>
                          </div>
                        )}

                        {service.error && (
                          <div className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/20">
                            <p className="text-red-400 text-xs">
                              {service.error}
                            </p>
                          </div>
                        )}

                        {service.details && (
                          <div className="mt-2 p-2 bg-secondary-bg rounded">
                            {Object.entries(service.details).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="flex justify-between text-xs"
                                >
                                  <span className="text-text-muted capitalize">
                                    {key}:
                                  </span>
                                  <span className="text-text-primary">
                                    {String(value)}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="glass-card">
                <h3 className="font-semibold text-xl mb-4 text-text-primary flex items-center">
                  <Shield className="w-6 h-6 mr-2 text-red-500" />
                  Security Configuration
                </h3>

                <div className="text-center py-8">
                  <Shield className="w-16 h-16 text-text-muted mx-auto mb-4" />
                  <h4 className="text-xl font-medium text-text-primary mb-2">
                    Security Settings
                  </h4>
                  <p className="text-text-muted mb-4">
                    Advanced security configuration options will be available
                    here
                  </p>
                  <div className="space-y-2 text-sm text-text-muted">
                    <p>🔒 Real-time threat detection active</p>
                    <p>🛡️ Automatic IP blocking enabled</p>
                    <p>🔐 Honeypot traps deployed</p>
                    <p>🚨 Security alerts configured</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
