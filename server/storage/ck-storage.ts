import { promises as fs } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

interface StorageOptions {
  encrypt?: boolean;
  compression?: boolean;
}

interface UserData {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  isOwner: boolean;
  createdAt: Date;
  lastLogin: Date;
  settings: Record<string, any>;
}

interface ChatSession {
  id: string;
  userId: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    model?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface SearchHistory {
  id: string;
  userId: string;
  query: string;
  results: any[];
  timestamp: Date;
}

interface CalculatorLog {
  id: string;
  userId: string;
  expression: string;
  result: string;
  timestamp: Date;
}

interface PineconeIndex {
  id: string;
  userId: string;
  name: string;
  vectors: Array<{
    id: string;
    vector: number[];
    metadata: Record<string, any>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export class CKStorage {
  private basePath: string;
  private encryptionKey: string;

  constructor(basePath: string = './ck-data') {
    this.basePath = basePath;
    this.encryptionKey = process.env.CK_ENCRYPTION_KEY || 'default-key-change-in-production';
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
      await fs.mkdir(join(this.basePath, 'users'), { recursive: true });
      await fs.mkdir(join(this.basePath, 'chats'), { recursive: true });
      await fs.mkdir(join(this.basePath, 'search'), { recursive: true });
      await fs.mkdir(join(this.basePath, 'calculator'), { recursive: true });
      await fs.mkdir(join(this.basePath, 'pinecone'), { recursive: true });
      await fs.mkdir(join(this.basePath, 'analytics'), { recursive: true });
    } catch (error) {
      console.error('Failed to initialize CK-Storage:', error);
    }
  }

  private encrypt(data: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decrypt(encryptedData: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private async writeFile(filePath: string, data: any, options: StorageOptions = {}): Promise<void> {
    let content = JSON.stringify(data, null, 2);
    
    if (options.encrypt) {
      content = this.encrypt(content);
    }

    await fs.writeFile(filePath, content, 'utf8');
  }

  private async readFile<T>(filePath: string, options: StorageOptions = {}): Promise<T | null> {
    try {
      let content = await fs.readFile(filePath, 'utf8');
      
      if (options.encrypt) {
        content = this.decrypt(content);
      }

      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  // User Management
  async createUser(userData: Omit<UserData, 'id' | 'createdAt' | 'lastLogin'>): Promise<UserData> {
    const user: UserData = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    const filePath = join(this.basePath, 'users', `${user.id}.json`);
    await this.writeFile(filePath, user, { encrypt: true });
    
    return user;
  }

  async getUser(userId: string): Promise<UserData | null> {
    const filePath = join(this.basePath, 'users', `${userId}.json`);
    return this.readFile<UserData>(filePath, { encrypt: true });
  }

  async getUserByEmail(email: string): Promise<UserData | null> {
    try {
      const usersDir = join(this.basePath, 'users');
      const files = await fs.readdir(usersDir);
      
      for (const file of files) {
        const user = await this.readFile<UserData>(join(usersDir, file), { encrypt: true });
        if (user && user.email === email) {
          return user;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<UserData>): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const updatedUser = { ...user, ...updates };
    const filePath = join(this.basePath, 'users', `${userId}.json`);
    await this.writeFile(filePath, updatedUser, { encrypt: true });
    
    return true;
  }

  // Chat Management
  async createChatSession(userId: string): Promise<ChatSession> {
    const session: ChatSession = {
      id: crypto.randomUUID(),
      userId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const filePath = join(this.basePath, 'chats', `${session.id}.json`);
    await this.writeFile(filePath, session, { encrypt: true });
    
    return session;
  }

  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    const filePath = join(this.basePath, 'chats', `${sessionId}.json`);
    return this.readFile<ChatSession>(filePath, { encrypt: true });
  }

  async getUserChatSessions(userId: string): Promise<ChatSession[]> {
    try {
      const chatsDir = join(this.basePath, 'chats');
      const files = await fs.readdir(chatsDir);
      const sessions: ChatSession[] = [];
      
      for (const file of files) {
        const session = await this.readFile<ChatSession>(join(chatsDir, file), { encrypt: true });
        if (session && session.userId === userId) {
          sessions.push(session);
        }
      }
      
      return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (error) {
      return [];
    }
  }

  async addMessageToSession(sessionId: string, message: ChatSession['messages'][0]): Promise<boolean> {
    const session = await this.getChatSession(sessionId);
    if (!session) return false;

    session.messages.push(message);
    session.updatedAt = new Date();

    const filePath = join(this.basePath, 'chats', `${sessionId}.json`);
    await this.writeFile(filePath, session, { encrypt: true });
    
    return true;
  }

  // Search History
  async addSearchHistory(userId: string, query: string, results: any[]): Promise<void> {
    const search: SearchHistory = {
      id: crypto.randomUUID(),
      userId,
      query,
      results,
      timestamp: new Date(),
    };

    const filePath = join(this.basePath, 'search', `${search.id}.json`);
    await this.writeFile(filePath, search, { encrypt: true });
  }

  async getUserSearchHistory(userId: string, limit: number = 50): Promise<SearchHistory[]> {
    try {
      const searchDir = join(this.basePath, 'search');
      const files = await fs.readdir(searchDir);
      const history: SearchHistory[] = [];
      
      for (const file of files) {
        const search = await this.readFile<SearchHistory>(join(searchDir, file), { encrypt: true });
        if (search && search.userId === userId) {
          history.push(search);
        }
      }
      
      return history
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  // Calculator Logs
  async addCalculatorLog(userId: string, expression: string, result: string): Promise<void> {
    const log: CalculatorLog = {
      id: crypto.randomUUID(),
      userId,
      expression,
      result,
      timestamp: new Date(),
    };

    const filePath = join(this.basePath, 'calculator', `${log.id}.json`);
    await this.writeFile(filePath, log, { encrypt: true });
  }

  async getUserCalculatorLogs(userId: string, limit: number = 100): Promise<CalculatorLog[]> {
    try {
      const calcDir = join(this.basePath, 'calculator');
      const files = await fs.readdir(calcDir);
      const logs: CalculatorLog[] = [];
      
      for (const file of files) {
        const log = await this.readFile<CalculatorLog>(join(calcDir, file), { encrypt: true });
        if (log && log.userId === userId) {
          logs.push(log);
        }
      }
      
      return logs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  // Pinecone Index Management
  async createPineconeIndex(userId: string, name: string): Promise<PineconeIndex> {
    const index: PineconeIndex = {
      id: crypto.randomUUID(),
      userId,
      name,
      vectors: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const filePath = join(this.basePath, 'pinecone', `${index.id}.json`);
    await this.writeFile(filePath, index, { encrypt: true });
    
    return index;
  }

  async getPineconeIndex(indexId: string): Promise<PineconeIndex | null> {
    const filePath = join(this.basePath, 'pinecone', `${indexId}.json`);
    return this.readFile<PineconeIndex>(filePath, { encrypt: true });
  }

  async getUserPineconeIndexes(userId: string): Promise<PineconeIndex[]> {
    try {
      const pineconeDir = join(this.basePath, 'pinecone');
      const files = await fs.readdir(pineconeDir);
      const indexes: PineconeIndex[] = [];
      
      for (const file of files) {
        const index = await this.readFile<PineconeIndex>(join(pineconeDir, file), { encrypt: true });
        if (index && index.userId === userId) {
          indexes.push(index);
        }
      }
      
      return indexes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (error) {
      return [];
    }
  }

  // Analytics
  async logAnalytics(event: string, data: any): Promise<void> {
    const log = {
      id: crypto.randomUUID(),
      event,
      data,
      timestamp: new Date(),
    };

    const dateStr = new Date().toISOString().split('T')[0];
    const filePath = join(this.basePath, 'analytics', `${dateStr}.json`);
    
    let logs: any[] = [];
    try {
      const existing = await this.readFile<any[]>(filePath);
      if (existing) logs = existing;
    } catch (error) {
      // File doesn't exist, start with empty array
    }
    
    logs.push(log);
    await this.writeFile(filePath, logs);
  }

  // Storage Statistics
  async getStorageStats(): Promise<any> {
    try {
      const stats = {
        totalUsers: 0,
        totalChats: 0,
        totalSearches: 0,
        totalCalculations: 0,
        totalIndexes: 0,
        storageSize: 0,
      };

      const dirs = ['users', 'chats', 'search', 'calculator', 'pinecone'];
      
      for (const dir of dirs) {
        const dirPath = join(this.basePath, dir);
        try {
          const files = await fs.readdir(dirPath);
          switch (dir) {
            case 'users': stats.totalUsers = files.length; break;
            case 'chats': stats.totalChats = files.length; break;
            case 'search': stats.totalSearches = files.length; break;
            case 'calculator': stats.totalCalculations = files.length; break;
            case 'pinecone': stats.totalIndexes = files.length; break;
          }
        } catch (error) {
          // Directory might not exist
        }
      }

      return stats;
    } catch (error) {
      return null;
    }
  }
}

export const ckStorage = new CKStorage();
