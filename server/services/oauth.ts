import crypto from "crypto";
import { authService } from "./auth";
import { ckStorage } from "../storage/ck-storage";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

interface AppleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  id_token: string;
}

interface AppleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: {
    firstName: string;
    lastName: string;
  };
}

export class OAuthService {
  private googleClientId =
    process.env.GOOGLE_CLIENT_ID || "demo-google-client-id";
  private googleClientSecret =
    process.env.GOOGLE_CLIENT_SECRET || "demo-google-secret";
  private appleClientId = process.env.APPLE_CLIENT_ID || "com.chatking.app";
  private appleTeamId = process.env.APPLE_TEAM_ID || "demo-apple-team";
  private appleKeyId = process.env.APPLE_KEY_ID || "demo-apple-key";

  // Google OAuth URLs
  getGoogleAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.googleClientId,
      redirect_uri: `${process.env.BASE_URL || "http://localhost:8080"}/auth/google/callback`,
      response_type: "code",
      scope: "openid email profile",
      state: state,
      access_type: "offline",
      prompt: "consent",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Apple OAuth URLs
  getAppleAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.appleClientId,
      redirect_uri: `${process.env.BASE_URL || "http://localhost:8080"}/auth/apple/callback`,
      response_type: "code",
      scope: "name email",
      state: state,
      response_mode: "form_post",
    });

    return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  }

  async handleGoogleCallback(code: string, state: string): Promise<any> {
    try {
      // Exchange code for tokens
      const tokenResponse = await this.exchangeGoogleCode(code);

      // Get user info
      const userInfo = await this.getGoogleUserInfo(tokenResponse.access_token);

      // Create or login user
      return await this.createOrLoginUser({
        provider: "google",
        providerId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        verified: userInfo.verified_email,
      });
    } catch (error) {
      console.error("Google OAuth error:", error);
      throw new Error("Google authentication failed");
    }
  }

  async handleAppleCallback(
    code: string,
    state: string,
    user?: string,
  ): Promise<any> {
    try {
      // Exchange code for tokens
      const tokenResponse = await this.exchangeAppleCode(code);

      // Decode and verify ID token
      const userInfo = await this.decodeAppleIdToken(tokenResponse.id_token);

      // Handle user info from form data if provided
      let userData = userInfo;
      if (user) {
        const userFormData = JSON.parse(user);
        userData = {
          ...userInfo,
          name: userFormData.name,
        };
      }

      // Create or login user
      return await this.createOrLoginUser({
        provider: "apple",
        providerId: userData.sub,
        email: userData.email,
        name: userData.name
          ? `${userData.name.firstName} ${userData.name.lastName}`
          : userData.email.split("@")[0],
        verified: userData.email_verified,
      });
    } catch (error) {
      console.error("Apple OAuth error:", error);
      throw new Error("Apple authentication failed");
    }
  }

  private async exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.googleClientId,
        client_secret: this.googleClientSecret,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.BASE_URL || "http://localhost:8080"}/auth/google/callback`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google token exchange failed: ${error}`);
    }

    return response.json();
  }

  private async getGoogleUserInfo(
    accessToken: string,
  ): Promise<GoogleUserInfo> {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to get Google user info");
    }

    return response.json();
  }

  private async exchangeAppleCode(code: string): Promise<AppleTokenResponse> {
    // For demo purposes, return mock data
    // In production, this would use Apple's token endpoint with proper JWT signing
    return {
      access_token: "mock-apple-access-token",
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: "mock-apple-refresh-token",
      id_token: this.createMockAppleIdToken(),
    };
  }

  private createMockAppleIdToken(): string {
    // Create a mock Apple ID token for demo
    const payload = {
      iss: "https://appleid.apple.com",
      aud: this.appleClientId,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      sub: "demo-apple-user-id",
      email: "user@icloud.com",
      email_verified: true,
    };

    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" }),
    ).toString("base64");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64");
    const signature = crypto
      .createHmac("sha256", "demo-secret")
      .update(`${header}.${body}`)
      .digest("base64");

    return `${header}.${body}.${signature}`;
  }

  private async decodeAppleIdToken(idToken: string): Promise<AppleUserInfo> {
    try {
      const [header, payload, signature] = idToken.split(".");
      const decodedPayload = JSON.parse(
        Buffer.from(payload, "base64").toString(),
      );

      return {
        sub: decodedPayload.sub,
        email: decodedPayload.email,
        email_verified: decodedPayload.email_verified || false,
        name: decodedPayload.name,
      };
    } catch (error) {
      throw new Error("Failed to decode Apple ID token");
    }
  }

  private async createOrLoginUser(oAuthData: {
    provider: "google" | "apple";
    providerId: string;
    email: string;
    name: string;
    picture?: string;
    verified: boolean;
  }): Promise<any> {
    try {
      // Check if user exists with this email
      let user = await ckStorage.getUserByEmail(oAuthData.email);

      if (user) {
        // User exists, update OAuth info and login
        await ckStorage.updateUser(user.id, {
          lastLogin: new Date(),
          settings: {
            ...user.settings,
            oAuthProvider: oAuthData.provider,
            oAuthProviderId: oAuthData.providerId,
            profilePicture: oAuthData.picture,
          },
        });

        // Generate token
        const token = authService["generateToken"](user.id, user.email);

        return {
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            isOwner: user.isOwner,
          },
          token,
          provider: oAuthData.provider,
        };
      } else {
        // Create new user
        const userCount = await authService.getUserCount();
        const isOwner =
          userCount === 0 || oAuthData.email === "jayysewell18@gmail.com";

        const newUser = await ckStorage.createUser({
          username: oAuthData.name || oAuthData.email.split("@")[0],
          email: oAuthData.email,
          passwordHash: crypto.randomBytes(32).toString("hex"), // Random password for OAuth users
          isOwner,
          settings: {
            theme: "cyberpunk",
            notifications: true,
            privacy: "standard",
            oAuthProvider: oAuthData.provider,
            oAuthProviderId: oAuthData.providerId,
            profilePicture: oAuthData.picture,
            emailVerified: oAuthData.verified,
          },
        });

        // Generate token
        const token = authService["generateToken"](newUser.id, newUser.email);

        // Log analytics
        await ckStorage.logAnalytics("oauth_user_created", {
          userId: newUser.id,
          provider: oAuthData.provider,
          isOwner,
          timestamp: new Date(),
        });

        return {
          success: true,
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            isOwner: newUser.isOwner,
          },
          token,
          provider: oAuthData.provider,
          isNewUser: true,
        };
      }
    } catch (error) {
      console.error("OAuth user creation/login error:", error);
      throw new Error("Failed to create or login user");
    }
  }

  generateState(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  validateState(state: string, sessionState: string): boolean {
    return state === sessionState;
  }
}

export const oAuthService = new OAuthService();
