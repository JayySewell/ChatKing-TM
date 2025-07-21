import { enhancedAuthService } from "./auth-enhanced";

interface ContentFilterConfig {
  enabled: boolean;
  strictMode: boolean;
  ageRestrictions: {
    enabled: boolean;
    minimumAge: number;
    requireVerification: boolean;
  };
  categories: {
    adult: boolean;
    violence: boolean;
    drugs: boolean;
    gambling: boolean;
    hate: boolean;
    selfHarm: boolean;
    extremism: boolean;
  };
  customKeywords: string[];
  whitelist: string[];
  blacklist: string[];
}

interface ContentAnalysis {
  isAllowed: boolean;
  confidence: number;
  flaggedCategories: string[];
  reasoning: string;
  ageRating: "G" | "PG" | "PG-13" | "R" | "NC-17";
  warnings: string[];
}

interface AgeVerificationData {
  userId: string;
  birthDate: Date;
  verifiedAt: Date;
  verificationMethod: "document" | "credit_card" | "phone" | "trusted_contact";
  isVerified: boolean;
  parentalConsent?: boolean;
}

export class ContentFilterService {
  private config: ContentFilterConfig;
  private adultKeywords: string[];
  private violenceKeywords: string[];
  private drugKeywords: string[];
  private hateKeywords: string[];
  private safeKeywords: string[];

  constructor() {
    this.config = {
      enabled: true,
      strictMode: false,
      ageRestrictions: {
        enabled: true,
        minimumAge: 13,
        requireVerification: true,
      },
      categories: {
        adult: true,
        violence: true,
        drugs: true,
        gambling: true,
        hate: true,
        selfHarm: true,
        extremism: true,
      },
      customKeywords: [],
      whitelist: [
        "education",
        "learning",
        "science",
        "technology",
        "programming",
        "mathematics",
        "art",
        "music",
        "literature",
        "history",
        "nature",
        "cooking",
        "sports",
      ],
      blacklist: [],
    };

    this.initializeKeywords();
  }

  private initializeKeywords(): void {
    this.adultKeywords = [
      "explicit",
      "adult",
      "nsfw",
      "mature",
      "sexual",
      "intimate",
      "erotic",
      "pornography",
      "nude",
      "naked",
      "sex",
      "porn",
      "xxx",
      "escort",
      "webcam",
      "cam girl",
      "onlyfans",
      "dating",
      "hookup",
      "adult content",
    ];

    this.violenceKeywords = [
      "violence",
      "violent",
      "kill",
      "murder",
      "death",
      "weapon",
      "gun",
      "knife",
      "bomb",
      "explosion",
      "terrorist",
      "attack",
      "assault",
      "fight",
      "war",
      "blood",
      "gore",
      "torture",
      "abuse",
      "harm",
    ];

    this.drugKeywords = [
      "drugs",
      "cocaine",
      "heroin",
      "marijuana",
      "cannabis",
      "weed",
      "meth",
      "crystal",
      "ecstasy",
      "molly",
      "lsd",
      "acid",
      "pills",
      "substance",
      "addiction",
      "dealer",
      "high",
      "stoned",
      "drunk",
    ];

    this.hateKeywords = [
      "hate",
      "racist",
      "nazi",
      "supremacist",
      "discrimination",
      "slur",
      "bigot",
      "extremist",
      "radical",
      "terrorism",
      "genocide",
      "ethnic",
      "religious hatred",
      "homophobic",
      "transphobic",
      "xenophobic",
    ];

    this.safeKeywords = [
      "education",
      "tutorial",
      "learning",
      "help",
      "guide",
      "information",
      "knowledge",
      "study",
      "research",
      "academic",
      "school",
      "university",
      "science",
      "technology",
      "programming",
      "development",
      "creative",
    ];
  }

