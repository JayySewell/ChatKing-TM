import { Router, RequestHandler } from "express";
import { securityService } from "../services/security";
import { authMiddleware, ownerOnlyMiddleware } from "../middleware/auth";

const router = Router();

interface BlockIpRequest {
  ip: string;
  reason: string;
  duration?: number;
}

interface UpdateSecurityConfigRequest {
  config: {
    maxLoginAttempts?: number;
    blockDuration?: number;
    maxRequestsPerMinute?: number;
    suspiciousPatterns?: string[];
    whitelist?: string[];
    blacklist?: string[];
    enableHoneypot?: boolean;
    enableDummyRedirect?: boolean;
    dummyRedirectUrl?: string;
  };
}

export const handleGetSecurityStats: RequestHandler = async (req, res) => {
  try {
    const stats = await securityService.getSecurityStats();

    res.json({
      ...stats,
      currentTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get Security Stats Error:", error);
    res.status(500).json({
      error: "Failed to retrieve security statistics",
    });
  }
};

export const handleGetSecurityEvents: RequestHandler = async (req, res) => {
  try {
    const { limit = 100, severity, type } = req.query;
    const stats = await securityService.getSecurityStats();
    
    let events = stats.recentEvents;

    // Filter by severity if specified
    if (severity && typeof severity === 'string') {
      events = events.filter(event => event.severity === severity);
    }

    // Filter by type if specified
    if (type && typeof type === 'string') {
      events = events.filter(event => event.type === type);
    }

    // Limit results
    const limitNum = parseInt(limit as string, 10);
    if (!isNaN(limitNum)) {
      events = events.slice(0, limitNum);
    }

    res.json({
      events,
      total: events.length,
      filters: { severity, type, limit },
    });
  } catch (error) {
    console.error("Get Security Events Error:", error);
    res.status(500).json({
      error: "Failed to retrieve security events",
    });
  }
};

export const handleBlockIp: RequestHandler = async (req, res) => {
  try {
    const { ip, reason, duration = 60 }: BlockIpRequest = req.body;

    if (!ip || !reason) {
      return res.status(400).json({
        error: "Missing required fields: ip, reason",
      });
    }

    // Validate IP format (basic check)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return res.status(400).json({
        error: "Invalid IP address format",
      });
    }

    await securityService.blockIp(ip, reason, duration);

    res.json({
      success: true,
      ip,
      reason,
      duration,
      message: `IP ${ip} blocked for ${duration} minutes`,
    });
  } catch (error) {
    console.error("Block IP Error:", error);
    res.status(500).json({
      error: "Failed to block IP address",
    });
  }
};

export const handleUnblockIp: RequestHandler = async (req, res) => {
  try {
    const { ip } = req.params;

    if (!ip) {
      return res.status(400).json({
        error: "IP address required",
      });
    }

    await securityService.unblockIp(ip);

    res.json({
      success: true,
      ip,
      message: `IP ${ip} unblocked successfully`,
    });
  } catch (error) {
    console.error("Unblock IP Error:", error);
    res.status(500).json({
      error: "Failed to unblock IP address",
    });
  }
};

export const handleGetBlockedIps: RequestHandler = async (req, res) => {
  try {
    const stats = await securityService.getSecurityStats();

    res.json({
      blockedIps: stats.blockedIps,
      total: stats.blockedIps,
    });
  } catch (error) {
    console.error("Get Blocked IPs Error:", error);
    res.status(500).json({
      error: "Failed to retrieve blocked IP addresses",
    });
  }
};

export const handleUpdateSecurityConfig: RequestHandler = async (req, res) => {
  try {
    const { config }: UpdateSecurityConfigRequest = req.body;

    if (!config || typeof config !== 'object') {
      return res.status(400).json({
        error: "Configuration object required",
      });
    }

    await securityService.updateSecurityConfig(config);

    res.json({
      success: true,
      message: "Security configuration updated successfully",
      config,
    });
  } catch (error) {
    console.error("Update Security Config Error:", error);
    res.status(500).json({
      error: "Failed to update security configuration",
    });
  }
};

export const handleGetSecurityConfig: RequestHandler = async (req, res) => {
  try {
    const config = securityService.getSecurityConfig();

    res.json({
      config,
    });
  } catch (error) {
    console.error("Get Security Config Error:", error);
    res.status(500).json({
      error: "Failed to retrieve security configuration",
    });
  }
};

