import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Zap,
  Crown,
  Shield,
  User,
  Mail,
  Lock,
} from "lucide-react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user info
        localStorage.setItem("chatking_token", data.token);
        localStorage.setItem("chatking_user", JSON.stringify(data.user));

        // Redirect to home
        navigate("/");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
          <p className="text-text-muted">Create your AI platform account</p>
        </div>

        {/* Register Form */}
        <div className="glass-card">
          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <div className="p-3 bg-neon-red/10 border border-neon-red/30 rounded text-neon-red text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full cyber-input"
                placeholder="Choose a username"
                required
                minLength={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
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
                <Lock className="w-4 h-4 inline mr-2" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full cyber-input pr-12"
                  placeholder="Create a password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full cyber-input pr-12"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
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
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Owner Notice */}
          <div className="mt-6 p-3 bg-neon-amber/10 border border-neon-amber/30 rounded">
            <div className="flex items-center space-x-2 text-sm text-neon-amber">
              <Crown className="w-4 h-4" />
              <span>
                First user becomes the platform owner with full admin access
              </span>
            </div>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-text-muted text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-cyber-blue hover:text-cyber-blue-light transition-colors font-medium"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 glass-card">
          <div className="space-y-2 text-sm text-text-muted">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-neon-green" />
              <span>End-to-end encrypted data storage</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-neon-green" />
              <span>Private CK-Storage engine</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-neon-green" />
              <span>No data sharing with third parties</span>
            </div>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="mt-4 glass-card">
          <h4 className="text-sm font-medium text-text-primary mb-2">
            Password Requirements:
          </h4>
          <ul className="text-xs text-text-muted space-y-1">
            <li
              className={`flex items-center space-x-2 ${password.length >= 6 ? "text-neon-green" : ""}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${password.length >= 6 ? "bg-neon-green" : "bg-border-glow"}`}
              ></div>
              <span>At least 6 characters</span>
            </li>
            <li
              className={`flex items-center space-x-2 ${password === confirmPassword && password ? "text-neon-green" : ""}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${password === confirmPassword && password ? "bg-neon-green" : "bg-border-glow"}`}
              ></div>
              <span>Passwords match</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
