import { ckStorage } from "./ck-storage";
import crypto from "crypto";
import { join } from "path";
import fs from "fs/promises";

interface SecurityEvent {
  id: string;
  type: 'suspicious_activity' | 'brute_force' | 'unauthorized_access' | 'malicious_request' | 'ddos_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent: string;
  endpoint: string;
  payload?: any;
  timestamp: string;
  isBlocked: boolean;
}

interface IpInfo {
  ip: string;
  attempts: number;
  lastAttempt: string;
  isBlocked: boolean;
  blockReason?: string;
  firstSeen: string;
  country?: string;
  isTor?: boolean;
  isVpn?: boolean;
}

interface LoginAttempt {
  ip: string;
  timestamp: string;
  success: boolean;
  username?: string;
}

interface ApiKeyConfig {
  name: string;
  key: string;
  environment?: string;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

// Extend the existing CK-Storage class with new security and API key features
export class CKStorageExtended {
  private basePath = "./ck-data";

  // Generic storage methods
  async store(category: string, id: string, data: any): Promise<boolean> {
    try {
      const categoryPath = join(this.basePath, category);
      await fs.mkdir(categoryPath, { recursive: true });
      const filePath = join(categoryPath, `${id}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to store data:', error);
      return false;
    }
  }

  async get(category: string, id: string): Promise<any> {
    try {
      const filePath = join(this.basePath, category, `${id}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // File doesn't exist or parsing error
      return null;
    }
  }

  async list(category: string): Promise<any[]> {
    try {
      const categoryPath = join(this.basePath, category);
      const files = await fs.readdir(categoryPath);
      const results = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await this.get(category, file.replace('.json', ''));
          if (data) {
            results.push(data);
          }
        }
      }

      return results;
    } catch (error) {
      // Directory doesn't exist
      return [];
    }
  }

