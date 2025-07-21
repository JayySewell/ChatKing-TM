import { RequestHandler } from "express";
import { authService } from "../services/auth";
import { enhancedAuthService } from "../services/auth-enhanced";
import { ckStorage } from "../storage/ck-storage";

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  userId: string;
}

export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const { username, email, password }: RegisterRequest = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: username, email, password",
      });
    }

    const result = await authService.register({ username, email, password });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({
      success: false,
      error: "Registration failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: email, password",
      });
    }

    const result = await authService.login({ email, password });

    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleValidateSession: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const result = await authService.validateSession(token);

    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error("Session Validation Error:", error);
    res.status(500).json({
      success: false,
      error: "Session validation failed",
    });
  }
};

export const handleChangePassword: RequestHandler = async (req, res) => {
  try {
    const { currentPassword, newPassword, userId }: ChangePasswordRequest =
      req.body;

    if (!currentPassword || !newPassword || !userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: currentPassword, newPassword, userId",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters",
      });
    }

    const success = await authService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );

    if (success) {
      res.json({ success: true });
    } else {
      res.status(400).json({
        success: false,
        error: "Current password is incorrect",
      });
    }
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({
      success: false,
      error: "Password change failed",
    });
  }
};

export const handleLogout: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.body;

    if (userId) {
      // Log analytics
      await ckStorage.logAnalytics("user_logout", {
        userId,
        timestamp: new Date(),
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({
      success: false,
      error: "Logout failed",
    });
  }
};

export const handleGetUserProfile: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID required",
      });
    }

    const user = await ckStorage.getUser(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Return user data without password hash
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isOwner: user.isOwner,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        settings: user.settings,
      },
    });
  } catch (error) {
    console.error("Get User Profile Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user profile",
    });
  }
};

export const handleUpdateUserProfile: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, username, bio, preferences } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID required",
      });
    }

    // Use enhanced auth service for profile updates
    const success = await enhancedAuthService.updateProfile(userId, {
      firstName,
      lastName,
      username,
      bio,
      preferences,
    });

    if (success) {
      // Get updated profile to return
      const updatedProfile =
        await enhancedAuthService.getEnhancedProfile(userId);

      // Log analytics
      await ckStorage.logAnalytics("profile_updated", {
        userId,
        updates: Object.keys({
          firstName,
          lastName,
          username,
          bio,
          preferences,
        }).filter((key) => req.body[key] !== undefined),
        timestamp: new Date(),
      });

      res.json({
        success: true,
        profile: updatedProfile,
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Failed to update profile",
      });
    }
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      error: "Profile update failed",
    });
  }
};

export const handleGetSystemStats: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.query;

    // Verify user is owner
    const user = await ckStorage.getUser(userId as string);
    if (!user?.isOwner) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const stats = await ckStorage.getStorageStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get System Stats Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get system stats",
    });
  }
};
