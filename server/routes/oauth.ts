import { RequestHandler } from "express";
import { oAuthService } from "../services/oauth";
import { ckStorage } from "../storage/ck-storage";

export const handleGoogleAuth: RequestHandler = async (req, res) => {
  try {
    const state = oAuthService.generateState();
    
    // Store state in session for validation
    // In production, use proper session management
    req.session = { ...req.session, oauthState: state };
    
    const authUrl = oAuthService.getGoogleAuthUrl(state);
    
    res.json({
      success: true,
      authUrl,
      state
    });
  } catch (error) {
    console.error('Google Auth Init Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize Google authentication'
    });
  }
};

export const handleAppleAuth: RequestHandler = async (req, res) => {
  try {
    const state = oAuthService.generateState();
    
    // Store state in session for validation
    req.session = { ...req.session, oauthState: state };
    
    const authUrl = oAuthService.getAppleAuthUrl(state);
    
    res.json({
      success: true,
      authUrl,
      state
    });
  } catch (error) {
    console.error('Apple Auth Init Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize Apple authentication'
    });
  }
};

export const handleGoogleCallback: RequestHandler = async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      return res.redirect(`/login?error=${encodeURIComponent(error as string)}`);
    }
    
    if (!code || !state) {
      return res.redirect('/login?error=missing_parameters');
    }
    
    // Validate state (in production, check against session)
    const sessionState = req.session?.oauthState;
    if (!sessionState || !oAuthService.validateState(state as string, sessionState)) {
      return res.redirect('/login?error=invalid_state');
    }
    
    // Handle Google OAuth
    const result = await oAuthService.handleGoogleCallback(code as string, state as string);
    
    if (result.success) {
      // Set auth cookies/headers and redirect
      res.cookie('chatking_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      const redirectUrl = result.isNewUser ? '/welcome' : '/';
      res.redirect(redirectUrl);
    } else {
      res.redirect('/login?error=authentication_failed');
    }
  } catch (error) {
    console.error('Google Callback Error:', error);
    res.redirect('/login?error=server_error');
  }
};

export const handleAppleCallback: RequestHandler = async (req, res) => {
  try {
    const { code, state, user, error } = req.body;
    
    if (error) {
      return res.redirect(`/login?error=${encodeURIComponent(error)}`);
    }
    
    if (!code || !state) {
      return res.redirect('/login?error=missing_parameters');
    }
    
    // Validate state
    const sessionState = req.session?.oauthState;
    if (!sessionState || !oAuthService.validateState(state, sessionState)) {
      return res.redirect('/login?error=invalid_state');
    }
    
    // Handle Apple OAuth
    const result = await oAuthService.handleAppleCallback(code, state, user);
    
    if (result.success) {
      // Set auth cookies/headers and redirect
      res.cookie('chatking_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      const redirectUrl = result.isNewUser ? '/welcome' : '/';
      res.redirect(redirectUrl);
    } else {
      res.redirect('/login?error=authentication_failed');
    }
  } catch (error) {
    console.error('Apple Callback Error:', error);
    res.redirect('/login?error=server_error');
  }
};

export const handleOAuthStatus: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required'
      });
    }
    
    const user = await ckStorage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const oAuthStatus = {
      hasOAuth: !!(user.settings?.oAuthProvider),
      provider: user.settings?.oAuthProvider || null,
      emailVerified: user.settings?.emailVerified || false,
      profilePicture: user.settings?.profilePicture || null
    };
    
    res.json({
      success: true,
      oAuthStatus
    });
  } catch (error) {
    console.error('OAuth Status Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get OAuth status'
    });
  }
};

export const handleUnlinkOAuth: RequestHandler = async (req, res) => {
  try {
    const { userId, provider } = req.body;
    
    if (!userId || !provider) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, provider'
      });
    }
    
    const user = await ckStorage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Remove OAuth info from user settings
    const updatedSettings = { ...user.settings };
    delete updatedSettings.oAuthProvider;
    delete updatedSettings.oAuthProviderId;
    delete updatedSettings.profilePicture;
    
    await ckStorage.updateUser(userId, {
      settings: updatedSettings
    });
    
    // Log analytics
    await ckStorage.logAnalytics('oauth_unlinked', {
      userId,
      provider,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      message: `${provider} account unlinked successfully`
    });
  } catch (error) {
    console.error('Unlink OAuth Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlink OAuth account'
    });
  }
};

// Middleware to add session support (basic implementation)
export const sessionMiddleware: RequestHandler = (req, res, next) => {
  // In production, use proper session middleware like express-session
  if (!req.session) {
    req.session = {};
  }
  next();
};

// Type declaration for session
declare global {
  namespace Express {
    interface Request {
      session?: any;
    }
  }
}
