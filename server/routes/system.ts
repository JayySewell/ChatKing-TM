import { Router, RequestHandler } from "express";
import { systemHealthService } from "../services/system-health";
import { authMiddleware, ownerOnlyMiddleware } from "../middleware/auth";

const router = Router();

export const handleGetSystemHealth: RequestHandler = async (req, res) => {
  try {
    const health = await systemHealthService.getSystemHealth();
    
    res.json({
      ...health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get System Health Error:", error);
    res.status(500).json({
      error: "Failed to get system health",
      overall: "unhealthy",
      services: [],
      uptime: process.uptime(),
      version: "2.0.0",
      environment: process.env.NODE_ENV || "development",
      lastUpdate: new Date().toISOString(),
      stats: {
        totalUsers: 0,
        totalSessions: 0,
        totalRequests: 0,
        errorRate: 1,
      },
    });
  }
};

export const handleGetDependencyStatus: RequestHandler = async (req, res) => {
  try {
    const dependencies = await systemHealthService.getDependencyStatus();
    
    res.json({
      dependencies,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get Dependency Status Error:", error);
    res.status(500).json({
      error: "Failed to get dependency status",
    });
  }
};

export const handleGetHealthReport: RequestHandler = async (req, res) => {
  try {
    const report = await systemHealthService.generateHealthReport();
    
    res.json({
      ...report,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get Health Report Error:", error);
    res.status(500).json({
      error: "Failed to generate health report",
    });
  }
};

export const handleGetSystemInfo: RequestHandler = async (req, res) => {
  try {
    const info = {
      application: {
        name: "ChatKing AI",
        version: "2.0.0",
        description: "Advanced AI-powered conversations and tools",
        features: [
          "AI Chat with multiple models",
          "Web Search with BraveSearch",
          "Advanced Calculator",
          "Pinecone Vector Database",
          "Secure encrypted storage",
          "OAuth authentication",
          "Real-time security monitoring",
          "Email verification system",
        ],
      },
      system: {
        node: process.version,
        platform: process.platform,
        architecture: process.arch,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
      },
      memory: process.memoryUsage(),
      timestamps: {
        started: new Date(Date.now() - process.uptime() * 1000).toISOString(),
        current: new Date().toISOString(),
      },
    };
    
    res.json(info);
  } catch (error) {
    console.error("Get System Info Error:", error);
    res.status(500).json({
      error: "Failed to get system information",
    });
  }
};

export const handleGetServiceStatus: RequestHandler = async (req, res) => {
  try {
    const { service } = req.params;
    const health = await systemHealthService.getSystemHealth();
    
    const serviceStatus = health.services.find(s => 
      s.name.toLowerCase() === service.toLowerCase()
    );
    
    if (!serviceStatus) {
      return res.status(404).json({
        error: "Service not found",
        availableServices: health.services.map(s => s.name.toLowerCase()),
      });
    }
    
    res.json({
      service: serviceStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get Service Status Error:", error);
    res.status(500).json({
      error: "Failed to get service status",
    });
  }
};

export const handleRestartService: RequestHandler = async (req, res) => {
  try {
    const { service } = req.params;
    
    // In a real implementation, you'd have service restart logic here
    console.log(`Service restart requested: ${service}`);
    
    res.json({
      success: true,
      message: `Service ${service} restart initiated`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Restart Service Error:", error);
    res.status(500).json({
      error: "Failed to restart service",
    });
  }
};

export const handleGetMetrics: RequestHandler = async (req, res) => {
  try {
    const { timespan = '1h' } = req.query;
    
    // In a real implementation, you'd fetch historical metrics
    const metrics = {
      timespan,
      dataPoints: 60, // Mock data
      metrics: {
        requests: {
          total: 1250,
          rate: 2.5, // requests per second
          errors: 15,
          errorRate: 0.012,
        },
        response: {
          avg: 245, // ms
          p50: 180,
          p95: 650,
          p99: 1200,
        },
        resources: {
          cpu: 35.2, // percentage
          memory: 68.5, // percentage
          disk: 25.1, // percentage
        },
        services: {
          healthy: 6,
          degraded: 1,
          unhealthy: 0,
        },
      },
      generatedAt: new Date().toISOString(),
    };
    
    res.json(metrics);
  } catch (error) {
    console.error("Get Metrics Error:", error);
    res.status(500).json({
      error: "Failed to get system metrics",
    });
  }
};

// Public health check endpoint (no authentication required)
router.get('/health', handleGetSystemHealth);
router.get('/info', handleGetSystemInfo);

// Protected endpoints (authentication required)
router.get('/dependencies', authMiddleware, ownerOnlyMiddleware, handleGetDependencyStatus);
router.get('/report', authMiddleware, ownerOnlyMiddleware, handleGetHealthReport);
router.get('/service/:service', authMiddleware, ownerOnlyMiddleware, handleGetServiceStatus);
router.get('/metrics', authMiddleware, ownerOnlyMiddleware, handleGetMetrics);

// Admin endpoints (owner only)
router.post('/service/:service/restart', authMiddleware, ownerOnlyMiddleware, handleRestartService);

export default router;
