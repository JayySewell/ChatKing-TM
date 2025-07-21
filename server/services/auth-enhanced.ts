import { authService } from "./auth";
import { ckStorage } from "../storage/ck-storage";
import crypto from "crypto";

interface EnhancedUserProfile {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  profileImage?: string;
  isOwner: boolean;
  isVerified: boolean;
  isActive: boolean;
  googleWorkspaceId?: string;
  createdAt: Date;
  lastLogin: Date;
  preferences: UserPreferences;
  stats: UserStats;
}

interface UserPreferences {
  theme: 'dark' | 'light' | 'auto';
  language: string;
  aiModel: string;
  searchEngine: string;
  contentFilter: boolean;
  ageVerified: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    security: boolean;
  };
}

interface UserStats {
  totalChats: number;
  totalSearches: number;
  totalCalculations: number;
  joinedAt: string;
  lastActive: string;
  strikes: number;
  reputation: number;
}

interface SessionData {
  userId: string;
  email: string;
  username: string;
  isOwner: boolean;
  createdAt: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  lastActivity: Date;
}

export class EnhancedAuthService {
  private jwtSecret: string;
  private sessionTimeout: number;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "chatking-secure-jwt-2024";
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  async createOwnerAccount(): Promise<EnhancedUserProfile> {
    const ownerEmail = "Jayy.Sewell@chatkingai.com";
    
    // Check if owner account already exists
    const existingOwner = await authService.getUserByEmail(ownerEmail);
    if (existingOwner) {
      return await this.enhanceUserProfile(existingOwner);
    }

    // Create new owner account
    const ownerId = await authService.createUser({
      username: "Jayy Sewell",
      email: ownerEmail,
      password: "chatking2024!", // Temporary password, should be changed on first login
      isOwner: true,
      isActive: true,
    });

    if (!ownerId) {
      throw new Error("Failed to create owner account");
    }

    // Create enhanced profile
    const enhancedProfile: EnhancedUserProfile = {
      id: ownerId,
      email: ownerEmail,
      username: "Jayy Sewell",
      firstName: "Jayy",
      lastName: "Sewell", 
      bio: "Founder & CEO of ChatKing AI - Building the future of AI-powered conversations and tools.",
      profileImage: "/images/jayy-sewell-profile.jpg",
      isOwner: true,
      isVerified: true,
      isActive: true,
      googleWorkspaceId: undefined, // Will be set when Google OAuth is connected
      createdAt: new Date(),
      lastLogin: new Date(),
      preferences: {
        theme: 'dark',
        language: 'en',
        aiModel: 'google/gemma-2-9b-it:free',
        searchEngine: 'brave',
        contentFilter: false, // Owner can see all content
        ageVerified: true,
        notifications: {
          email: true,
          push: true,
          security: true,
        },
      },
      stats: {
        totalChats: 0,
        totalSearches: 0,
        totalCalculations: 0,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        strikes: 0,
        reputation: 1000, // Owner starts with high reputation
      },
    };

    await this.saveEnhancedProfile(enhancedProfile);
    return enhancedProfile;
  }

  async enhanceUserProfile(basicUser: any): Promise<EnhancedUserProfile> {
    // Try to load existing enhanced profile
    const existing = await this.getEnhancedProfile(basicUser.id);
    if (existing) {
      return existing;
    }

    // Create enhanced profile from basic user
    const enhancedProfile: EnhancedUserProfile = {
      id: basicUser.id,
      email: basicUser.email,
      username: basicUser.username,
      firstName: "",
      lastName: "",
      bio: "",
      profileImage: "",
      isOwner: basicUser.isOwner,
      isVerified: false,
      isActive: basicUser.isActive,
      googleWorkspaceId: undefined,
      createdAt: basicUser.createdAt,
      lastLogin: basicUser.lastLogin || new Date(),
      preferences: {
        theme: 'dark',
        language: 'en',
        aiModel: 'google/gemma-2-9b-it:free',
        searchEngine: 'brave',
        contentFilter: true,
        ageVerified: false,
        notifications: {
          email: true,
          push: false,
          security: true,
        },
      },
      stats: {
        totalChats: 0,
        totalSearches: 0,
        totalCalculations: 0,
        joinedAt: basicUser.createdAt?.toISOString() || new Date().toISOString(),
        lastActive: new Date().toISOString(),
        strikes: 0,
        reputation: 100, // Default reputation
      },
    };

    await this.saveEnhancedProfile(enhancedProfile);
    return enhancedProfile;
  }