  async delete(category: string, id: string): Promise<boolean> {
    try {
      const filePath = join(this.basePath, category, `${id}.json`);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Failed to delete data:', error);
      return false;
    }
  }
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    await this.store('security/events', event.id, event);
  }

  async getSecurityEvents(limit: number = 1000): Promise<SecurityEvent[]> {
    const events = await this.list('security/events');
    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async blockIp(ip: string, info: IpInfo): Promise<void> {
    await this.store('security/blocked-ips', ip, info);
  }

  async unblockIp(ip: string): Promise<void> {
    const info = await this.get('security/blocked-ips', ip);
    if (info) {
      info.isBlocked = false;
      await this.store('security/blocked-ips', ip, info);
    }
  }

  async getBlockedIps(): Promise<IpInfo[]> {
    const allIps = await this.list('security/blocked-ips');
    return allIps.filter(ip => ip.isBlocked);
  }

  async recordLoginAttempt(attempt: LoginAttempt): Promise<void> {
    const id = crypto.randomUUID();
    await this.store('security/login-attempts', id, attempt);
  }

  async getLoginAttempts(ip: string, hours: number = 24): Promise<LoginAttempt[]> {
    const allAttempts = await ckStorage.list('security/login-attempts');
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    
    return allAttempts.filter(attempt => 
      attempt.ip === ip && 
      new Date(attempt.timestamp).getTime() > cutoff
    );
  }

  async storeApiKey(userId: string, service: string, config: ApiKeyConfig): Promise<boolean> {
    try {
      return await this.store(`users/${userId}/api-keys`, service, config);
    } catch (error) {
      console.error('Failed to store API key:', error);
      return false;
    }
  }

  async getApiKey(userId: string, service: string): Promise<ApiKeyConfig | null> {
    try {
      return await this.get(`users/${userId}/api-keys`, service);
    } catch (error) {
      console.error('Failed to get API key:', error);
      return null;
    }
  }

  async getAllApiKeys(userId: string): Promise<Record<string, ApiKeyConfig>> {
    try {
      const keys = await this.list(`users/${userId}/api-keys`);
      const result: Record<string, ApiKeyConfig> = {};

      for (const key of keys) {
        // Assuming the key object has a service property or derive from file name
        const service = key.service || 'unknown';
        result[service] = key;
      }

      return result;
    } catch (error) {
      console.error('Failed to get all API keys:', error);
      return {};
    }
  }

  async deleteApiKey(userId: string, service: string): Promise<boolean> {
    try {
      return await this.delete(`users/${userId}/api-keys`, service);
    } catch (error) {
      console.error('Failed to delete API key:', error);
      return false;
    }
  }

  async storeEnvironmentVariables(variables: Record<string, any>): Promise<void> {
    await this.store('system', 'environment-variables', {
      variables,
      updatedAt: new Date().toISOString(),
    });
  }

  async getEnvironmentVariables(): Promise<Record<string, any>> {
    try {
      const data = await ckStorage.get('system', 'environment-variables');
      return data?.variables || {};
    } catch (error) {
      console.error('Failed to get environment variables:', error);
      return {};
    }
  }

  async storeSecurityConfig(config: any): Promise<void> {
    return ckStorage.store('system', 'security-config', {
      config,
      updatedAt: new Date().toISOString(),
    });
  }

  async getSecurityConfig(): Promise<any> {
    try {
      const data = await ckStorage.get('system', 'security-config');
      return data?.config || null;
    } catch (error) {
      console.error('Failed to get security config:', error);
      return null;
    }
  }

  async getUserPineconeIndexes(userId: string): Promise<Array<{ id: string; name: string; vectors: any[]; createdAt: string; updatedAt: string }>> {
    try {
      const indexes = await ckStorage.list(`users/${userId}/pinecone-indexes`);
      return indexes || [];
    } catch (error) {
      console.error('Failed to get user Pinecone indexes:', error);
      return [];
    }
  }

  async createPineconeIndex(userId: string, indexName: string): Promise<void> {
    const indexData = {
      id: crypto.randomUUID(),
      name: indexName,
      vectors: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return ckStorage.store(`users/${userId}/pinecone-indexes`, indexName, indexData);
  }

  async deletePineconeIndex(userId: string, indexName: string): Promise<boolean> {
    try {
      return ckStorage.delete(`users/${userId}/pinecone-indexes`, indexName);
    } catch (error) {
      console.error('Failed to delete Pinecone index:', error);
      return false;
    }
  }

  async storePineconeVector(userId: string, indexName: string, vectorId: string, vector: any): Promise<void> {
    return ckStorage.store(`users/${userId}/pinecone-vectors/${indexName}`, vectorId, {
      ...vector,
      storedAt: new Date().toISOString(),
    });
  }

  async getPineconeVectors(userId: string, indexName: string): Promise<any[]> {
    try {
      return await ckStorage.list(`users/${userId}/pinecone-vectors/${indexName}`);
    } catch (error) {
      console.error('Failed to get Pinecone vectors:', error);
      return [];
    }
  }

  async deletePineconeVector(userId: string, indexName: string, vectorId: string): Promise<boolean> {
    try {
      return ckStorage.delete(`users/${userId}/pinecone-vectors/${indexName}`, vectorId);
    } catch (error) {
      console.error('Failed to delete Pinecone vector:', error);
      return false;
    }
  }

  async storeEmailVerificationToken(email: string, token: string, expiresAt: Date): Promise<void> {
    const tokenData = {
      email,
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      verified: false,
    };
    
    return ckStorage.store('email-verification', token, tokenData);
  }

  async getEmailVerificationToken(token: string): Promise<any> {
    try {
      return await ckStorage.get('email-verification', token);
    } catch (error) {
      console.error('Failed to get email verification token:', error);
      return null;
    }
  }

  async markEmailAsVerified(token: string): Promise<boolean> {
    try {
      const tokenData = await this.getEmailVerificationToken(token);
      if (tokenData && new Date(tokenData.expiresAt) > new Date()) {
        tokenData.verified = true;
        tokenData.verifiedAt = new Date().toISOString();
        await ckStorage.store('email-verification', token, tokenData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to mark email as verified:', error);
      return false;
    }
  }

  async storePasswordResetToken(email: string, token: string, expiresAt: Date): Promise<void> {
    const resetData = {
      email,
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      used: false,
    };
    
    return ckStorage.store('password-reset', token, resetData);
  }

  async getPasswordResetToken(token: string): Promise<any> {
    try {
      return await ckStorage.get('password-reset', token);
    } catch (error) {
      console.error('Failed to get password reset token:', error);
      return null;
    }
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<boolean> {
    try {
      const resetData = await this.getPasswordResetToken(token);
      if (resetData && new Date(resetData.expiresAt) > new Date() && !resetData.used) {
        resetData.used = true;
        resetData.usedAt = new Date().toISOString();
        await ckStorage.store('password-reset', token, resetData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to mark password reset token as used:', error);
      return false;
    }
  }

  async storeSystemBackup(backupId: string, data: any): Promise<void> {
    return ckStorage.store('system/backups', backupId, {
      ...data,
      createdAt: new Date().toISOString(),
    });
  }

  async getSystemBackups(): Promise<any[]> {
    try {
      return await ckStorage.list('system/backups');
    } catch (error) {
      console.error('Failed to get system backups:', error);
      return [];
    }
  }

  async cleanupOldData(days: number = 30): Promise<void> {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    // Clean up old security events
    const events = await this.getSecurityEvents();
    for (const event of events) {
      if (new Date(event.timestamp).getTime() < cutoff) {
        await ckStorage.delete('security/events', event.id);
      }
    }

    // Clean up old login attempts
    const attempts = await ckStorage.list('security/login-attempts');
    for (const attempt of attempts) {
      if (new Date(attempt.timestamp).getTime() < cutoff) {
        await ckStorage.delete('security/login-attempts', attempt.id);
      }
    }

    // Clean up expired verification tokens
    const verificationTokens = await ckStorage.list('email-verification');
    for (const token of verificationTokens) {
      if (new Date(token.expiresAt).getTime() < Date.now()) {
        await ckStorage.delete('email-verification', token.token);
      }
    }

    // Clean up expired password reset tokens
    const resetTokens = await ckStorage.list('password-reset');
    for (const token of resetTokens) {
      if (new Date(token.expiresAt).getTime() < Date.now()) {
        await ckStorage.delete('password-reset', token.token);
      }
    }
  }
}

export const ckStorageExtended = new CKStorageExtended();