export const handleGenerateDummyResponse: RequestHandler = async (req, res) => {
  try {
    const dummyResponse = securityService.generateDummyResponse();

    res.json({
      dummy: true,
      response: dummyResponse,
      message: "This is a dummy response for testing security measures",
    });
  } catch (error) {
    console.error("Generate Dummy Response Error:", error);
    res.status(500).json({
      error: "Failed to generate dummy response",
    });
  }
};

export const handleTestSecurityAnalysis: RequestHandler = async (req, res) => {
  try {
    const { payload, endpoint = '/test', userAgent = 'TestAgent/1.0' } = req.body;

    // Create a mock request object for testing
    const mockReq = {
      ip: req.ip,
      get: (header: string) => header === 'User-Agent' ? userAgent : '',
      path: endpoint,
      body: payload || {},
      query: {},
    };

    const analysis = await securityService.analyzeRequest(mockReq);

    res.json({
      analysis,
      testPayload: payload,
      endpoint,
      userAgent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Test Security Analysis Error:", error);
    res.status(500).json({
      error: "Failed to test security analysis",
    });
  }
};

export const handleGetThreatIntelligence: RequestHandler = async (req, res) => {
  try {
    const stats = await securityService.getSecurityStats();
    
    // Analyze threat patterns
    const threatAnalysis = {
      topAttackTypes: stats.topThreats,
      recentThreats: stats.recentEvents
        .filter(event => event.severity === 'high' || event.severity === 'critical')
        .slice(0, 20),
      attackPatterns: {
        timeDistribution: {},
        ipDistribution: {},
        userAgentDistribution: {},
      },
      recommendations: [],
    };

    // Time-based analysis
    const hoursMap: Record<number, number> = {};
    stats.recentEvents.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hoursMap[hour] = (hoursMap[hour] || 0) + 1;
    });
    threatAnalysis.attackPatterns.timeDistribution = hoursMap;

    // IP-based analysis
    const ipMap: Record<string, number> = {};
    stats.recentEvents.forEach(event => {
      ipMap[event.ip] = (ipMap[event.ip] || 0) + 1;
    });
    threatAnalysis.attackPatterns.ipDistribution = Object.fromEntries(
      Object.entries(ipMap)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
    );

    // User Agent analysis
    const uaMap: Record<string, number> = {};
    stats.recentEvents.forEach(event => {
      const ua = event.userAgent.substring(0, 50); // Truncate for grouping
      uaMap[ua] = (uaMap[ua] || 0) + 1;
    });
    threatAnalysis.attackPatterns.userAgentDistribution = Object.fromEntries(
      Object.entries(uaMap)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
    );

    // Generate recommendations
    if (stats.totalEvents > 1000) {
      threatAnalysis.recommendations.push("Consider implementing stricter rate limiting");
    }
    if (stats.blockedIps > 50) {
      threatAnalysis.recommendations.push("High number of blocked IPs detected - review security rules");
    }
    if (stats.topThreats.some(t => t.type === 'ddos_attempt' && t.count > 100)) {
      threatAnalysis.recommendations.push("DDoS protection may need enhancement");
    }

    res.json({
      threatIntelligence: threatAnalysis,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get Threat Intelligence Error:", error);
    res.status(500).json({
      error: "Failed to generate threat intelligence report",
    });
  }
};

// Routes (all require authentication and owner permissions for security)
router.get('/stats', authMiddleware, ownerOnlyMiddleware, handleGetSecurityStats);
router.get('/events', authMiddleware, ownerOnlyMiddleware, handleGetSecurityEvents);
router.post('/block-ip', authMiddleware, ownerOnlyMiddleware, handleBlockIp);
router.delete('/unblock-ip/:ip', authMiddleware, ownerOnlyMiddleware, handleUnblockIp);
router.get('/blocked-ips', authMiddleware, ownerOnlyMiddleware, handleGetBlockedIps);
router.put('/config', authMiddleware, ownerOnlyMiddleware, handleUpdateSecurityConfig);
router.get('/config', authMiddleware, ownerOnlyMiddleware, handleGetSecurityConfig);
router.get('/dummy-response', handleGenerateDummyResponse); // Public for testing
router.post('/test-analysis', authMiddleware, ownerOnlyMiddleware, handleTestSecurityAnalysis);
router.get('/threat-intelligence', authMiddleware, ownerOnlyMiddleware, handleGetThreatIntelligence);

export default router;
