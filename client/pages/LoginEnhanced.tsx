import { useState, useEffect } from "react";
import { Eye, EyeOff, User, Mail, Lock, Shield, Chrome, Apple, CheckCircle, AlertCircle } from "lucide-react";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

export default function LoginEnhanced() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [registerData, setRegisterData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    agreeToTerms: false,
    agreeToPrivacy: false,
  });

  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (registerData.password) {
      setPasswordStrength(calculatePasswordStrength(registerData.password));
    }
  }, [registerData.password]);

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]/)) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 25;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 25;
    return Math.min(strength, 100);
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 25) return "bg-red-500";
    if (strength < 50) return "bg-orange-500";
    if (strength < 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = (strength: number): string => {
    if (strength < 25) return "Weak";
    if (strength < 50) return "Fair";
    if (strength < 75) return "Good";
    return "Strong";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (data.success) {
        // Store session token
        localStorage.setItem("chatking_session", data.sessionId);
        localStorage.setItem("chatking_user", JSON.stringify(data.user));
        
        // Redirect to main app
        window.location.href = "/";
      } else {
        setError(data.error || "Login failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation
    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (passwordStrength < 50) {
      setError("Password is too weak. Please choose a stronger password.");
      setIsLoading(false);
      return;
    }

    if (!registerData.agreeToTerms || !registerData.agreeToPrivacy) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      setIsLoading(false);
      return;
    }

    // Age verification
    const birthDate = new Date(registerData.birthDate);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    if (age < 13) {
      setError("You must be at least 13 years old to create an account");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: `${registerData.firstName} ${registerData.lastName}`,
          email: registerData.email,
          password: registerData.password,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          birthDate: registerData.birthDate,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Account created successfully! Please check your email for verification.");
        setTimeout(() => setIsLogin(true), 3000);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      window.location.href = "/api/auth/google";
    } catch (error) {
      setError("Failed to initiate Google login");
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    try {
      window.location.href = "/api/auth/apple";
    } catch (error) {
      setError("Failed to initiate Apple login");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-main-bg via-secondary-bg to-main-bg p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-purple to-purple-400 flex items-center justify-center">
            <Shield className="w-8 h-8 text-main-bg" />
          </div>
          <h1 className="font-orbitron font-bold text-3xl text-glow-cyber mb-2">
            ChatKing AI
          </h1>
          <p className="text-text-muted">
            {isLogin ? "Welcome back to the future of AI" : "Join the AI revolution"}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-lg bg-secondary-bg/50 p-1 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              isLogin
                ? "bg-neon-purple text-main-bg"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              !isLogin
                ? "bg-neon-purple text-main-bg"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="glass-card">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/50 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-green-400 text-sm">{success}</span>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-border-glow rounded-lg hover:bg-secondary-bg/50 transition-colors disabled:opacity-50"
            >
              <Chrome className="w-5 h-5 mr-3 text-blue-400" />
              <span className="text-text-primary">Continue with Google Workspace</span>
            </button>

            <button
              onClick={handleAppleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-border-glow rounded-lg hover:bg-secondary-bg/50 transition-colors disabled:opacity-50"
            >
              <Apple className="w-5 h-5 mr-3 text-gray-300" />
              <span className="text-text-primary">Continue with Apple</span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-glow"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-main-bg text-text-muted">Or continue with email</span>
            </div>
          </div>

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="email"
                    required
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 cyber-input"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-10 cyber-input"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={loginData.rememberMe}
                    onChange={(e) => setLoginData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                    className="w-4 h-4 text-neon-purple bg-secondary-bg border-border-glow rounded focus:ring-neon-purple focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-text-muted">Remember me</span>
                </label>
                <a href="/forgot-password" className="text-sm text-neon-purple hover:text-purple-300">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-cyber"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.firstName}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full cyber-input"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.lastName}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full cyber-input"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="email"
                    required
                    value={registerData.email}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 cyber-input"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  required
                  value={registerData.birthDate}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="w-full cyber-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-10 cyber-input"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {registerData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-text-muted">Password strength:</span>
                      <span className={`font-medium ${
                        passwordStrength < 50 ? 'text-red-400' : 
                        passwordStrength < 75 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {getPasswordStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <div className="w-full bg-secondary-bg rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all ${getPasswordStrengthColor(passwordStrength)}`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full pl-10 pr-10 cyber-input"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={registerData.agreeToTerms}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 text-neon-purple bg-secondary-bg border-border-glow rounded focus:ring-neon-purple focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-text-muted">
                    I agree to the{" "}
                    <a href="/terms" className="text-neon-purple hover:text-purple-300" target="_blank">
                      Terms of Service
                    </a>
                  </span>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={registerData.agreeToPrivacy}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, agreeToPrivacy: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 text-neon-purple bg-secondary-bg border-border-glow rounded focus:ring-neon-purple focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-text-muted">
                    I agree to the{" "}
                    <a href="/privacy" className="text-neon-purple hover:text-purple-300" target="_blank">
                      Privacy Policy
                    </a>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-cyber"
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-text-muted text-sm">
            © 2024 ChatKing AI. Powered by advanced AI technology.
          </p>
        </div>
      </div>
    </div>
  );
}
