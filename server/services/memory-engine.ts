import { ckStorage } from "../storage/ck-storage";
import crypto from "crypto";

interface MemoryContext {
  userId: string;
  sessionId: string;
  conversationId: string;
  userProfile: UserProfile;
  conversationHistory: ConversationMessage[];
  userPreferences: UserMemoryPreferences;
  learnedBehaviors: LearnedBehavior[];
  contextualMemory: ContextualMemory;
  longTermMemory: LongTermMemory;
}

interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  model: string;
  metadata: MessageMetadata;
  importance: number; // 1-10, for memory retention
  topics: string[];
  sentiment: "positive" | "neutral" | "negative";
  followUp?: string;
}

interface MessageMetadata {
  tokenCount: number;
  responseTime: number;
  userSatisfaction?: number; // 1-5 stars
  userFeedback?: string;
  contextUsed: string[];
  searchQueries?: string[];
  calculationsUsed?: string[];
}

interface UserProfile {
  id: string;
  name: string;
  interests: string[];
  communicationStyle: CommunicationStyle;
  expertiseAreas: string[];
  learningGoals: string[];
  preferredTopics: string[];
  avoidedTopics: string[];
}

interface CommunicationStyle {
  formality: "casual" | "formal" | "mixed";
  verbosity: "concise" | "detailed" | "adaptive";
  technicalLevel: "beginner" | "intermediate" | "advanced" | "expert";
  responseLength: "short" | "medium" | "long" | "adaptive";
  humor: boolean;
  examples: boolean;
}

interface UserMemoryPreferences {
  rememberPersonalInfo: boolean;
  rememberConversations: boolean;
  adaptToStyle: boolean;
  learnFromFeedback: boolean;
  crossSessionMemory: boolean;
  memoryRetentionDays: number;
}

interface LearnedBehavior {
  id: string;
  category: "preference" | "pattern" | "style" | "topic";
  description: string;
  confidence: number; // 0-1
  usageCount: number;
  lastUsed: Date;
  effectiveness: number; // 0-1
}

interface ContextualMemory {
  currentTopic: string;
  relatedTopics: string[];
  recentQueries: string[];
  activeProjects: string[];
  followUpReminders: string[];
  conversationFlow: ConversationFlow;
}

interface ConversationFlow {
  currentStage: "greeting" | "exploration" | "deep_dive" | "problem_solving" | "conclusion";
  topicProgression: string[];
  questionAsked: boolean;
  needsClarification: boolean;
  userEngagement: "high" | "medium" | "low";
}

interface LongTermMemory {
  frequentTopics: TopicFrequency[];
  userJourney: UserJourneyStep[];
  achievements: Achievement[];
  learningProgress: LearningProgress[];
  personalFacts: PersonalFact[];
}

interface TopicFrequency {
  topic: string;
  count: number;
  lastDiscussed: Date;
  userExpertise: number; // 0-1
  aiHelpfulness: number; // 0-1
}

interface UserJourneyStep {
  id: string;
  timestamp: Date;
  action: string;
  context: string;
  outcome: string;
  satisfaction: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: Date;
  category: "learning" | "exploration" | "problem_solving" | "creativity";
}

interface LearningProgress {
  topic: string;
  startLevel: number;
  currentLevel: number;
  goalLevel: number;
  milestones: Milestone[];
}

interface Milestone {
  description: string;
  achievedAt: Date;
  confidence: number;
}

interface PersonalFact {
  category: "preference" | "interest" | "goal" | "background" | "constraint";
  fact: string;
  confidence: number;
  source: "stated" | "inferred" | "observed";
  lastUpdated: Date;
}

export class MemoryEngine {
  private memoryCache: Map<string, MemoryContext> = new Map();
  private maxCacheSize = 100;

  async getOrCreateMemoryContext(userId: string, sessionId: string): Promise<MemoryContext> {
    const cacheKey = `${userId}:${sessionId}`;
    
    // Check cache first
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!;
    }

