import { Request, Response } from "express";
import { feedbackService } from "../services/feedback";
import { enhancedAuthService } from "../services/auth-enhanced";

// Submit feedback
export async function handleSubmitFeedback(req: Request, res: Response) {
  try {
    const {
      type,
      category,
      severity,
      title,
      description,
      reproductionSteps,
      expectedBehavior,
      actualBehavior,
      rating,
      tags = [],
    } = req.body;

    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (!type || !category || !severity || !title || !description) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: type, category, severity, title, description",
      });
    }

    // Get browser and device info from headers
    const browserInfo = req.headers["user-agent"] || "";
    const deviceInfo = req.headers["device-info"] || "";

    const feedbackId = await feedbackService.submitFeedback({
      userId,
      type,
      category,
      severity,
      title,
      description,
      reproductionSteps,
      expectedBehavior,
      actualBehavior,
      browserInfo,
      deviceInfo,
      rating,
      tags,
      priority:
        severity === "critical"
          ? "urgent"
          : severity === "high"
            ? "high"
            : "medium",
    });

    res.json({
      success: true,
      feedbackId,
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    console.error("Submit feedback failed:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to submit feedback",
    });
  }
}

// Get user's feedback
export async function handleGetUserFeedback(req: Request, res: Response) {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const feedback = await feedbackService.getUserFeedback(userId, limit);

    res.json({
      success: true,
      feedback,
      count: feedback.length,
    });
  } catch (error) {
    console.error("Get user feedback failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get feedback",
    });
  }
}

// Get single feedback item
export async function handleGetFeedback(req: Request, res: Response) {
  try {
    const { feedbackId } = req.params;
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const feedback = await feedbackService.getFeedback(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: "Feedback not found",
      });
    }

    // Check if user owns this feedback or is admin
    const userProfile = await enhancedAuthService.getEnhancedProfile(userId);
    const isAdmin = userProfile?.role === "admin" || userProfile?.isOwner;

    if (feedback.userId !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    res.json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error("Get feedback failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get feedback",
    });
  }
}

// Vote on feedback
export async function handleVoteFeedback(req: Request, res: Response) {
  try {
    const { feedbackId } = req.params;
    const { vote } = req.body; // 'up' or 'down'
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (!vote || !["up", "down"].includes(vote)) {
      return res.status(400).json({
        success: false,
        error: "Invalid vote. Must be 'up' or 'down'",
      });
    }

    const success = await feedbackService.voteFeedback(
      feedbackId,
      userId,
      vote,
    );

    if (success) {
      res.json({
        success: true,
        message: "Vote recorded successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error:
          "Failed to record vote. You may have already voted on this feedback.",
      });
    }
  } catch (error) {
    console.error("Vote feedback failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to record vote",
    });
  }
}

// Admin: Get all feedback
export async function handleGetAllFeedback(req: Request, res: Response) {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const userProfile = await enhancedAuthService.getEnhancedProfile(userId);
    const isAdmin = userProfile?.role === "admin" || userProfile?.isOwner;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Admin privileges required",
      });
    }

    const {
      status,
      type,
      category,
      severity,
      limit = "100",
      offset = "0",
    } = req.query;

    const feedback = await feedbackService.getAllFeedback({
      status: status as string,
      type: type as string,
      category: category as string,
      severity: severity as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      feedback,
      count: feedback.length,
    });
  } catch (error) {
    console.error("Get all feedback failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get feedback",
    });
  }
}

// Admin: Update feedback status
export async function handleUpdateFeedbackStatus(req: Request, res: Response) {
  try {
    const { feedbackId } = req.params;
    const { status, adminNotes } = req.body;
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const userProfile = await enhancedAuthService.getEnhancedProfile(userId);
    const isAdmin = userProfile?.role === "admin" || userProfile?.isOwner;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Admin privileges required",
      });
    }

    if (
      !status ||
      !["open", "in_progress", "resolved", "closed", "duplicate"].includes(
        status,
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    const success = await feedbackService.updateFeedbackStatus(
      feedbackId,
      status,
      userId,
      adminNotes,
    );

    if (success) {
      res.json({
        success: true,
        message: "Feedback status updated successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Feedback not found",
      });
    }
  } catch (error) {
    console.error("Update feedback status failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update feedback status",
    });
  }
}

// Admin: Get feedback statistics
export async function handleGetFeedbackStats(req: Request, res: Response) {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const userProfile = await enhancedAuthService.getEnhancedProfile(userId);
    const isAdmin = userProfile?.role === "admin" || userProfile?.isOwner;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Admin privileges required",
      });
    }

    const timeRange =
      (req.query.timeRange as "day" | "week" | "month" | "year") || "month";
    const stats = await feedbackService.getFeedbackStats(timeRange);

    res.json({
      success: true,
      stats,
      timeRange,
    });
  } catch (error) {
    console.error("Get feedback stats failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get feedback statistics",
    });
  }
}

// Admin: Get system logs
export async function handleGetSystemLogs(req: Request, res: Response) {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const userProfile = await enhancedAuthService.getEnhancedProfile(userId);
    const isAdmin = userProfile?.role === "admin" || userProfile?.isOwner;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Admin privileges required",
      });
    }

    const { level, service, action, targetUserId, limit = "100" } = req.query;

    const logs = await feedbackService.getSystemLogs({
      level: level as string,
      service: service as string,
      action: action as string,
      userId: targetUserId as string,
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (error) {
    console.error("Get system logs failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get system logs",
    });
  }
}

// Admin: Get admin actions
export async function handleGetAdminActions(req: Request, res: Response) {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const userProfile = await enhancedAuthService.getEnhancedProfile(userId);
    const isAdmin = userProfile?.role === "admin" || userProfile?.isOwner;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Admin privileges required",
      });
    }

    const { adminId, limit = "50" } = req.query;
    const actions = await feedbackService.getAdminActions(
      adminId as string,
      parseInt(limit as string),
    );

    res.json({
      success: true,
      actions,
      count: actions.length,
    });
  } catch (error) {
    console.error("Get admin actions failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get admin actions",
    });
  }
}

// Log custom event (for debugging and analytics)
export async function handleLogEvent(req: Request, res: Response) {
  try {
    const { level = "info", service, action, details = {} } = req.body;

    const userId = req.session?.userId;
    const sessionId = req.sessionID;
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];

    if (!service || !action) {
      return res.status(400).json({
        success: false,
        error: "Service and action are required",
      });
    }

    await feedbackService.logSystemEvent(
      level,
      service,
      userId,
      action,
      details,
      {
        sessionId,
        ipAddress,
        userAgent,
      },
    );

    res.json({
      success: true,
      message: "Event logged successfully",
    });
  } catch (error) {
    console.error("Log event failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to log event",
    });
  }
}
