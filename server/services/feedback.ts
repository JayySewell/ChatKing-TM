import { ckStorage } from "../storage/ck-storage";
import { enhancedAuthService } from "./auth-enhanced";
import { contentFilterService } from "./content-filter";

export interface FeedbackEntry {
  id: string;
  userId: string;
  type: 'bug' | 'feature' | 'improvement' | 'complaint' | 'compliment' | 'other';
  category: 'ai' | 'web' | 'calculator' | 'pinecone' | 'auth' | 'ui' | 'performance' | 'security' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  reproductionSteps?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  browserInfo?: string;
  deviceInfo?: string;
  attachments?: string[];
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'duplicate';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  tags: string[];
  rating?: number; // 1-5 stars for satisfaction ratings
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  adminNotes?: string;
  userResponse?: string;
  votes: {
    upvotes: number;
    downvotes: number;
    voterIds: string[];
  };
}

export interface SystemLog {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  service: string;
  userId?: string;
  sessionId?: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  metadata: Record<string, any>;
}

export interface AdminAction {
  id: string;
  adminId: string;
  action: string;
  targetType: 'user' | 'feedback' | 'system' | 'content';
  targetId: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

export interface FeedbackStats {
  totalFeedback: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  averageRating: number;
  resolutionTime: {
    average: number;
    median: number;
    fastest: number;
    slowest: number;
  };
  userSatisfaction: number;
  trendsOverTime: Array<{
    date: string;
    count: number;
    rating: number;
  }>;
}

export class FeedbackService {
  async submitFeedback(feedbackData: Omit<FeedbackEntry, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'votes'>): Promise<string> {
    try {
      // Content filtering for feedback
      const contentAnalysis = await contentFilterService.analyzeContent(
        `${feedbackData.title} ${feedbackData.description}`,
        feedbackData.userId
      );

      if (!contentAnalysis.isAllowed) {
        throw new Error('Feedback contains inappropriate content');
      }

      const feedbackId = crypto.randomUUID();
      const feedback: FeedbackEntry = {
        ...feedbackData,
        id: feedbackId,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        votes: {
          upvotes: 0,
          downvotes: 0,
          voterIds: [],
        },
      };

      // Store feedback
      const filePath = `feedback/${feedbackId}.json`;
      await ckStorage.writeFile(filePath, feedback);

      // Log the submission
      await this.logSystemEvent('info', 'feedback', feedbackData.userId, 'feedback_submitted', {
        feedbackId,
        type: feedbackData.type,
        category: feedbackData.category,
        severity: feedbackData.severity,
      });

      // Notify admins for critical issues
      if (feedbackData.severity === 'critical') {
        await this.notifyAdminsOfCriticalFeedback(feedback);
      }

      // Update user stats
      await enhancedAuthService.updateStats(feedbackData.userId, 'feedback' as any);

      return feedbackId;
    } catch (error) {
      await this.logSystemEvent('error', 'feedback', feedbackData.userId, 'feedback_submission_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        feedbackData: { ...feedbackData, description: feedbackData.description.substring(0, 100) },
      });
      throw error;
    }
  }

  async getFeedback(feedbackId: string): Promise<FeedbackEntry | null> {
    try {
      const filePath = `feedback/${feedbackId}.json`;
      return await ckStorage.readFile<FeedbackEntry>(filePath);
    } catch (error) {
      return null;
    }
  }

