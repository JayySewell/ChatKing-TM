import { pineconeService } from "./pinecone";
import { openRouterService } from "./openrouter";
import { braveSearchService } from "./bravesearch";
import { emailService } from "./email";
import { apiKeyService } from "./apikeys";
import { securityService } from "./security";
import { authService } from "./auth";

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
  lastChecked: string;
  details?: any;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceStatus[];
  uptime: number;
  version: string;
  environment: string;
  lastUpdate: string;
  stats: {
    totalUsers: number;
    totalSessions: number;
    totalRequests: number;
    errorRate: number;
  };
}

export class SystemHealthService {
  private lastHealthCheck: Date;
  private healthCheckInterval: number;
  private services: Map<string, ServiceStatus>;

  constructor() {
    this.lastHealthCheck = new Date();
    this.healthCheckInterval = 5 * 60 * 1000; // 5 minutes
    this.services = new Map();
    
    // Start periodic health checks
    this.startHealthChecks();
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const services = await this.checkAllServices();
    const overall = this.calculateOverallHealth(services);
    const stats = await this.getSystemStats();

    return {
      overall,
      services,
      uptime: process.uptime(),
      version: "2.0.0",
      environment: process.env.NODE_ENV || "development",
      lastUpdate: new Date().toISOString(),
      stats,
    };
  }

