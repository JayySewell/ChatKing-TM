import { ckStorage } from '../storage/ck-storage';
import { openRouterService } from './openrouter';
import { braveSearchService } from './bravesearch';
import { pineconeService } from './pinecone';

interface ApiKeyConfig {
  id: string;
  name: string;
  service: 'openrouter' | 'bravesearch' | 'pinecone';
  key: string;
  isActive: boolean;
  lastUsed?: Date;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ApiKeyManager {
  private defaultKeys = {
    openrouter: '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',
    bravesearch: 'BSAjvpAPq4Pz7lbp6px2jI4aXacwkI6',
    pinecone: 'pcsk_6DAaeQ_NHpbyRENkVBaBwwkrV2Hf9mzDyXKvWdnxGsg2WVmMBZcmv2QjMKR3xKP7EbrtnA'
  };

  async getApiKeys(userId: string): Promise<ApiKeyConfig[]> {
    try {
      // In a real implementation, this would fetch from secure storage
      // For now, return the default configuration
      return [
        {
          id: 'openrouter-1',
          name: 'OpenRouter AI',
          service: 'openrouter',
          key: this.maskKey(this.defaultKeys.openrouter),
          isActive: true,
          lastUsed: new Date(),
          usageCount: 156,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        },
        {
          id: 'bravesearch-1',
          name: 'BraveSearch API',
          service: 'bravesearch',
          key: this.maskKey(this.defaultKeys.bravesearch),
          isActive: true,
          lastUsed: new Date(),
          usageCount: 89,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        },
        {
          id: 'pinecone-1',
          name: 'Pinecone Vector DB',
          service: 'pinecone',
          key: this.maskKey(this.defaultKeys.pinecone),
          isActive: true,
          lastUsed: new Date(),
          usageCount: 42,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        }
      ];
    } catch (error) {
      console.error('Failed to get API keys:', error);
      return [];
    }
  }

  async updateApiKey(userId: string, keyId: string, newKey: string): Promise<boolean> {
    try {
      // Verify user is owner
      const user = await ckStorage.getUser(userId);
      if (!user?.isOwner) {
        throw new Error('Access denied: Only owners can update API keys');
      }

      // Validate the new key format
      const keyConfig = await this.getApiKeyById(keyId);
      if (!keyConfig) {
        throw new Error('API key configuration not found');
      }

      const isValid = this.validateApiKey(keyConfig.service, newKey);
      if (!isValid) {
        throw new Error('Invalid API key format');
      }

      // Update the service with new key
      switch (keyConfig.service) {
        case 'openrouter':
          openRouterService.updateApiKey(newKey);
          break;
        case 'bravesearch':
          braveSearchService.updateApiKey(newKey);
          break;
        case 'pinecone':
          pineconeService.updateApiKey(newKey);
          break;
      }

      // Log the update
      await ckStorage.logAnalytics('api_key_updated', {
        userId,
        service: keyConfig.service,
        keyId,
        timestamp: new Date()
      });

      return true;
    } catch (error) {
      console.error('Failed to update API key:', error);
      return false;
    }
  }

  async testApiKey(service: string, key: string): Promise<boolean> {
    try {
      switch (service) {
        case 'openrouter':
          return openRouterService.validateApiKey();
        case 'bravesearch':
          return braveSearchService.validateApiKey();
        case 'pinecone':
          return pineconeService.validateApiKey();
        default:
          return false;
      }
    } catch (error) {
      console.error('API key test failed:', error);
      return false;
    }
  }

  async getApiKeyUsage(userId: string, keyId: string, days: number = 30): Promise<any> {
    try {
      // In a real implementation, this would fetch usage analytics
      // For now, return mock usage data
      const mockUsage = Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requests: Math.floor(Math.random() * 100),
        tokens: Math.floor(Math.random() * 10000),
        errors: Math.floor(Math.random() * 5)
      })).reverse();

      return {
        totalRequests: mockUsage.reduce((sum, day) => sum + day.requests, 0),
        totalTokens: mockUsage.reduce((sum, day) => sum + day.tokens, 0),
        totalErrors: mockUsage.reduce((sum, day) => sum + day.errors, 0),
        dailyUsage: mockUsage
      };
    } catch (error) {
      console.error('Failed to get API key usage:', error);
      return null;
    }
  }

  async rotateApiKey(userId: string, keyId: string): Promise<string | null> {
    try {
      // Verify user is owner
      const user = await ckStorage.getUser(userId);
      if (!user?.isOwner) {
        throw new Error('Access denied');
      }

      // In a real implementation, this would generate/request a new key
      // For now, return a mock new key
      const keyConfig = await this.getApiKeyById(keyId);
      if (!keyConfig) {
        return null;
      }

      const newKey = this.generateMockKey(keyConfig.service);
      const updated = await this.updateApiKey(userId, keyId, newKey);
      
      if (updated) {
        await ckStorage.logAnalytics('api_key_rotated', {
          userId,
          service: keyConfig.service,
          keyId,
          timestamp: new Date()
        });
        
        return this.maskKey(newKey);
      }

      return null;
    } catch (error) {
      console.error('Failed to rotate API key:', error);
      return null;
    }
  }

  private async getApiKeyById(keyId: string): Promise<ApiKeyConfig | null> {
    // Mock implementation - in real app, fetch from secure storage
    const allKeys = await this.getApiKeys('demo-user');
    return allKeys.find(key => key.id === keyId) || null;
  }

  private validateApiKey(service: string, key: string): boolean {
    switch (service) {
      case 'openrouter':
        return key.startsWith('sk-or-v1-') && key.length > 20;
      case 'bravesearch':
        return key.length > 10 && !key.includes(' ');
      case 'pinecone':
        return key.startsWith('pcsk_') && key.length > 20;
      default:
        return false;
    }
  }

  private maskKey(key: string): string {
    if (key.length <= 8) return key;
    const start = key.substring(0, 8);
    const end = key.substring(key.length - 6);
    return `${start}...${end}`;
  }

  private generateMockKey(service: string): string {
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    
    switch (service) {
      case 'openrouter':
        return `sk-or-v1-${randomSuffix}${randomSuffix}`;
      case 'bravesearch':
        return `BSA${randomSuffix}${randomSuffix.toUpperCase()}`;
      case 'pinecone':
        return `pcsk_${randomSuffix}${randomSuffix.toUpperCase()}`;
      default:
        return randomSuffix;
    }
  }

  async getSystemApiHealth(): Promise<any> {
    try {
      const services = ['openrouter', 'bravesearch', 'pinecone'];
      const healthStatus = await Promise.all(
        services.map(async (service) => {
          const isHealthy = await this.testApiKey(service, '');
          return {
            service,
            status: isHealthy ? 'healthy' : 'degraded',
            lastCheck: new Date().toISOString()
          };
        })
      );

      return {
        overall: healthStatus.every(s => s.status === 'healthy') ? 'healthy' : 'degraded',
        services: healthStatus,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get system API health:', error);
      return {
        overall: 'unknown',
        services: [],
        lastUpdate: new Date().toISOString()
      };
    }
  }
}

export const apiKeyManager = new ApiKeyManager();
