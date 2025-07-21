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
  AlertTriangle,
  CheckCircle,
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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation
    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      setIsLoading(false);
      return;
    }

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

        // Redirect to verification page or home
        navigate(data.user.isOwner ? "/welcome" : "/verify-email");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const response = await fetch("/api/auth/google");
      const data = await response.json();

      if (data.success) {
        window.location.href = data.authUrl;
      } else {
        setError("Failed to initialize Google registration");
      }
    } catch (error) {
      setError("Google registration unavailable");
    }
  };

  const handleAppleRegister = async () => {
    try {
      const response = await fetch("/api/auth/apple");
      const data = await response.json();

      if (data.success) {
        window.location.href = data.authUrl;
      } else {
        setError("Failed to initialize Apple registration");
      }
    } catch (error) {
      setError("Apple registration unavailable");
    }
  };

  const passwordRequirements = [
    { met: password.length >= 6, text: "At least 6 characters" },
    {
      met: password === confirmPassword && password !== "",
      text: "Passwords match",
    },
    { met: /[A-Za-z]/.test(password), text: "Contains letters" },
    { met: /[0-9]/.test(password), text: "Contains numbers" },
  ];

  return (
    <div className="min-h-screen bg-main-bg flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-cyber-blue/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-neon-purple/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-neon-green/3 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyber-blue to-neon-purple flex items-center justify-center">
            <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-main-bg" />
          </div>
          <h1 className="font-orbitron font-black text-3xl sm:text-4xl text-glow-cyber mb-2">
            Chat<span className="text-neon-amber">King</span>
          </h1>
          <p className="text-text-muted text-sm sm:text-base">
            Create your AI platform account
          </p>
        </div>

        {/* Register Form */}
        <div className="glass-card">
          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <div className="p-3 bg-neon-red/10 border border-neon-red/30 rounded text-neon-red text-sm flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* OAuth Registration Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleRegister}
                className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-900 rounded-md border border-gray-300 transition-colors font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={handleAppleRegister}
                className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-black hover:bg-gray-900 text-white rounded-md transition-colors font-medium"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                </svg>
                <span>Continue with Apple</span>
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-glow"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-main-bg text-text-muted">
                  Or register with email
                </span>
              </div>
            </div>

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

            {/* Password Requirements */}
            {password && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-text-primary">
                  Password Requirements:
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle
                        className={`w-3 h-3 ${req.met ? "text-neon-green" : "text-text-muted"}`}
                      />
                      <span
                        className={`text-xs ${req.met ? "text-neon-green" : "text-text-muted"}`}
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terms Agreement */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 rounded border-border-glow bg-secondary-bg focus:ring-cyber-blue"
                required
              />
              <label htmlFor="terms" className="text-sm text-text-muted">
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="text-cyber-blue hover:text-cyber-blue-light underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-cyber-blue hover:text-cyber-blue-light underline"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || !agreedToTerms}
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

        {/* Copyright */}
        <div className="mt-6 text-center">
          <p className="text-xs text-text-muted">
            © 2025 ChatKing. Owned and Operated by ChatKing. All rights
            reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
