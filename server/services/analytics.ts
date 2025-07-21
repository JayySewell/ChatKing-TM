import { ckStorage } from '../storage/ck-storage';

interface AnalyticsEvent {
  id: string;
  event: string;
  data: any;
  timestamp: Date;
}

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  avgSessionDuration: number;
  apiUsage: {
    openrouter: number;
    bravesearch: number;
    pinecone: number;
  };
  errorRate: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface UsageStats {
  ai: { requests: number; tokens: number; errors: number };
  web: { searches: number; results: number; errors: number };
  calculator: { calculations: number; errors: number };
  pinecone: { queries: number; upserts: number; errors: number };
}

export class AnalyticsService {
  async getSystemMetrics(days: number = 7): Promise<SystemMetrics> {
    try {
      const stats = await ckStorage.getStorageStats();
      
      // Mock metrics for demonstration
      const metrics: SystemMetrics = {
        totalUsers: stats?.totalUsers || 0,
        activeUsers: Math.floor((stats?.totalUsers || 0) * 0.7),
        totalSessions: stats?.totalChats || 0,
        avgSessionDuration: 15.5, // minutes
        apiUsage: {
          openrouter: 1247,
          bravesearch: 892,
          pinecone: 456
        },
        errorRate: 0.02, // 2%
        systemHealth: 'healthy'
      };

      return metrics;
    } catch (error) {
      console.error('Failed to get system metrics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalSessions: 0,
        avgSessionDuration: 0,
        apiUsage: { openrouter: 0, bravesearch: 0, pinecone: 0 },
        errorRate: 0,
        systemHealth: 'critical'
      };
    }
  }

  async getUsageStats(userId: string, days: number = 30): Promise<UsageStats> {
    try {
      // In a real implementation, this would aggregate actual usage data
      // For now, return mock data based on storage counts
      const stats = await ckStorage.getStorageStats();
      
      const usageStats: UsageStats = {
        ai: {
          requests: stats?.totalChats || 0,
          tokens: (stats?.totalChats || 0) * 150, // Estimated tokens per chat
          errors: Math.floor((stats?.totalChats || 0) * 0.01)
        },
        web: {
          searches: stats?.totalSearches || 0,
          results: (stats?.totalSearches || 0) * 8, // Average results per search
          errors: Math.floor((stats?.totalSearches || 0) * 0.02)
        },
        calculator: {
          calculations: stats?.totalCalculations || 0,
          errors: Math.floor((stats?.totalCalculations || 0) * 0.005)
        },
        pinecone: {
          queries: Math.floor((stats?.totalIndexes || 0) * 25),
          upserts: Math.floor((stats?.totalIndexes || 0) * 50),
          errors: Math.floor((stats?.totalIndexes || 0) * 0.01)
        }
      };

      return usageStats;
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return {
        ai: { requests: 0, tokens: 0, errors: 0 },
        web: { searches: 0, results: 0, errors: 0 },
        calculator: { calculations: 0, errors: 0 },
        pinecone: { queries: 0, upserts: 0, errors: 0 }
      };
    }
  }

  async getRecentActivity(limit: number = 50): Promise<AnalyticsEvent[]> {
    try {
      // Mock recent activity data
      const activities: AnalyticsEvent[] = [
        {
          id: '1',
          event: 'user_login',
          data: { username: 'Owner', timestamp: new Date() },
          timestamp: new Date()
        },
        {
          id: '2',
          event: 'ai_message',
          data: { model: 'deepseek/deepseek-r1', tokens: 156 },
          timestamp: new Date(Date.now() - 300000)
        },
        {
          id: '3',
          event: 'web_search',
          data: { query: 'ChatKing features', results: 8 },
          timestamp: new Date(Date.now() - 600000)
        },
        {
          id: '4',
          event: 'calculation',
          data: { expression: '2^10 + sqrt(144)', result: '1036' },
          timestamp: new Date(Date.now() - 900000)
        },
        {
          id: '5',
          event: 'pinecone_query',
          data: { indexName: 'chatking-knowledge', matches: 5 },
          timestamp: new Date(Date.now() - 1200000)
        }
      ];

      return activities.slice(0, limit);
    } catch (error) {
      console.error('Failed to get recent activity:', error);
      return [];
    }
  }

  async getPerformanceMetrics(): Promise<any> {
    try {
      // Mock performance metrics
      const performance = {
        uptime: '99.8%',
        responseTime: {
          ai: { avg: 1200, p95: 2100, p99: 3500 }, // milliseconds
          web: { avg: 800, p95: 1400, p99: 2200 },
          calculator: { avg: 150, p95: 300, p99: 500 },
          pinecone: { avg: 2000, p95: 3500, p99: 5000 }
        },
        throughput: {
          ai: 45, // requests per minute
          web: 32,
          calculator: 89,
          pinecone: 12
        },
        errorRates: {
          ai: 0.8, // percentage
          web: 1.2,
          calculator: 0.1,
          pinecone: 2.1
        }
      };

      return performance;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return null;
    }
  }

