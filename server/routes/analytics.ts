import { RequestHandler } from "express";
import { analyticsService } from "../services/analytics";
import { ckStorage } from "../storage/ck-storage";

interface GenerateReportRequest {
  userId: string;
  type: "daily" | "weekly" | "monthly";
}

export const handleGetSystemMetrics: RequestHandler = async (req, res) => {
  try {
    const { userId, days = 7 } = req.query;

    // Verify user is owner
    const user = await ckStorage.getUser(userId as string);
    if (!user?.isOwner) {
      return res.status(403).json({
        success: false,
        error: "Access denied: Only owners can view system metrics",
      });
    }

    const metrics = await analyticsService.getSystemMetrics(
      parseInt(days as string),
    );

    res.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error("Get System Metrics Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get system metrics",
    });
  }
};

export const handleGetUsageStats: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID required",
      });
    }

    const stats = await analyticsService.getUsageStats(
      userId,
      parseInt(days as string),
    );

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get Usage Stats Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get usage statistics",
    });
  }
};

export const handleGetRecentActivity: RequestHandler = async (req, res) => {
  try {
    const { userId, limit = 50 } = req.query;

    // Verify user is owner
    const user = await ckStorage.getUser(userId as string);
    if (!user?.isOwner) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const activity = await analyticsService.getRecentActivity(
      parseInt(limit as string),
    );

    res.json({
      success: true,
      activity,
    });
  } catch (error) {
    console.error("Get Recent Activity Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get recent activity",
    });
  }
};

export const handleGetPerformanceMetrics: RequestHandler = async (req, res) => {
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

    const performance = await analyticsService.getPerformanceMetrics();

    res.json({
      success: true,
      performance,
    });
  } catch (error) {
    console.error("Get Performance Metrics Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get performance metrics",
    });
  }
};

export const handleGetTopQueries: RequestHandler = async (req, res) => {
  try {
    const { service } = req.params;
    const { userId, limit = 10 } = req.query;

    // Verify user is owner
    const user = await ckStorage.getUser(userId as string);
    if (!user?.isOwner) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const queries = await analyticsService.getTopQueries(
      service,
      parseInt(limit as string),
    );

    res.json({
      success: true,
      service,
      queries,
    });
  } catch (error) {
    console.error("Get Top Queries Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get top queries",
    });
  }
};

export const handleGetResourceUsage: RequestHandler = async (req, res) => {
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

    const resources = await analyticsService.getResourceUsage();

    res.json({
      success: true,
      resources,
    });
  } catch (error) {
    console.error("Get Resource Usage Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get resource usage",
    });
  }
};

export const handleGenerateReport: RequestHandler = async (req, res) => {
  try {
    const { userId, type }: GenerateReportRequest = req.body;

    if (!userId || !type) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, type",
      });
    }

    if (!["daily", "weekly", "monthly"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid report type. Must be daily, weekly, or monthly",
      });
    }

    const report = await analyticsService.generateReport(userId, type);

    if (report) {
      res.json({
        success: true,
        report,
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Failed to generate report",
      });
    }
  } catch (error) {
    console.error("Generate Report Error:", error);
    res.status(500).json({
      success: false,
      error: "Report generation failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetAnalyticsDashboard: RequestHandler = async (req, res) => {
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

    // Get comprehensive dashboard data
    const [metrics, usage, performance, activity, resources] =
      await Promise.all([
        analyticsService.getSystemMetrics(7),
        analyticsService.getUsageStats(userId as string, 30),
        analyticsService.getPerformanceMetrics(),
        analyticsService.getRecentActivity(20),
        analyticsService.getResourceUsage(),
      ]);

    const dashboard = {
      overview: {
        totalUsers: metrics.totalUsers,
        activeUsers: metrics.activeUsers,
        systemHealth: metrics.systemHealth,
        errorRate: metrics.errorRate,
      },
      metrics,
      usage,
      performance,
      recentActivity: activity,
      resources,
      lastUpdated: new Date().toISOString(),
    };

    res.json({
      success: true,
      dashboard,
    });
  } catch (error) {
    console.error("Get Analytics Dashboard Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get analytics dashboard",
    });
  }
};