  async analyzeContent(
    content: string,
    userId?: string,
  ): Promise<ContentAnalysis> {
    const lowerContent = content.toLowerCase();
    let flaggedCategories: string[] = [];
    let confidence = 0;
    let ageRating: "G" | "PG" | "PG-13" | "R" | "NC-17" = "G";
    let warnings: string[] = [];

    // Check against different categories
    if (this.config.categories.adult) {
      const adultScore = this.calculateKeywordScore(
        lowerContent,
        this.adultKeywords,
      );
      if (adultScore > 0.3) {
        flaggedCategories.push("adult");
        confidence = Math.max(confidence, adultScore);
        ageRating = adultScore > 0.7 ? "NC-17" : "R";
        warnings.push("Contains adult content");
      }
    }

    if (this.config.categories.violence) {
      const violenceScore = this.calculateKeywordScore(
        lowerContent,
        this.violenceKeywords,
      );
      if (violenceScore > 0.2) {
        flaggedCategories.push("violence");
        confidence = Math.max(confidence, violenceScore);
        ageRating =
          violenceScore > 0.5 ? "R" : ageRating === "G" ? "PG-13" : ageRating;
        warnings.push("Contains violent content");
      }
    }

    if (this.config.categories.drugs) {
      const drugScore = this.calculateKeywordScore(
        lowerContent,
        this.drugKeywords,
      );
      if (drugScore > 0.2) {
        flaggedCategories.push("drugs");
        confidence = Math.max(confidence, drugScore);
        ageRating =
          drugScore > 0.4 ? "R" : ageRating === "G" ? "PG-13" : ageRating;
        warnings.push("Contains drug-related content");
      }
    }

    if (this.config.categories.hate) {
      const hateScore = this.calculateKeywordScore(
        lowerContent,
        this.hateKeywords,
      );
      if (hateScore > 0.1) {
        flaggedCategories.push("hate");
        confidence = Math.max(confidence, hateScore);
        ageRating = "R";
        warnings.push("Contains hate speech or discriminatory content");
      }
    }

    // Check custom blacklist
    const blacklistScore = this.calculateKeywordScore(
      lowerContent,
      this.config.blacklist,
    );
    if (blacklistScore > 0) {
      flaggedCategories.push("blacklisted");
      confidence = Math.max(confidence, 0.9);
      warnings.push("Contains blocked content");
    }

    // Check if content is whitelisted (educational, safe content)
    const whitelistScore = this.calculateKeywordScore(
      lowerContent,
      this.config.whitelist,
    );
    const safeScore = this.calculateKeywordScore(
      lowerContent,
      this.safeKeywords,
    );

    // Reduce confidence if content appears educational/safe
    if (whitelistScore > 0.3 || safeScore > 0.3) {
      confidence *= 0.5;
      if (flaggedCategories.length === 0) {
        ageRating = "G";
      }
    }

    // Age verification check
    let isAllowed = true;
    if (userId && this.config.ageRestrictions.enabled) {
      const userProfile = await enhancedAuthService.getEnhancedProfile(userId);
      if (userProfile && !userProfile.preferences.ageVerified) {
        if (ageRating === "R" || ageRating === "NC-17") {
          isAllowed = false;
          warnings.push("Age verification required for this content");
        }
      }
    }

    // Final decision
    if (this.config.enabled) {
      if (this.config.strictMode) {
        isAllowed = confidence < 0.1;
      } else {
        isAllowed =
          confidence < 0.5 &&
          !flaggedCategories.includes("hate") &&
          !flaggedCategories.includes("blacklisted");
      }
    }

    // Always allow if content filter is disabled
    if (!this.config.enabled) {
      isAllowed = true;
    }

    return {
      isAllowed,
      confidence,
      flaggedCategories,
      reasoning: this.generateReasoning(
        flaggedCategories,
        confidence,
        isAllowed,
      ),
      ageRating,
      warnings,
    };
  }