  async getUserFeedback(userId: string, limit = 50): Promise<FeedbackEntry[]> {
    try {
      const allFeedback = await this.getAllFeedback();
      return allFeedback
        .filter(feedback => feedback.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get user feedback:', error);
      return [];
    }
  }

  async getAllFeedback(filters: {
    status?: string;
    type?: string;
    category?: string;
    severity?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<FeedbackEntry[]> {
    try {
      // This is a simplified implementation - in production, you'd want proper pagination
      const feedbackFiles = await ckStorage.listFiles('feedback/');
      const feedback: FeedbackEntry[] = [];

      for (const file of feedbackFiles) {
        if (file.endsWith('.json')) {
          const feedbackEntry = await ckStorage.readFile<FeedbackEntry>(file);
          if (feedbackEntry) {
            feedback.push(feedbackEntry);
          }
        }
      }

      // Apply filters
      let filteredFeedback = feedback;
      
      if (filters.status) {
        filteredFeedback = filteredFeedback.filter(f => f.status === filters.status);
      }
      if (filters.type) {
        filteredFeedback = filteredFeedback.filter(f => f.type === filters.type);
      }
      if (filters.category) {
        filteredFeedback = filteredFeedback.filter(f => f.category === filters.category);
      }
      if (filters.severity) {
        filteredFeedback = filteredFeedback.filter(f => f.severity === filters.severity);
      }

      // Sort by creation date (newest first)
      filteredFeedback.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply pagination
      const offset = filters.offset || 0;
      const limit = filters.limit || 100;
      
      return filteredFeedback.slice(offset, offset + limit);
    } catch (error) {
      console.error('Failed to get all feedback:', error);
      return [];
    }
  }

  async updateFeedbackStatus(
    feedbackId: string,
    status: FeedbackEntry['status'],
    adminId: string,
    adminNotes?: string
  ): Promise<boolean> {
    try {
      const feedback = await this.getFeedback(feedbackId);
      if (!feedback) {
        return false;
      }

      const updatedFeedback: FeedbackEntry = {
        ...feedback,
        status,
        updatedAt: new Date(),
        resolvedAt: status === 'resolved' || status === 'closed' ? new Date() : feedback.resolvedAt,
        adminNotes: adminNotes || feedback.adminNotes,
      };

      const filePath = `feedback/${feedbackId}.json`;
      await ckStorage.writeFile(filePath, updatedFeedback);

      // Log admin action
      await this.logAdminAction(adminId, 'update_feedback_status', 'feedback', feedbackId, {
        oldStatus: feedback.status,
        newStatus: status,
        adminNotes,
      });

      // Notify user if feedback is resolved
      if (status === 'resolved') {
        await this.notifyUserOfResolution(feedback);
      }

      return true;
    } catch (error) {
      console.error('Failed to update feedback status:', error);
      return false;
    }
  }

  async voteFeedback(feedbackId: string, userId: string, vote: 'up' | 'down'): Promise<boolean> {
    try {
      const feedback = await this.getFeedback(feedbackId);
      if (!feedback) {
        return false;
      }

      // Check if user already voted
      if (feedback.votes.voterIds.includes(userId)) {
        return false; // User already voted
      }

      const updatedFeedback: FeedbackEntry = {
        ...feedback,
        votes: {
          upvotes: feedback.votes.upvotes + (vote === 'up' ? 1 : 0),
          downvotes: feedback.votes.downvotes + (vote === 'down' ? 1 : 0),
          voterIds: [...feedback.votes.voterIds, userId],
        },
        updatedAt: new Date(),
      };

      const filePath = `feedback/${feedbackId}.json`;
      await ckStorage.writeFile(filePath, updatedFeedback);

      await this.logSystemEvent('info', 'feedback', userId, 'feedback_voted', {
        feedbackId,
        vote,
      });

      return true;
    } catch (error) {
      console.error('Failed to vote on feedback:', error);
      return false;
    }
  }

  async getFeedbackStats(timeRange: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<FeedbackStats> {
    try {
      const allFeedback = await this.getAllFeedback();
      
      // Calculate time range
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      const filteredFeedback = allFeedback.filter(
        feedback => new Date(feedback.createdAt) >= startDate
      );

      // Calculate stats
      const stats: FeedbackStats = {
        totalFeedback: filteredFeedback.length,
        byType: {},
        byCategory: {},
        bySeverity: {},
        byStatus: {},
        averageRating: 0,
        resolutionTime: {
          average: 0,
          median: 0,
          fastest: 0,
          slowest: 0,
        },
        userSatisfaction: 0,
        trendsOverTime: [],
      };

      // Count by type, category, severity, status
      filteredFeedback.forEach(feedback => {
        stats.byType[feedback.type] = (stats.byType[feedback.type] || 0) + 1;
        stats.byCategory[feedback.category] = (stats.byCategory[feedback.category] || 0) + 1;
        stats.bySeverity[feedback.severity] = (stats.bySeverity[feedback.severity] || 0) + 1;
        stats.byStatus[feedback.status] = (stats.byStatus[feedback.status] || 0) + 1;
      });

      // Calculate average rating
      const ratedFeedback = filteredFeedback.filter(f => f.rating !== undefined);
      if (ratedFeedback.length > 0) {
        stats.averageRating = ratedFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / ratedFeedback.length;
      }

      // Calculate resolution time stats
      const resolvedFeedback = filteredFeedback.filter(f => f.resolvedAt);
      if (resolvedFeedback.length > 0) {
        const resolutionTimes = resolvedFeedback.map(f => {
          const created = new Date(f.createdAt).getTime();
          const resolved = new Date(f.resolvedAt!).getTime();
          return resolved - created;
        });

        stats.resolutionTime.average = resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;
        stats.resolutionTime.median = resolutionTimes.sort((a, b) => a - b)[Math.floor(resolutionTimes.length / 2)];
        stats.resolutionTime.fastest = Math.min(...resolutionTimes);
        stats.resolutionTime.slowest = Math.max(...resolutionTimes);
      }

      // Calculate user satisfaction (percentage of positive feedback)
      const satisfactionFeedback = filteredFeedback.filter(f => f.type === 'compliment' || (f.rating && f.rating >= 4));
      stats.userSatisfaction = filteredFeedback.length > 0 ? (satisfactionFeedback.length / filteredFeedback.length) * 100 : 0;

      return stats;
    } catch (error) {
      console.error('Failed to calculate feedback stats:', error);
      throw error;
    }
  }

  async logSystemEvent(
    level: SystemLog['level'],
    service: string,
    userId: string | undefined,
    action: string,
    details: Record<string, any>,
    options: {
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      duration?: number;
      error?: Error;
    } = {}
  ): Promise<void> {
    try {
      const logEntry: SystemLog = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        level,
        service,
        userId,
        sessionId: options.sessionId,
        action,
        details,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        duration: options.duration,
        error: options.error ? {
          message: options.error.message,
          stack: options.error.stack,
          code: (options.error as any).code,
        } : undefined,
        metadata: {
          environment: process.env.NODE_ENV || 'development',
          timestamp: Date.now(),
        },
      };

      // Store log entry
      const date = logEntry.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
      const filePath = `logs/${date}/${level}/${logEntry.id}.json`;
      await ckStorage.writeFile(filePath, logEntry);

      // Also store in general logs for easy access
      await ckStorage.logAnalytics(`${service}_${action}`, {
        ...details,
        level,
        userId,
        timestamp: logEntry.timestamp.toISOString(),
      });

      // Console logging for development
      if (process.env.NODE_ENV === 'development') {
        const logMethod = level === 'error' || level === 'critical' ? console.error : 
                         level === 'warn' ? console.warn : console.log;
        logMethod(`[${level.toUpperCase()}] ${service}: ${action}`, details);
      }
    } catch (error) {
      console.error('Failed to log system event:', error);
    }
  }

  async logAdminAction(
    adminId: string,
    action: string,
    targetType: AdminAction['targetType'],
    targetId: string,
    details: Record<string, any>,
    ipAddress = '',
    userAgent = ''
  ): Promise<void> {
    try {
      const adminAction: AdminAction = {
        id: crypto.randomUUID(),
        adminId,
        action,
        targetType,
        targetId,
        details,
        timestamp: new Date(),
        ipAddress,
        userAgent,
      };

      const filePath = `admin-actions/${adminAction.id}.json`;
      await ckStorage.writeFile(filePath, adminAction);

      await this.logSystemEvent('info', 'admin', adminId, action, {
        targetType,
        targetId,
        ...details,
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  async getSystemLogs(filters: {
    level?: string;
    service?: string;
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<SystemLog[]> {
    try {
      // This is a simplified implementation - in production, you'd want proper indexing
      const limit = filters.limit || 100;
      const logs: SystemLog[] = [];

      // Get recent log files
      const logFiles = await ckStorage.listFiles('logs/');
      
      for (const file of logFiles.slice(-limit)) {
        if (file.endsWith('.json')) {
          const log = await ckStorage.readFile<SystemLog>(file);
          if (log) {
            logs.push(log);
          }
        }
      }

      // Apply filters
      let filteredLogs = logs;

      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level);
      }
      if (filters.service) {
        filteredLogs = filteredLogs.filter(log => log.service === filters.service);
      }
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => log.action.includes(filters.action));
      }
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= filters.endDate!);
      }

      // Sort by timestamp (newest first)
      filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return filteredLogs.slice(0, limit);
    } catch (error) {
      console.error('Failed to get system logs:', error);
      return [];
    }
  }

  async getAdminActions(adminId?: string, limit = 50): Promise<AdminAction[]> {
    try {
      const actionFiles = await ckStorage.listFiles('admin-actions/');
      const actions: AdminAction[] = [];

      for (const file of actionFiles) {
        if (file.endsWith('.json')) {
          const action = await ckStorage.readFile<AdminAction>(file);
          if (action) {
            if (!adminId || action.adminId === adminId) {
              actions.push(action);
            }
          }
        }
      }

      return actions
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get admin actions:', error);
      return [];
    }
  }

  private async notifyAdminsOfCriticalFeedback(feedback: FeedbackEntry): Promise<void> {
    // In a real implementation, this would send notifications to admins
    await this.logSystemEvent('critical', 'feedback', feedback.userId, 'critical_feedback_submitted', {
      feedbackId: feedback.id,
      title: feedback.title,
      category: feedback.category,
    });
  }

  private async notifyUserOfResolution(feedback: FeedbackEntry): Promise<void> {
    // In a real implementation, this would send a notification to the user
    await this.logSystemEvent('info', 'feedback', feedback.userId, 'feedback_resolved_notification', {
      feedbackId: feedback.id,
    });
  }
}

export const feedbackService = new FeedbackService();
