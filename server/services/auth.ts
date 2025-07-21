import crypto from 'crypto';
import { ckStorage } from '../storage/ck-storage';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    isOwner: boolean;
  };
  token?: string;
  error?: string;
}

export class AuthService {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'chatking-jwt-secret-change-in-production';
  }

  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, hashedPassword: string): boolean {
    try {
      const [salt, hash] = hashedPassword.split(':');
      const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      return hash === computedHash;
    } catch (error) {
      return false;
    }
  }

  private generateToken(userId: string, email: string): string {
    // Simple JWT-like token for development
    const payload = {
      userId,
      email,
      iat: Date.now(),
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = crypto.createHmac('sha256', this.jwtSecret)
      .update(`${header}.${body}`)
      .digest('base64');
    
    return `${header}.${body}.${signature}`;
  }

  private verifyToken(token: string): { userId: string; email: string } | null {
    try {
      const [header, body, signature] = token.split('.');
      
      // Verify signature
      const expectedSignature = crypto.createHmac('sha256', this.jwtSecret)
        .update(`${header}.${body}`)
        .digest('base64');
      
      if (signature !== expectedSignature) {
        return null;
      }
      
      const payload = JSON.parse(Buffer.from(body, 'base64').toString());
      
      // Check expiration
      if (payload.exp < Date.now()) {
        return null;
      }
      
      return {
        userId: payload.userId,
        email: payload.email
      };
    } catch (error) {
      return null;
    }
  }

  async register(data: RegisterData): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await ckStorage.getUserByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          error: 'User already exists with this email'
        };
      }

      // Validate input
      if (!data.username || data.username.length < 2) {
        return {
          success: false,
          error: 'Username must be at least 2 characters'
        };
      }

      if (!data.email || !data.email.includes('@')) {
        return {
          success: false,
          error: 'Valid email is required'
        };
      }

      if (!data.password || data.password.length < 6) {
        return {
          success: false,
          error: 'Password must be at least 6 characters'
        };
      }

      // Hash password
      const hashedPassword = this.hashPassword(data.password);

      // Create user (first user is owner)
      const userCount = await this.getUserCount();
      const isOwner = userCount === 0;

      const user = await ckStorage.createUser({
        username: data.username,
        email: data.email,
        passwordHash: hashedPassword,
        isOwner,
        settings: {
          theme: 'cyberpunk',
          notifications: true,
          privacy: 'standard'
        }
      });

      // Generate token
      const token = this.generateToken(user.id, user.email);

      // Log analytics
      await ckStorage.logAnalytics('user_registered', {
        userId: user.id,
        username: user.username,
        isOwner,
        timestamp: new Date()
      });

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isOwner: user.isOwner
        },
        token
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Find user by email
      const user = await ckStorage.getUserByEmail(credentials.email);
      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Verify password
      const isValidPassword = this.verifyPassword(credentials.password, user.passwordHash);
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Update last login
      await ckStorage.updateUser(user.id, {
        lastLogin: new Date()
      });

      // Generate token
      const token = this.generateToken(user.id, user.email);

      // Log analytics
      await ckStorage.logAnalytics('user_login', {
        userId: user.id,
        username: user.username,
        timestamp: new Date()
      });

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isOwner: user.isOwner
        },
        token
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  async validateSession(token: string): Promise<AuthResult> {
    try {
      const tokenData = this.verifyToken(token);
      if (!tokenData) {
        return {
          success: false,
          error: 'Invalid or expired token'
        };
      }

      // Get current user data
      const user = await ckStorage.getUser(tokenData.userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isOwner: user.isOwner
        },
        token // Return the same token
      };

    } catch (error) {
      console.error('Session validation error:', error);
      return {
        success: false,
        error: 'Session validation failed'
      };
    }
  }

  async getUserCount(): Promise<number> {
    try {
      const stats = await ckStorage.getStorageStats();
      return stats?.totalUsers || 0;
    } catch (error) {
      return 0;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await ckStorage.getUser(userId);
      if (!user) {
        return false;
      }

      // Verify current password
      const isValidPassword = this.verifyPassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return false;
      }

      // Hash new password
      const hashedPassword = this.hashPassword(newPassword);

      // Update password
      await ckStorage.updateUser(userId, {
        passwordHash: hashedPassword
      });

      // Log analytics
      await ckStorage.logAnalytics('password_changed', {
        userId,
        timestamp: new Date()
      });

      return true;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  }

  // Create default owner account if none exists
  async createDefaultOwner(): Promise<void> {
    try {
      const userCount = await this.getUserCount();
      if (userCount === 0) {
        await this.register({
          username: 'Owner',
          email: 'owner@chatkingai.com',
          password: 'chatking123'
        });
        console.log('Created default owner account: owner@chatkingai.com / chatking123');
      }
    } catch (error) {
      console.error('Failed to create default owner:', error);
    }
  }
}

export const authService = new AuthService();