    // Load from storage
    let context = await this.loadMemoryContext(userId, sessionId);
    
    if (!context) {
      // Create new context
      context = await this.createNewMemoryContext(userId, sessionId);
    }

    // Cache the context
    this.cacheMemoryContext(cacheKey, context);
    
    return context;
  }

  private async loadMemoryContext(userId: string, sessionId: string): Promise<MemoryContext | null> {
    try {
      const filePath = `memory/${userId}/${sessionId}.json`;
      return await ckStorage.readFile<MemoryContext>(filePath, { encrypt: true });
    } catch (error) {
      return null;
    }
  }

  private async createNewMemoryContext(userId: string, sessionId: string): Promise<MemoryContext> {
    // Load user profile and long-term memory
    const userProfile = await this.loadUserProfile(userId);
    const longTermMemory = await this.loadLongTermMemory(userId);
    const preferences = await this.loadUserPreferences(userId);

    const context: MemoryContext = {
      userId,
      sessionId,
      conversationId: crypto.randomUUID(),
      userProfile,
      conversationHistory: [],
      userPreferences: preferences,
      learnedBehaviors: [],
      contextualMemory: {
        currentTopic: "",
        relatedTopics: [],
        recentQueries: [],
        activeProjects: [],
        followUpReminders: [],
        conversationFlow: {
          currentStage: "greeting",
          topicProgression: [],
          questionAsked: false,
          needsClarification: false,
          userEngagement: "medium",
        },
      },
      longTermMemory,
    };

    await this.saveMemoryContext(context);
    return context;
  }

  async addMessage(userId: string, sessionId: string, message: ConversationMessage): Promise<void> {
    const context = await this.getOrCreateMemoryContext(userId, sessionId);
    
    // Analyze message for learning
    await this.analyzeMessage(context, message);
    
    // Add to conversation history
    context.conversationHistory.push(message);
    
    // Maintain conversation history size
    if (context.conversationHistory.length > 50) {
      // Keep important messages and recent ones
      context.conversationHistory = this.pruneConversationHistory(context.conversationHistory);
    }
    
    // Update contextual memory
    await this.updateContextualMemory(context, message);
    
    // Learn from user patterns
    await this.learnFromInteraction(context, message);
    
    await this.saveMemoryContext(context);
  }

  private async analyzeMessage(context: MemoryContext, message: ConversationMessage): Promise<void> {
    // Extract topics
    message.topics = await this.extractTopics(message.content);
    
    // Analyze sentiment
    message.sentiment = await this.analyzeSentiment(message.content);
    
    // Calculate importance
    message.importance = await this.calculateImportance(context, message);
  }

  private async extractTopics(content: string): Promise<string[]> {
    // Simple keyword extraction (in production, use proper NLP)
    const keywords = content
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));
    
    return [...new Set(keywords)].slice(0, 5);
  }

  private async analyzeSentiment(content: string): Promise<"positive" | "neutral" | "negative"> {
    // Simple sentiment analysis (in production, use proper sentiment analysis)
    const positiveWords = ["good", "great", "excellent", "amazing", "love", "like", "perfect", "awesome"];
    const negativeWords = ["bad", "terrible", "awful", "hate", "dislike", "wrong", "error", "problem"];
    
    const words = content.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount) return "positive";
    if (negativeCount > positiveCount) return "negative";
    return "neutral";
  }

  private async calculateImportance(context: MemoryContext, message: ConversationMessage): Promise<number> {
    let importance = 5; // Base importance
    
    // User messages are generally more important
    if (message.role === "user") importance += 2;
    
    // Personal information is important
    if (this.containsPersonalInfo(message.content)) importance += 3;
    
    // Questions are important
    if (message.content.includes("?")) importance += 1;
    
    // Topics the user is interested in
    const userInterests = context.userProfile.interests;
    if (message.topics.some(topic => userInterests.includes(topic))) importance += 2;
    
    // Feedback is very important
    if (message.metadata.userFeedback) importance += 3;
    
    return Math.min(importance, 10);
  }

  private containsPersonalInfo(content: string): boolean {
    const personalIndicators = [
      "my name", "i am", "i work", "i live", "i like", "i prefer", 
      "my job", "my hobby", "my goal", "i want", "i need", "i'm learning"
    ];
    
    const lowerContent = content.toLowerCase();
    return personalIndicators.some(indicator => lowerContent.includes(indicator));
  }

  private async updateContextualMemory(context: MemoryContext, message: ConversationMessage): Promise<void> {
    // Update current topic
    if (message.topics.length > 0) {
      context.contextualMemory.currentTopic = message.topics[0];
      context.contextualMemory.relatedTopics = [...new Set([
        ...context.contextualMemory.relatedTopics,
        ...message.topics.slice(1)
      ])].slice(0, 10);
    }
    
    // Update conversation flow
    if (message.role === "user") {
      if (message.content.includes("?")) {
        context.contextualMemory.conversationFlow.questionAsked = true;
      }
      
      // Assess engagement based on message length and sentiment
      const engagement = this.assessEngagement(message);
      context.contextualMemory.conversationFlow.userEngagement = engagement;
    }
    
    // Track topic progression
    if (message.topics.length > 0 && message.topics[0] !== context.contextualMemory.currentTopic) {
      context.contextualMemory.conversationFlow.topicProgression.push(message.topics[0]);
      if (context.contextualMemory.conversationFlow.topicProgression.length > 10) {
        context.contextualMemory.conversationFlow.topicProgression.shift();
      }
    }
  }

  private assessEngagement(message: ConversationMessage): "high" | "medium" | "low" {
    const length = message.content.length;
    const sentiment = message.sentiment;
    
    if (length > 100 && sentiment === "positive") return "high";
    if (length > 50 && sentiment !== "negative") return "medium";
    return "low";
  }

  private async learnFromInteraction(context: MemoryContext, message: ConversationMessage): Promise<void> {
    // Learn communication preferences
    if (message.role === "user") {
      await this.learnCommunicationStyle(context, message);
    }
    
    // Learn from feedback
    if (message.metadata.userSatisfaction) {
      await this.learnFromFeedback(context, message);
    }
    
    // Track topic interests
    await this.updateTopicInterests(context, message);
  }

  private async learnCommunicationStyle(context: MemoryContext, message: ConversationMessage): Promise<void> {
    const style = context.userProfile.communicationStyle;
    
    // Analyze formality
    const formalWords = ["please", "thank you", "appreciate", "grateful"];
    const casualWords = ["hey", "yeah", "cool", "awesome", "lol"];
    
    const content = message.content.toLowerCase();
    if (formalWords.some(word => content.includes(word))) {
      this.adjustFormality(style, "formal");
    } else if (casualWords.some(word => content.includes(word))) {
      this.adjustFormality(style, "casual");
    }
    
    // Analyze verbosity preference based on user message length
    const length = message.content.length;
    if (length > 200) {
      this.adjustVerbosity(style, "detailed");
    } else if (length < 50) {
      this.adjustVerbosity(style, "concise");
    }
  }

  private adjustFormality(style: CommunicationStyle, tendency: "formal" | "casual"): void {
    if (style.formality === "mixed" || style.formality !== tendency) {
      // Gradually adjust based on observations
      style.formality = tendency;
    }
  }

  private adjustVerbosity(style: CommunicationStyle, tendency: "detailed" | "concise"): void {
    if (style.verbosity === "adaptive" || style.verbosity !== tendency) {
      style.verbosity = tendency;
    }
  }

  private async learnFromFeedback(context: MemoryContext, message: ConversationMessage): Promise<void> {
    const satisfaction = message.metadata.userSatisfaction!;
    const previousMessage = context.conversationHistory[context.conversationHistory.length - 2];
    
    if (previousMessage && previousMessage.role === "assistant") {
      // Create or update learned behavior
      const behavior: LearnedBehavior = {
        id: crypto.randomUUID(),
        category: "style",
        description: `Response style that received ${satisfaction}/5 satisfaction`,
        confidence: satisfaction / 5,
        usageCount: 1,
        lastUsed: new Date(),
        effectiveness: satisfaction / 5,
      };
      
      context.learnedBehaviors.push(behavior);
    }
  }

  private async updateTopicInterests(context: MemoryContext, message: ConversationMessage): Promise<void> {
    for (const topic of message.topics) {
      const existing = context.longTermMemory.frequentTopics.find(t => t.topic === topic);
      
      if (existing) {
        existing.count++;
        existing.lastDiscussed = new Date();
        
        // Increase expertise if user provides detailed information
        if (message.role === "user" && message.content.length > 100) {
          existing.userExpertise = Math.min(existing.userExpertise + 0.1, 1);
        }
      } else {
        context.longTermMemory.frequentTopics.push({
          topic,
          count: 1,
          lastDiscussed: new Date(),
          userExpertise: message.role === "user" ? 0.1 : 0,
          aiHelpfulness: 0.5,
        });
      }
    }
    
    // Keep only top 50 topics
    context.longTermMemory.frequentTopics = context.longTermMemory.frequentTopics
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
  }

  private pruneConversationHistory(history: ConversationMessage[]): ConversationMessage[] {
    // Keep the most recent 20 messages and 10 most important messages
    const recent = history.slice(-20);
    const important = history
      .filter(msg => !recent.includes(msg))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);
    
    return [...important, ...recent].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async generateContextualPrompt(userId: string, sessionId: string, userMessage: string): Promise<string> {
    const context = await this.getOrCreateMemoryContext(userId, sessionId);
    
    let prompt = "You are ChatKing AI, an advanced AI assistant. ";
    
    // Add user profile context
    if (context.userProfile.name) {
      prompt += `You are talking to ${context.userProfile.name}. `;
    }
    
    // Add communication style preferences
    const style = context.userProfile.communicationStyle;
    if (style.formality === "formal") {
      prompt += "Maintain a professional and formal tone. ";
    } else if (style.formality === "casual") {
      prompt += "Use a friendly and casual tone. ";
    }
    
    if (style.verbosity === "concise") {
      prompt += "Keep responses brief and to the point. ";
    } else if (style.verbosity === "detailed") {
      prompt += "Provide comprehensive and detailed explanations. ";
    }
    
    // Add topic context
    if (context.contextualMemory.currentTopic) {
      prompt += `Current topic: ${context.contextualMemory.currentTopic}. `;
    }
    
    // Add recent conversation context
    const recentMessages = context.conversationHistory.slice(-5);
    if (recentMessages.length > 0) {
      prompt += "Recent conversation:\n";
      for (const msg of recentMessages) {
        prompt += `${msg.role}: ${msg.content}\n`;
      }
    }
    
    // Add user interests
    if (context.userProfile.interests.length > 0) {
      prompt += `User interests: ${context.userProfile.interests.join(", ")}. `;
    }
    
    // Add learning behaviors
    const effectiveBehaviors = context.learnedBehaviors
      .filter(b => b.effectiveness > 0.7)
      .slice(0, 3);
    
    if (effectiveBehaviors.length > 0) {
      prompt += "Effective approaches: " + effectiveBehaviors.map(b => b.description).join(", ") + ". ";
    }
    
    prompt += `\nUser message: ${userMessage}`;
    
    return prompt;
  }

  private async loadUserProfile(userId: string): Promise<UserProfile> {
    try {
      const filePath = `memory/${userId}/profile.json`;
      const profile = await ckStorage.readFile<UserProfile>(filePath, { encrypt: true });
      return profile || this.createDefaultProfile(userId);
    } catch (error) {
      return this.createDefaultProfile(userId);
    }
  }

  private createDefaultProfile(userId: string): UserProfile {
    return {
      id: userId,
      name: "",
      interests: [],
      communicationStyle: {
        formality: "mixed",
        verbosity: "adaptive",
        technicalLevel: "intermediate",
        responseLength: "adaptive",
        humor: false,
        examples: true,
      },
      expertiseAreas: [],
      learningGoals: [],
      preferredTopics: [],
      avoidedTopics: [],
    };
  }

  private async loadLongTermMemory(userId: string): Promise<LongTermMemory> {
    try {
      const filePath = `memory/${userId}/longterm.json`;
      const memory = await ckStorage.readFile<LongTermMemory>(filePath, { encrypt: true });
      return memory || this.createDefaultLongTermMemory();
    } catch (error) {
      return this.createDefaultLongTermMemory();
    }
  }

  private createDefaultLongTermMemory(): LongTermMemory {
    return {
      frequentTopics: [],
      userJourney: [],
      achievements: [],
      learningProgress: [],
      personalFacts: [],
    };
  }

  private async loadUserPreferences(userId: string): Promise<UserMemoryPreferences> {
    try {
      const filePath = `memory/${userId}/preferences.json`;
      const prefs = await ckStorage.readFile<UserMemoryPreferences>(filePath, { encrypt: true });
      return prefs || this.createDefaultPreferences();
    } catch (error) {
      return this.createDefaultPreferences();
    }
  }

  private createDefaultPreferences(): UserMemoryPreferences {
    return {
      rememberPersonalInfo: true,
      rememberConversations: true,
      adaptToStyle: true,
      learnFromFeedback: true,
      crossSessionMemory: true,
      memoryRetentionDays: 365,
    };
  }

  private async saveMemoryContext(context: MemoryContext): Promise<void> {
    const filePath = `memory/${context.userId}/${context.sessionId}.json`;
    await ckStorage.writeFile(filePath, context, { encrypt: true });
    
    // Also save long-term memory and profile updates
    await this.saveLongTermMemory(context.userId, context.longTermMemory);
    await this.saveUserProfile(context.userId, context.userProfile);
  }

  private async saveLongTermMemory(userId: string, memory: LongTermMemory): Promise<void> {
    const filePath = `memory/${userId}/longterm.json`;
    await ckStorage.writeFile(filePath, memory, { encrypt: true });
  }

  private async saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
    const filePath = `memory/${userId}/profile.json`;
    await ckStorage.writeFile(filePath, profile, { encrypt: true });
  }

  private cacheMemoryContext(key: string, context: MemoryContext): void {
    if (this.memoryCache.size >= this.maxCacheSize) {
      // Remove least recently used
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(key, context);
  }

  private isStopWord(word: string): boolean {
    const stopWords = ["the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"];
    return stopWords.includes(word);
  }

  async getConversationSummary(userId: string, sessionId: string): Promise<string> {
    const context = await this.getOrCreateMemoryContext(userId, sessionId);
    
    if (context.conversationHistory.length === 0) {
      return "No conversation history available.";
    }
    
    const topics = [...new Set(context.conversationHistory.flatMap(msg => msg.topics))];
    const userMessages = context.conversationHistory.filter(msg => msg.role === "user").length;
    const assistantMessages = context.conversationHistory.filter(msg => msg.role === "assistant").length;
    
    let summary = `Conversation with ${context.userProfile.name || "user"}: `;
    summary += `${userMessages} user messages, ${assistantMessages} assistant responses. `;
    summary += `Topics discussed: ${topics.join(", ")}. `;
    summary += `Current topic: ${context.contextualMemory.currentTopic}. `;
    summary += `User engagement: ${context.contextualMemory.conversationFlow.userEngagement}.`;
    
    return summary;
  }
}

export const memoryEngine = new MemoryEngine();