  private calculateKeywordScore(content: string, keywords: string[]): number {
    if (keywords.length === 0) return 0;

    let matches = 0;
    let totalKeywords = keywords.length;

    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        matches++;
      }
    }

    return matches / totalKeywords;
  }

  private generateReasoning(
    categories: string[],
    confidence: number,
    isAllowed: boolean,
  ): string {
    if (categories.length === 0) {
      return "Content appears safe and appropriate";
    }

    if (!isAllowed) {
      return `Content blocked due to: ${categories.join(", ")}. Confidence: ${(confidence * 100).toFixed(1)}%`;
    }

    return `Content flagged for: ${categories.join(", ")} but allowed. Confidence: ${(confidence * 100).toFixed(1)}%`;
  }

  async verifyAge(
    userId: string,
    birthDate: Date,
    verificationMethod: string,
  ): Promise<boolean> {
    const age = this.calculateAge(birthDate);

    if (age < this.config.ageRestrictions.minimumAge) {
      return false;
    }

    // Store age verification
    const verificationData: AgeVerificationData = {
      userId,
      birthDate,
      verifiedAt: new Date(),
      verificationMethod: verificationMethod as any,
      isVerified: true,
      parentalConsent: age < 18,
    };

    await this.storeAgeVerification(verificationData);

    // Update user profile
    const success = await enhancedAuthService.verifyAge(userId, birthDate);

    return success;
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  private async storeAgeVerification(data: AgeVerificationData): Promise<void> {
    // Store age verification data securely
    const filePath = `age-verification/${data.userId}.json`;
    // In production, this would use encrypted storage
    console.log("Age verification stored for user:", data.userId);
  }

  async createStrikeForUser(
    userId: string,
    reason: string,
    content: string,
  ): Promise<number> {
    // Log the violation
    console.log(`Content violation for user ${userId}: ${reason}`);

    // Add strike to user profile
    const strikes = await enhancedAuthService.addStrike(userId, reason);

    // Log the incident
    await this.logContentViolation(userId, reason, content, strikes);

    return strikes;
  }

  private async logContentViolation(
    userId: string,
    reason: string,
    content: string,
    strikes: number,
  ): Promise<void> {
    const incident = {
      id: crypto.randomUUID(),
      userId,
      reason,
      content: content.substring(0, 200), // Store first 200 chars for context
      strikes,
      timestamp: new Date().toISOString(),
    };

    // In production, this would be stored in a secure audit log
    console.log("Content violation logged:", incident);
  }

  async filterSearchResults(results: any[], userId?: string): Promise<any[]> {
    const filteredResults = [];

    for (const result of results) {
      const analysis = await this.analyzeContent(
        `${result.title} ${result.description}`,
        userId,
      );

      if (analysis.isAllowed) {
        // Add content rating info
        result.contentRating = analysis.ageRating;
        result.warnings = analysis.warnings;
        filteredResults.push(result);
      }
    }

    return filteredResults;
  }

  async filterChatMessage(
    message: string,
    userId?: string,
  ): Promise<{
    allowed: boolean;
    filteredMessage?: string;
    warning?: string;
  }> {
    const analysis = await this.analyzeContent(message, userId);

    if (!analysis.isAllowed) {
      // Create strike if content is inappropriate
      if (userId && analysis.confidence > 0.7) {
        await this.createStrikeForUser(
          userId,
          `Inappropriate content: ${analysis.flaggedCategories.join(", ")}`,
          message,
        );
      }

      return {
        allowed: false,
        warning: `Message blocked: ${analysis.reasoning}`,
      };
    }

    // Apply light filtering for minor issues
    let filteredMessage = message;
    if (analysis.confidence > 0.2 && analysis.confidence < 0.5) {
      // Mask potentially problematic content
      for (const keyword of [...this.adultKeywords, ...this.violenceKeywords]) {
        const regex = new RegExp(keyword, "gi");
        filteredMessage = filteredMessage.replace(
          regex,
          "*".repeat(keyword.length),
        );
      }
    }

    return {
      allowed: true,
      filteredMessage:
        filteredMessage !== message ? filteredMessage : undefined,
    };
  }

  updateConfig(newConfig: Partial<ContentFilterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ContentFilterConfig {
    return { ...this.config };
  }

  async generateContentReport(userId: string): Promise<{
    violationsCount: number;
    strikes: number;
    contentRating: string;
    recommendations: string[];
  }> {
    const userProfile = await enhancedAuthService.getEnhancedProfile(userId);

    if (!userProfile) {
      return {
        violationsCount: 0,
        strikes: 0,
        contentRating: "Unknown",
        recommendations: ["Complete profile setup"],
      };
    }

    const strikes = userProfile.stats.strikes;
    const ageVerified = userProfile.preferences.ageVerified;

    let contentRating = "General";
    if (!ageVerified) {
      contentRating = "Restricted";
    } else if (strikes > 2) {
      contentRating = "Limited";
    }

    const recommendations = [];
    if (!ageVerified) {
      recommendations.push("Complete age verification to access more content");
    }
    if (strikes > 0) {
      recommendations.push(
        "Follow community guidelines to avoid further restrictions",
      );
    }
    if (strikes === 0 && ageVerified) {
      recommendations.push("You have access to all appropriate content");
    }

    return {
      violationsCount: strikes,
      strikes,
      contentRating,
      recommendations,
    };
  }
}

export const contentFilterService = new ContentFilterService();