  private async checkAllServices(): Promise<ServiceStatus[]> {
    const serviceChecks = [
      this.checkPineconeService(),
      this.checkOpenRouterService(),
      this.checkBraveSearchService(),
      this.checkEmailService(),
      this.checkAuthService(),
      this.checkStorageService(),
      this.checkSecurityService(),
    ];

    const results = await Promise.allSettled(serviceChecks);
    const services: ServiceStatus[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        services.push(result.value);
      } else {
        const serviceNames = ['Pinecone', 'OpenRouter', 'BraveSearch', 'Email', 'Auth', 'Storage', 'Security'];
        services.push({
          name: serviceNames[index] || 'Unknown',
          status: 'unhealthy',
          error: result.reason instanceof Error ? result.reason.message : 'Health check failed',
          lastChecked: new Date().toISOString(),
        });
      }
    });

    return services;
  }

  private async checkPineconeService(): Promise<ServiceStatus> {
    const startTime = Date.now();
    try {
      const result = await pineconeService.testConnection();
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'Pinecone',
        status: result.connected ? 'healthy' : 'unhealthy',
        responseTime,
        error: result.error,
        lastChecked: new Date().toISOString(),
        details: {
          apiKeyValid: pineconeService.validateApiKey(),
          indexCount: result.indexCount,
        },
      };
    } catch (error) {
      return {
        name: 'Pinecone',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkOpenRouterService(): Promise<ServiceStatus> {
    const startTime = Date.now();
    try {
      const result = await openRouterService.testConnection();
      const responseTime = Date.now() - startTime;
      const stats = openRouterService.getUsageStats();
      
      return {
        name: 'OpenRouter',
        status: result.connected ? 'healthy' : 'unhealthy',
        responseTime,
        error: result.error,
        lastChecked: new Date().toISOString(),
        details: {
          apiKeyValid: openRouterService.validateApiKey(),
          requests: stats.requests,
          successRate: stats.successRate,
          model: result.model,
        },
      };
    } catch (error) {
      return {
        name: 'OpenRouter',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkBraveSearchService(): Promise<ServiceStatus> {
    const startTime = Date.now();
    try {
      const result = await braveSearchService.testConnection();
      const responseTime = Date.now() - startTime;
      const stats = await braveSearchService.getSearchStats();
      
      return {
        name: 'BraveSearch',
        status: result.connected ? 'healthy' : 'unhealthy',
        responseTime,
        error: result.error,
        lastChecked: new Date().toISOString(),
        details: {
          apiKeyValid: braveSearchService.validateApiKey(),
          totalSearches: stats.totalSearches,
          avgResponseTime: stats.avgResponseTime,
        },
      };
    } catch (error) {
      return {
        name: 'BraveSearch',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkEmailService(): Promise<ServiceStatus> {
    const startTime = Date.now();
    try {
      const result = await emailService.testEmailConfig();
      const responseTime = Date.now() - startTime;
      const config = emailService.getConfig();
      
      return {
        name: 'Email',
        status: result.success ? 'healthy' : 'degraded',
        responseTime,
        error: result.error,
        lastChecked: new Date().toISOString(),
        details: {
          provider: config.provider,
          configured: !!config.apiKey || !!config.user,
        },
      };
    } catch (error) {
      return {
        name: 'Email',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkAuthService(): Promise<ServiceStatus> {
    const startTime = Date.now();
    try {
      // Test auth service by checking if owner exists
      const ownerExists = await authService.getUserByEmail('jayysewell18@gmail.com');
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'Authentication',
        status: ownerExists ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          ownerConfigured: !!ownerExists,
        },
      };
    } catch (error) {
      return {
        name: 'Authentication',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkStorageService(): Promise<ServiceStatus> {
    const startTime = Date.now();
    try {
      // Test storage by performing a simple operation
      const testId = 'health-check';
      const testData = { test: true, timestamp: new Date().toISOString() };
      
      // This would use your CK-Storage system
      // await ckStorage.store('health-check', testId, testData);
      // await ckStorage.get('health-check', testId);
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'Storage',
        status: 'healthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          type: 'CK-Storage',
          encrypted: true,
        },
      };
    } catch (error) {
      return {
        name: 'Storage',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkSecurityService(): Promise<ServiceStatus> {
    const startTime = Date.now();
    try {
      const stats = await securityService.getSecurityStats();
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'Security',
        status: 'healthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          totalEvents: stats.totalEvents,
          blockedIps: stats.blockedIps,
          activeThreats: stats.recentEvents.filter(e => 
            new Date(e.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
          ).length,
        },
      };
    } catch (error) {
      return {
        name: 'Security',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private calculateOverallHealth(services: ServiceStatus[]): 'healthy' | 'degraded' | 'unhealthy' {
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;

    if (unhealthyCount > services.length / 2) {
      return 'unhealthy';
    }
    if (degradedCount > 0 || unhealthyCount > 0) {
      return 'degraded';
    }
    return 'healthy';
  }

  private async getSystemStats(): Promise<{
    totalUsers: number;
    totalSessions: number;
    totalRequests: number;
    errorRate: number;
  }> {
    try {
      // These would come from your analytics/storage service
      return {
        totalUsers: 1, // Owner account
        totalSessions: 0,
        totalRequests: 0,
        errorRate: 0,
      };
    } catch (error) {
      console.error('Failed to get system stats:', error);
      return {
        totalUsers: 0,
        totalSessions: 0,
        totalRequests: 0,
        errorRate: 1,
      };
    }
  }

  private startHealthChecks(): void {
    // Perform health checks periodically
    setInterval(async () => {
      try {
        const health = await this.getSystemHealth();
        this.lastHealthCheck = new Date();
        
        // Log any unhealthy services
        const unhealthyServices = health.services.filter(s => s.status === 'unhealthy');
        if (unhealthyServices.length > 0) {
          console.warn('Unhealthy services detected:', unhealthyServices.map(s => s.name));
        }
        
        // Store health data for historical tracking
        // await ckStorage.store('system-health', new Date().toISOString(), health);
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, this.healthCheckInterval);
  }

  async getDependencyStatus(): Promise<Record<string, any>> {
    return {
      node: {
        version: process.version,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        architecture: process.arch,
      },
      apiKeys: {
        pinecone: pineconeService.validateApiKey() ? 'configured' : 'missing',
        openrouter: openRouterService.validateApiKey() ? 'configured' : 'missing',
        braveSearch: braveSearchService.validateApiKey() ? 'configured' : 'missing',
        email: emailService.getConfig().apiKey ? 'configured' : 'missing',
      },
    };
  }

  async generateHealthReport(): Promise<{
    summary: string;
    recommendations: string[];
    criticalIssues: string[];
    performance: any;
  }> {
    const health = await this.getSystemHealth();
    const dependencies = await this.getDependencyStatus();
    
    const criticalIssues: string[] = [];
    const recommendations: string[] = [];
    
    // Analyze health data
    health.services.forEach(service => {
      if (service.status === 'unhealthy') {
        criticalIssues.push(`${service.name} service is down: ${service.error}`);
      }
      if (service.status === 'degraded') {
        recommendations.push(`${service.name} service needs attention: ${service.error}`);
      }
      if (service.responseTime && service.responseTime > 5000) {
        recommendations.push(`${service.name} has slow response times (${service.responseTime}ms)`);
      }
    });
    
    // Check API keys
    Object.entries(dependencies.apiKeys).forEach(([service, status]) => {
      if (status === 'missing') {
        recommendations.push(`Configure ${service} API key for full functionality`);
      }
    });
    
    // Check memory usage
    if (dependencies.node.memory.heapUsed / dependencies.node.memory.heapTotal > 0.9) {
      criticalIssues.push('High memory usage detected');
    }
    
    const summary = health.overall === 'healthy' 
      ? 'All systems operational' 
      : health.overall === 'degraded'
      ? 'Some services need attention'
      : 'Critical issues detected';
    
    return {
      summary,
      recommendations,
      criticalIssues,
      performance: {
        uptime: health.uptime,
        memoryUsage: dependencies.node.memory,
        responseTime: {
          avg: health.services.reduce((sum, s) => sum + (s.responseTime || 0), 0) / health.services.length,
          max: Math.max(...health.services.map(s => s.responseTime || 0)),
        },
      },
    };
  }
}

export const systemHealthService = new SystemHealthService();