  async saveEnhancedProfile(profile: EnhancedUserProfile): Promise<void> {
    const filePath = `enhanced-profiles/${profile.id}.json`;
    await ckStorage.writeFile(filePath, profile, { encrypt: true });
  }

  async getEnhancedProfile(userId: string): Promise<EnhancedUserProfile | null> {
    try {
      const filePath = `enhanced-profiles/${userId}.json`;
      return await ckStorage.readFile<EnhancedUserProfile>(filePath, { encrypt: true });
    } catch (error) {
      return null;
    }
  }

  async updateProfile(userId: string, updates: Partial<EnhancedUserProfile>): Promise<boolean> {
    const profile = await this.getEnhancedProfile(userId);
    if (!profile) return false;

    const updatedProfile = { ...profile, ...updates };
    await this.saveEnhancedProfile(updatedProfile);
    return true;
  }

  async createSession(userId: string, ipAddress: string, userAgent: string): Promise<string> {
    const sessionId = crypto.randomUUID();
    const sessionData: SessionData = {
      userId,
      email: "",
      username: "",
      isOwner: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.sessionTimeout),
      ipAddress,
      userAgent,
      lastActivity: new Date(),
    };

    // Get user details
    const user = await authService.getUser(userId);
    if (user) {
      sessionData.email = user.email;
      sessionData.username = user.username;
      sessionData.isOwner = user.isOwner;
    }

    const filePath = `sessions/${sessionId}.json`;
    await ckStorage.writeFile(filePath, sessionData, { encrypt: true });

