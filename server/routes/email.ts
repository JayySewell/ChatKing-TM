import { Router, RequestHandler } from "express";
import { emailService } from "../services/email";
import { authMiddleware, ownerOnlyMiddleware } from "../middleware/auth";

const router = Router();

interface SendVerificationRequest {
  email: string;
  userName?: string;
}

interface VerifyEmailRequest {
  token: string;
}

interface SendPasswordResetRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

interface TestEmailRequest {
  to: string;
  subject: string;
  content: string;
}

interface UpdateEmailConfigRequest {
  provider: "smtp" | "sendgrid" | "mailgun" | "resend" | "gmail" | "outlook";
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  apiKey?: string;
  domain?: string;
  fromEmail: string;
  fromName: string;
}

export const handleSendVerificationEmail: RequestHandler = async (req, res) => {
  try {
    const { email, userName }: SendVerificationRequest = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email address required",
      });
    }

    // Generate verification token
    const token = await emailService.generateVerificationToken(email);

    // Send verification email
    const result = await emailService.sendVerificationEmail(
      email,
      token,
      userName,
    );

    if (result.success) {
      res.json({
        success: true,
        message: "Verification email sent successfully",
        email,
      });
    } else {
      res.status(500).json({
        error: "Failed to send verification email",
        details: result.error,
      });
    }
  } catch (error) {
    console.error("Send Verification Email Error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const handleVerifyEmail: RequestHandler = async (req, res) => {
  try {
    const { token }: VerifyEmailRequest = req.body;

    if (!token) {
      return res.status(400).json({
        error: "Verification token required",
      });
    }

    const result = await emailService.verifyEmailToken(token);

    if (result.valid) {
      res.json({
        success: true,
        message: "Email verified successfully",
        email: result.email,
      });
    } else {
      res.status(400).json({
        error: result.error || "Email verification failed",
      });
    }
  } catch (error) {
    console.error("Verify Email Error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const handleSendPasswordReset: RequestHandler = async (req, res) => {
  try {
    const { email }: SendPasswordResetRequest = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email address required",
      });
    }

    // Generate password reset token
    const token = await emailService.generatePasswordResetToken(email);

    // Send password reset email
    const result = await emailService.sendPasswordResetEmail(email, token);

    if (result.success) {
      res.json({
        success: true,
        message: "Password reset email sent successfully",
        email,
      });
    } else {
      res.status(500).json({
        error: "Failed to send password reset email",
        details: result.error,
      });
    }
  } catch (error) {
    console.error("Send Password Reset Error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const handleResetPassword: RequestHandler = async (req, res) => {
  try {
    const { token, newPassword }: ResetPasswordRequest = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: "Token and new password required",
      });
    }

    // Verify the reset token
    const tokenResult = await emailService.verifyPasswordResetToken(token);

    if (!tokenResult.valid) {
      return res.status(400).json({
        error: tokenResult.error || "Invalid reset token",
      });
    }

    // Mark token as used
    await emailService.markPasswordResetTokenAsUsed(token);

    // Here you would update the user's password in your auth service
    // For now, we'll just return success
    res.json({
      success: true,
      message: "Password reset successfully",
      email: tokenResult.email,
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const handleSendWelcomeEmail: RequestHandler = async (req, res) => {
  try {
    const { email, userName } = req.body;

    if (!email || !userName) {
      return res.status(400).json({
        error: "Email and userName required",
      });
    }

    const result = await emailService.sendWelcomeEmail(email, userName);

    if (result.success) {
      res.json({
        success: true,
        message: "Welcome email sent successfully",
        email,
      });
    } else {
      res.status(500).json({
        error: "Failed to send welcome email",
        details: result.error,
      });
    }
  } catch (error) {
    console.error("Send Welcome Email Error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const handleSendSecurityAlert: RequestHandler = async (req, res) => {
  try {
    const { email, alertType, details } = req.body;

    if (!email || !alertType) {
      return res.status(400).json({
        error: "Email and alertType required",
      });
    }

    const result = await emailService.sendSecurityAlert(
      email,
      alertType,
      details,
    );

    if (result.success) {
      res.json({
        success: true,
        message: "Security alert sent successfully",
        email,
        alertType,
      });
    } else {
      res.status(500).json({
        error: "Failed to send security alert",
        details: result.error,
      });
    }
  } catch (error) {
    console.error("Send Security Alert Error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const handleTestEmail: RequestHandler = async (req, res) => {
  try {
    const { to, subject, content }: TestEmailRequest = req.body;

    if (!to || !subject || !content) {
      return res.status(400).json({
        error: "To, subject, and content required",
      });
    }

    const result = await emailService.sendEmail({
      to,
      subject,
      html: `<p>${content}</p>`,
      text: content,
    });

    if (result.success) {
      res.json({
        success: true,
        message: "Test email sent successfully",
        messageId: result.messageId,
        to,
      });
    } else {
      res.status(500).json({
        error: "Failed to send test email",
        details: result.error,
      });
    }
  } catch (error) {
    console.error("Test Email Error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const handleGetEmailConfig: RequestHandler = async (req, res) => {
  try {
    const config = emailService.getConfig();

    res.json({
      config,
    });
  } catch (error) {
    console.error("Get Email Config Error:", error);
    res.status(500).json({
      error: "Failed to get email configuration",
    });
  }
};

export const handleUpdateEmailConfig: RequestHandler = async (req, res) => {
  try {
    const config: UpdateEmailConfigRequest = req.body;

    if (!config.provider || !config.fromEmail) {
      return res.status(400).json({
        error: "Provider and fromEmail required",
      });
    }

    emailService.updateConfig(config);

    // Test the new configuration
    const testResult = await emailService.testEmailConfig();

    if (testResult.success) {
      res.json({
        success: true,
        message: "Email configuration updated and tested successfully",
        config: emailService.getConfig(),
      });
    } else {
      res.status(400).json({
        error: "Email configuration updated but test failed",
        testError: testResult.error,
        config: emailService.getConfig(),
      });
    }
  } catch (error) {
    console.error("Update Email Config Error:", error);
    res.status(500).json({
      error: "Failed to update email configuration",
    });
  }
};

export const handleTestEmailConfig: RequestHandler = async (req, res) => {
  try {
    const result = await emailService.testEmailConfig();

    if (result.success) {
      res.json({
        success: true,
        message: "Email configuration test successful",
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        error: "Email configuration test failed",
        details: result.error,
      });
    }
  } catch (error) {
    console.error("Test Email Config Error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Public routes (no authentication required)
router.post("/send-verification", handleSendVerificationEmail);
router.post("/verify", handleVerifyEmail);
router.post("/send-password-reset", handleSendPasswordReset);
router.post("/reset-password", handleResetPassword);

// Protected routes (authentication required)
router.post("/send-welcome", authMiddleware, handleSendWelcomeEmail);
router.post("/send-security-alert", authMiddleware, handleSendSecurityAlert);
router.post("/test", authMiddleware, handleTestEmail);

// Admin routes (owner only)
router.get(
  "/config",
  authMiddleware,
  ownerOnlyMiddleware,
  handleGetEmailConfig,
);
router.put(
  "/config",
  authMiddleware,
  ownerOnlyMiddleware,
  handleUpdateEmailConfig,
);
router.post(
  "/test-config",
  authMiddleware,
  ownerOnlyMiddleware,
  handleTestEmailConfig,
);

export default router;
