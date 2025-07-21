import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Bell,
  Shield,
  Palette,
  Database,
  Download,
  Upload,
  Trash2,
  Save,
} from "lucide-react";
import { Layout } from "../components/Layout";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  isOwner: boolean;
  createdAt: string;
  lastLogin: string;
  settings: {
    theme: string;
    notifications: boolean;
    privacy: string;
    autoSave: boolean;
    dataRetention: number;
  };
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "privacy" | "data"
  >("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [userId] = useState("demo-user"); // In real app, get from auth

  // Form states
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("cyberpunk");
  const [privacy, setPrivacy] = useState("standard");
  const [autoSave, setAutoSave] = useState(true);
  const [dataRetention, setDataRetention] = useState(365);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await fetch(`/api/auth/profile/${userId}`);
      const data = await response.json();

      if (data.success && data.user) {
        setProfile(data.user);
        setUsername(data.user.username);
        setNotifications(data.user.settings?.notifications ?? true);
        setTheme(data.user.settings?.theme ?? "cyberpunk");
        setPrivacy(data.user.settings?.privacy ?? "standard");
        setAutoSave(data.user.settings?.autoSave ?? true);
        setDataRetention(data.user.settings?.dataRetention ?? 365);
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/auth/profile/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          settings: {
            theme,
            notifications,
            privacy,
            autoSave,
            dataRetention,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Profile updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.error || "Failed to update profile");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.error || "Failed to change password");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const exportUserData = async () => {
    try {
      // In real implementation, this would export all user data
      const mockData = {
        profile: profile,
        exportedAt: new Date().toISOString(),
        note: "This is a mock export. Full implementation would include all chat history, search history, calculator logs, and index data.",
      };

      const blob = new Blob([JSON.stringify(mockData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chatking-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setMessage("Data exported successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Failed to export data");
    }
  };

  if (isLoading) {
    return (
      <Layout
        isAuthenticated={true}
        isOwner={profile?.isOwner}
        username={profile?.username}
      >
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-cyber-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      isAuthenticated={true}
      isOwner={profile?.isOwner}
      username={profile?.username}
    >
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyber-blue to-neon-purple flex items-center justify-center">
              <SettingsIcon className="w-8 h-8 text-main-bg" />
            </div>
            <h1 className="font-orbitron font-bold text-4xl text-glow-cyber mb-2">
              Settings
            </h1>
            <p className="text-text-muted">
              Manage your account and preferences
            </p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-3 rounded border ${
                message.includes("success")
                  ? "bg-neon-green/10 border-neon-green/30 text-neon-green"
                  : "bg-neon-red/10 border-neon-red/30 text-neon-red"
              }`}
            >
              {message}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center justify-center space-x-1 mb-8">
            {[
              { id: "profile", label: "Profile", icon: User },
              { id: "security", label: "Security", icon: Lock },
              { id: "privacy", label: "Privacy", icon: Shield },
              { id: "data", label: "Data", icon: Database },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded transition-all ${
                  activeTab === id
                    ? "bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50"
                    : "text-text-muted hover:text-text-primary hover:bg-cyber-blue/10"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="glass-card">
              <h3 className="font-semibold text-xl mb-6 text-text-primary">
                Profile Settings
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full cyber-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile?.email || ""}
                      className="w-full cyber-input"
                      disabled
                    />
                    <p className="text-xs text-text-muted mt-1">
                      Email cannot be changed
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Theme Preference
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="cyber-input w-full md:w-auto"
                  >
                    <option value="cyberpunk">Cyberpunk (Default)</option>
                    <option value="dark">Dark Mode</option>
                    <option value="light">Light Mode</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="notifications" className="text-text-primary">
                    Enable notifications
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="autoSave"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="autoSave" className="text-text-primary">
                    Auto-save conversations and data
                  </label>
                </div>

                <button
                  onClick={saveProfile}
                  disabled={isSaving}
                  className="btn-cyber flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="glass-card">
              <h3 className="font-semibold text-xl mb-6 text-text-primary">
                Security Settings
              </h3>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-text-primary mb-4">
                    Change Password
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full cyber-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full cyber-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full cyber-input"
                      />
                    </div>

                    <button
                      onClick={changePassword}
                      disabled={isSaving || !currentPassword || !newPassword}
                      className="btn-cyber flex items-center space-x-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>
                        {isSaving ? "Changing..." : "Change Password"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-border-glow pt-6">
                  <h4 className="font-medium text-text-primary mb-3">
                    Account Security
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between p-3 bg-secondary-bg rounded">
                      <span className="text-text-primary">
                        Two-Factor Authentication
                      </span>
                      <span className="text-neon-amber">Coming Soon</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary-bg rounded">
                      <span className="text-text-primary">Login Sessions</span>
                      <span className="text-neon-green">1 Active</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary-bg rounded">
                      <span className="text-text-primary">Data Encryption</span>
                      <span className="text-neon-green">Enabled</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <div className="glass-card">
              <h3 className="font-semibold text-xl mb-6 text-text-primary">
                Privacy Settings
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Privacy Level
                  </label>
                  <select
                    value={privacy}
                    onChange={(e) => setPrivacy(e.target.value)}
                    className="cyber-input w-full md:w-auto"
                  >
                    <option value="minimal">
                      Minimal - Basic functionality only
                    </option>
                    <option value="standard">
                      Standard - Balanced privacy and features
                    </option>
                    <option value="enhanced">
                      Enhanced - Maximum privacy protection
                    </option>
                  </select>
                  <p className="text-xs text-text-muted mt-1">
                    Controls data collection and analytics
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Data Retention (days)
                  </label>
                  <input
                    type="number"
                    value={dataRetention}
                    onChange={(e) => setDataRetention(parseInt(e.target.value))}
                    min={30}
                    max={3650}
                    className="cyber-input w-32"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    How long to keep your data (30-3650 days)
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-text-primary">
                    Data Collection
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="rounded"
                        defaultChecked
                      />
                      <span className="text-text-primary">
                        Analytics and usage data
                      </span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="rounded"
                        defaultChecked
                      />
                      <span className="text-text-primary">
                        Error reporting and diagnostics
                      </span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded" />
                      <span className="text-text-primary">
                        Performance monitoring
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={saveProfile}
                  disabled={isSaving}
                  className="btn-cyber flex items-center space-x-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>
                    {isSaving ? "Saving..." : "Save Privacy Settings"}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === "data" && (
            <div className="glass-card">
              <h3 className="font-semibold text-xl mb-6 text-text-primary">
                Data Management
              </h3>

              <div className="space-y-8">
                <div>
                  <h4 className="font-medium text-text-primary mb-4">
                    Export Your Data
                  </h4>
                  <p className="text-text-muted text-sm mb-4">
                    Download all your ChatKing data including conversations,
                    search history, and settings.
                  </p>
                  <button
                    onClick={exportUserData}
                    className="btn-cyber flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Data</span>
                  </button>
                </div>

                <div className="border-t border-border-glow pt-6">
                  <h4 className="font-medium text-text-primary mb-4">
                    Import Data
                  </h4>
                  <p className="text-text-muted text-sm mb-4">
                    Import previously exported ChatKing data or migrate from
                    another platform.
                  </p>
                  <button className="btn-ghost-cyber flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>Import Data</span>
                  </button>
                </div>

                <div className="border-t border-border-glow pt-6">
                  <h4 className="font-medium text-neon-red mb-4">
                    Danger Zone
                  </h4>
                  <p className="text-text-muted text-sm mb-4">
                    These actions cannot be undone. Please be careful.
                  </p>
                  <div className="space-y-3">
                    <button className="flex items-center space-x-2 px-4 py-2 border border-neon-red/50 text-neon-red rounded hover:bg-neon-red/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                      <span>Clear All Chat History</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 border border-neon-red/50 text-neon-red rounded hover:bg-neon-red/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                      <span>Clear All Search History</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 border border-neon-red/50 text-neon-red rounded hover:bg-neon-red/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Info */}
          {profile && (
            <div className="mt-8 glass-card">
              <h3 className="font-semibold text-lg mb-4 text-text-primary">
                Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-muted">Account Type:</span>
                  <span className="ml-2 text-text-primary">
                    {profile.isOwner ? "Owner" : "User"}
                    {profile.isOwner && (
                      <span className="text-neon-amber ml-1">👑</span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Member Since:</span>
                  <span className="ml-2 text-text-primary">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Last Login:</span>
                  <span className="ml-2 text-text-primary">
                    {new Date(profile.lastLogin).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">User ID:</span>
                  <span className="ml-2 text-text-primary font-mono text-xs">
                    {profile.id}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