  async getTopQueries(service: string, limit: number = 10): Promise<any[]> {
    try {
      // Mock top queries data
      const mockQueries = {
        ai: [
          { query: 'How does ChatKing work?', count: 45 },
          { query: 'Best AI models for coding', count: 38 },
          { query: 'Vector database concepts', count: 32 },
          { query: 'Cyberpunk UI design', count: 28 },
          { query: 'API integration guide', count: 24 }
        ],
        web: [
          { query: 'OpenRouter API documentation', count: 67 },
          { query: 'Pinecone vector search', count: 54 },
          { query: 'BraveSearch features', count: 43 },
          { query: 'Next.js best practices', count: 39 },
          { query: 'TypeScript tutorial', count: 35 }
        ],
        calculator: [
          { expression: 'sin(π/2)', count: 23 },
          { expression: '2^10', count: 19 },
          { expression: 'log(100)', count: 16 },
          { expression: 'sqrt(144)', count: 14 },
          { expression: 'factorial(5)', count: 12 }
        ]
      };

      const queries = mockQueries[service as keyof typeof mockQueries] || [];
      return queries.slice(0, limit);
    } catch (error) {
      console.error('Failed to get top queries:', error);
      return [];
    }
  }

  async getResourceUsage(): Promise<any> {
    try {
      const stats = await ckStorage.getStorageStats();
      
      const resourceUsage = {
        storage: {
          total: 1024 * 1024 * 1024, // 1GB in bytes
          used: stats?.storageSize || 0,
          breakdown: {
            chats: Math.floor((stats?.storageSize || 0) * 0.4),
            searches: Math.floor((stats?.storageSize || 0) * 0.25),
            calculations: Math.floor((stats?.storageSize || 0) * 0.15),
            indexes: Math.floor((stats?.storageSize || 0) * 0.2)
          }
        },
        memory: {
          used: 245, // MB
          available: 1024,
          peak: 312
        },
        cpu: {
          current: 23, // percentage
          average: 18,
          peak: 67
        },
        network: {
          incoming: 1245, // KB/s
          outgoing: 892,
          total: 2137
        }
      };

      return resourceUsage;
    } catch (error) {
      console.error('Failed to get resource usage:', error);
      return null;
    }
  }

  async generateReport(userId: string, type: 'daily' | 'weekly' | 'monthly'): Promise<any> {
    try {
      // Verify user is owner
      const user = await ckStorage.getUser(userId);
      if (!user?.isOwner) {
        throw new Error('Access denied');
      }

      const days = type === 'daily' ? 1 : type === 'weekly' ? 7 : 30;
      
      const [metrics, usage, performance, resources] = await Promise.all([
        this.getSystemMetrics(days),
        this.getUsageStats(userId, days),
        this.getPerformanceMetrics(),
        this.getResourceUsage()
      ]);

      const report = {
        reportType: type,
        generatedAt: new Date().toISOString(),
        period: {
          start: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
          days
        },
        summary: {
          totalUsers: metrics.totalUsers,
          activeUsers: metrics.activeUsers,
          totalRequests: usage.ai.requests + usage.web.searches + usage.calculator.calculations,
          errorRate: metrics.errorRate,
          systemHealth: metrics.systemHealth
        },
        metrics,
        usage,
        performance,
        resources,
        recommendations: this.generateRecommendations(metrics, usage, performance)
      };

      // Log report generation
      await ckStorage.logAnalytics('report_generated', {
        userId,
        reportType: type,
        timestamp: new Date()
      });

      return report;
    } catch (error) {
      console.error('Failed to generate report:', error);
      return null;
    }
  }

  private generateRecommendations(metrics: SystemMetrics, usage: UsageStats, performance: any): string[] {
    const recommendations: string[] = [];

    if (metrics.errorRate > 0.05) {
      recommendations.push('Consider investigating high error rate across services');
    }

    if (performance?.responseTime?.ai?.avg > 2000) {
      recommendations.push('AI response times are above optimal - consider upgrading OpenRouter plan');
    }

    if (usage.pinecone.errors > usage.pinecone.queries * 0.02) {
      recommendations.push('High Pinecone error rate detected - check API key and index configuration');
    }

    if (metrics.activeUsers / metrics.totalUsers < 0.5) {
      recommendations.push('Low user engagement - consider adding more features or improving onboarding');
    }

    if (recommendations.length === 0) {
      recommendations.push('System is operating optimally - no immediate action required');
    }

    return recommendations;
  }
}

export const analyticsService = new AnalyticsService();