    return sessionId;
  }

  async validateSession(sessionId: string): Promise<{ valid: boolean; user?: EnhancedUserProfile }> {
    try {
      const filePath = `sessions/${sessionId}.json`;
      const session = await ckStorage.readFile<SessionData>(filePath, { encrypt: true });

      if (!session) {
        return { valid: false };
      }

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        await this.destroySession(sessionId);
        return { valid: false };
      }

      // Update last activity
      session.lastActivity = new Date();
      await ckStorage.writeFile(filePath, session, { encrypt: true });

      // Get enhanced user profile
      const user = await this.getEnhancedProfile(session.userId);
      if (!user) {
        return { valid: false };
      }

      return { valid: true, user };
    } catch (error) {
      return { valid: false };
    }
  }

  async destroySession(sessionId: string): Promise<void> {
    try {
      const filePath = `sessions/${sessionId}.json`;
      await ckStorage.deleteFile(filePath);
    } catch (error) {
      // Session already destroyed or doesn't exist
    }
  }

  async linkGoogleWorkspace(userId: string, googleWorkspaceId: string, accessToken: string): Promise<boolean> {
    const profile = await this.getEnhancedProfile(userId);
    if (!profile) return false;

    // Verify the Google Workspace domain
    if (!profile.email.endsWith("@chatkingai.com")) {
      throw new Error("Only @chatkingai.com domain emails can link Google Workspace");
    }

    profile.googleWorkspaceId = googleWorkspaceId;
    profile.isVerified = true;
    await this.saveEnhancedProfile(profile);

    // Store Google access token securely
    const tokenData = {
      userId,
      accessToken: this.encryptToken(accessToken),
      linkedAt: new Date().toISOString(),
    };
    
    const filePath = `google-tokens/${userId}.json`;
    await ckStorage.writeFile(filePath, tokenData, { encrypt: true });

    return true;
  }

  async verifyAge(userId: string, birthDate: Date): Promise<boolean> {
    const profile = await this.getEnhancedProfile(userId);
    if (!profile) return false;

    const age = this.calculateAge(birthDate);
    
    if (age >= 18) {
      profile.preferences.ageVerified = true;
      await this.saveEnhancedProfile(profile);
      return true;
    }

    return false;
  }

  async addStrike(userId: string, reason: string): Promise<number> {
    const profile = await this.getEnhancedProfile(userId);
    if (!profile) return 0;

    profile.stats.strikes++;
    
    // Log the strike
    await ckStorage.logAnalytics("user_strike", {
      userId,
      reason,
      totalStrikes: profile.stats.strikes,
      timestamp: new Date().toISOString(),
    });

    // Suspend account if too many strikes
    if (profile.stats.strikes >= 5) {
      profile.isActive = false;
      await ckStorage.logAnalytics("user_suspended", {
        userId,
        strikes: profile.stats.strikes,
        timestamp: new Date().toISOString(),
      });
    }

    await this.saveEnhancedProfile(profile);
    return profile.stats.strikes;
  }

  async updateStats(userId: string, action: 'chat' | 'search' | 'calculation'): Promise<void> {
    const profile = await this.getEnhancedProfile(userId);
    if (!profile) return;

    switch (action) {
      case 'chat':
        profile.stats.totalChats++;
        break;
      case 'search':
        profile.stats.totalSearches++;
        break;
      case 'calculation':
        profile.stats.totalCalculations++;
        break;
    }

    profile.stats.lastActive = new Date().toISOString();
    await this.saveEnhancedProfile(profile);
  }

  private encryptToken(token: string): string {
    const key = crypto.createHash('sha256').update(this.jwtSecret).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decryptToken(encryptedToken: string): string {
    const key = crypto.createHash('sha256').update(this.jwtSecret).digest();
    const textParts = encryptedToken.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encrypted = textParts.join(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  async updateProfileImage(userId: string, imageUrl: string | null): Promise<boolean> {
    try {
      const profile = await this.getEnhancedProfile(userId);
      if (!profile) {
        return false;
      }

      const updatedProfile: EnhancedUserProfile = {
        ...profile,
        profileImage: imageUrl || undefined,
      };

      await this.saveEnhancedProfile(updatedProfile);
      return true;
    } catch (error) {
      console.error('Failed to update profile image:', error);
      return false;
    }
  }

  async updateProfile(userId: string, updates: {
    firstName?: string;
    lastName?: string;
    username?: string;
    bio?: string;
    preferences?: Partial<UserPreferences>;
  }): Promise<boolean> {
    try {
      const profile = await this.getEnhancedProfile(userId);
      if (!profile) {
        return false;
      }

      const updatedProfile: EnhancedUserProfile = {
        ...profile,
        firstName: updates.firstName !== undefined ? updates.firstName : profile.firstName,
        lastName: updates.lastName !== undefined ? updates.lastName : profile.lastName,
        username: updates.username !== undefined ? updates.username : profile.username,
        bio: updates.bio !== undefined ? updates.bio : profile.bio,
        preferences: updates.preferences ? {
          ...profile.preferences,
          ...updates.preferences,
        } : profile.preferences,
      };

      await this.saveEnhancedProfile(updatedProfile);
      return true;
    } catch (error) {
      console.error('Failed to update profile:', error);
      return false;
    }
  }

  async getUserSettings(userId: string): Promise<UserPreferences | null> {
    try {
      const profile = await this.getEnhancedProfile(userId);
      return profile?.preferences || null;
    } catch (error) {
      console.error('Failed to get user settings:', error);
      return null;
    }
  }

  async updateUserSettings(userId: string, preferences: Partial<UserPreferences>): Promise<boolean> {
    return this.updateProfile(userId, { preferences });
  }

  async getProfileStats(userId: string): Promise<UserStats | null> {
    try {
      const profile = await this.getEnhancedProfile(userId);
      return profile?.stats || null;
    } catch (error) {
      console.error('Failed to get profile stats:', error);
      return null;
    }
  }
}

export const enhancedAuthService = new EnhancedAuthService();
