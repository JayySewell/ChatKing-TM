import { ckStorage } from "../storage/ck-storage";
import crypto from "crypto";

interface SecurityEvent {
  id: string;
  type:
    | "suspicious_activity"
    | "brute_force"
    | "unauthorized_access"
    | "malicious_request"
    | "ddos_attempt";
  severity: "low" | "medium" | "high" | "critical";
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

interface SecurityConfig {
  maxLoginAttempts: number;
  blockDuration: number; // minutes
  maxRequestsPerMinute: number;
  suspiciousPatterns: string[];
  whitelist: string[];
  blacklist: string[];
  enableHoneypot: boolean;
  enableDummyRedirect: boolean;
  dummyRedirectUrl: string;
}

export class SecurityService {
  private config: SecurityConfig;
  private requestCounts: Map<string, { count: number; resetTime: number }> =
    new Map();
  private suspiciousIps: Set<string> = new Set();

  constructor() {
    this.config = {
      maxLoginAttempts: 5,
      blockDuration: 15,
      maxRequestsPerMinute: 60,
      suspiciousPatterns: [
        "sql injection",
        "script>",
        "javascript:",
        "onerror=",
        "onload=",
        "eval(",
        "document.cookie",
        "window.location",
        "<iframe",
        "union select",
        "drop table",
        "insert into",
        "delete from",
        "../../../",
        "..\\..\\",
        "/etc/passwd",
        "/proc/version",
        "cmd.exe",
        "powershell",
        "system(",
        "exec(",
        "shell_exec",
        "passthru",
        "base64_decode",
        "gzinflate",
        "str_rot13",
        "phpinfo",
        "include(",
        "require(",
        "wp-admin",
        "wp-login",
        "admin/",
        "administrator/",
        "phpmyadmin",
        "mysql/",
        "mssql/",
        "oracle/",
        "postgres/",
      ],
      whitelist: ["127.0.0.1", "::1", "localhost"],
      blacklist: [],
      enableHoneypot: true,
      enableDummyRedirect: true,
      dummyRedirectUrl: "https://www.google.com",
    };
  }

  async analyzeRequest(
    req: any,
  ): Promise<{ safe: boolean; redirect?: string; block?: boolean }> {
    const ip = this.getClientIp(req);
    const userAgent = req.get("User-Agent") || "";
    const endpoint = req.path;
    const payload = { ...req.body, ...req.query };

    // Check if IP is whitelisted
    if (this.config.whitelist.includes(ip)) {
      return { safe: true };
    }

    // Check if IP is blacklisted
    if (this.config.blacklist.includes(ip) || this.suspiciousIps.has(ip)) {
      await this.logSecurityEvent({
        type: "unauthorized_access",
        severity: "high",
        ip,
        userAgent,
        endpoint,
        payload,
        isBlocked: true,
      });
      return {
        safe: false,
        redirect: this.config.dummyRedirectUrl,
        block: true,
      };
    }

    // Rate limiting check
    const rateLimitResult = await this.checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      await this.logSecurityEvent({
        type: "ddos_attempt",
        severity: "medium",
        ip,
        userAgent,
        endpoint,
        payload,
        isBlocked: true,
      });
      return {
        safe: false,
        redirect: this.config.dummyRedirectUrl,
        block: true,
      };
    }

    // Check for suspicious patterns
    const suspiciousContent = this.detectSuspiciousContent(
      payload,
      endpoint,
      userAgent,
    );
    if (suspiciousContent.found) {
      await this.logSecurityEvent({
        type: "malicious_request",
        severity: suspiciousContent.severity,
        ip,
        userAgent,
        endpoint,
        payload,
        isBlocked: suspiciousContent.severity === "critical",
      });

      if (suspiciousContent.severity === "critical") {
        this.suspiciousIps.add(ip);
        return {
          safe: false,
          redirect: this.config.dummyRedirectUrl,
          block: true,
        };
      }
    }

    // Check for bot behavior
    const botCheck = this.detectBotBehavior(userAgent, endpoint);
    if (botCheck.isBot && botCheck.isMalicious) {
      await this.logSecurityEvent({
        type: "suspicious_activity",
        severity: "medium",
        ip,
        userAgent,
        endpoint,
        payload,
        isBlocked: true,
      });
      return {
        safe: false,
        redirect: this.config.dummyRedirectUrl,
        block: true,
      };
    }

    // Honeypot endpoints
    if (this.config.enableHoneypot && this.isHoneypot(endpoint)) {
      await this.logSecurityEvent({
        type: "suspicious_activity",
        severity: "high",
        ip,
        userAgent,
        endpoint,
        payload,
        isBlocked: true,
      });
      this.suspiciousIps.add(ip);
      return {
        safe: false,
        redirect: this.config.dummyRedirectUrl,
        block: true,
      };
    }

    return { safe: true };
  }

  private getClientIp(req: any): string {
    return (
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.headers["x-real-ip"] ||
      "127.0.0.1"
    );
  }

  private async checkRateLimit(
    ip: string,
  ): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const windowStart = Math.floor(now / 60000) * 60000; // 1-minute window

    const current = this.requestCounts.get(ip);

    if (!current || current.resetTime !== windowStart) {
      this.requestCounts.set(ip, { count: 1, resetTime: windowStart });
      return { allowed: true, remaining: this.config.maxRequestsPerMinute - 1 };
    }

    current.count++;

    if (current.count > this.config.maxRequestsPerMinute) {
      return { allowed: false, remaining: 0 };
    }

    return {
      allowed: true,
      remaining: this.config.maxRequestsPerMinute - current.count,
    };
  }

  private detectSuspiciousContent(
    payload: any,
    endpoint: string,
    userAgent: string,
  ): {
    found: boolean;
    severity: "low" | "medium" | "high" | "critical";
    patterns: string[];
  } {
    const content = JSON.stringify(payload) + " " + endpoint + " " + userAgent;
    const lowerContent = content.toLowerCase();
    const foundPatterns: string[] = [];

    for (const pattern of this.config.suspiciousPatterns) {
      if (lowerContent.includes(pattern.toLowerCase())) {
        foundPatterns.push(pattern);
      }
    }

    if (foundPatterns.length === 0) {
      return { found: false, severity: "low", patterns: [] };
    }

    // Determine severity based on patterns found
    const criticalPatterns = [
      "union select",
      "drop table",
      "delete from",
      "insert into",
      "system(",
      "exec(",
      "shell_exec",
    ];
    const highPatterns = [
      "script>",
      "javascript:",
      "eval(",
      "document.cookie",
      "../../../",
      "/etc/passwd",
    ];

    const hasCritical = foundPatterns.some((p) =>
      criticalPatterns.some((cp) => p.includes(cp)),
    );
    const hasHigh = foundPatterns.some((p) =>
      highPatterns.some((hp) => p.includes(hp)),
    );

    let severity: "low" | "medium" | "high" | "critical" = "low";
    if (hasCritical) severity = "critical";
    else if (hasHigh) severity = "high";
    else if (foundPatterns.length > 3) severity = "medium";

    return { found: true, severity, patterns: foundPatterns };
  }

  private detectBotBehavior(
    userAgent: string,
    endpoint: string,
  ): { isBot: boolean; isMalicious: boolean; type?: string } {
    const lowerUserAgent = userAgent.toLowerCase();

    // Known good bots
    const goodBots = ["googlebot", "bingbot", "slurp", "facebookexternalhit"];
    const isGoodBot = goodBots.some((bot) => lowerUserAgent.includes(bot));

    // Malicious bot patterns
    const maliciousBots = [
      "sqlmap",
      "nikto",
      "dirb",
      "dirbuster",
      "wpscan",
      "nmap",
      "masscan",
      "nuclei",
      "gobuster",
      "ffuf",
      "burpsuite",
      "owasp",
      "paros",
      "w3af",
      "havij",
      "acunetix",
      "netsparker",
      "appscan",
      "webinspect",
    ];
    const isMaliciousBot = maliciousBots.some((bot) =>
      lowerUserAgent.includes(bot),
    );

    // Suspicious patterns
    const suspiciousPatterns = [
      "python-requests",
      "curl/",
      "wget/",
      "http_request",
      "scrapy",
      "botright",
      "selenium",
      "phantomjs",
      "headless",
    ];
    const hasSuspiciousPattern = suspiciousPatterns.some((pattern) =>
      lowerUserAgent.includes(pattern),
    );

    // Empty or very short user agent
    const hasEmptyUA = !userAgent || userAgent.length < 10;

    // Check for scanning patterns
    const isScanningEndpoint =
      endpoint.includes("admin") ||
      endpoint.includes("wp-") ||
      endpoint.includes("phpmyadmin") ||
      endpoint.includes("/.env") ||
      endpoint.includes("/config");

    const isBot =
      isGoodBot || isMaliciousBot || hasSuspiciousPattern || hasEmptyUA;
    const isMalicious =
      isMaliciousBot ||
      (hasSuspiciousPattern && isScanningEndpoint) ||
      (hasEmptyUA && isScanningEndpoint);

    return {
      isBot,
      isMalicious,
      type: isMaliciousBot
        ? "malicious"
        : isGoodBot
          ? "legitimate"
          : "suspicious",
    };
  }

  private isHoneypot(endpoint: string): boolean {
    const honeypotPaths = [
      "/admin",
      "/administrator",
      "/wp-admin",
      "/wp-login.php",
      "/phpmyadmin",
      "/pma",
      "/mysql",
      "/database",
      "/.env",
      "/config.php",
      "/configuration.php",
      "/backup",
      "/backups",
      "/db_backup",
      "/shell.php",
      "/webshell.php",
      "/c99.php",
      "/install.php",
      "/setup.php",
      "/test.php",
    ];

    return honeypotPaths.some((path) => endpoint.includes(path));
  }

  async logSecurityEvent(
    event: Omit<SecurityEvent, "id" | "timestamp">,
  ): Promise<void> {
    const securityEvent: SecurityEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    await ckStorage.logSecurityEvent(securityEvent);

    // Auto-block critical threats
    if (event.severity === "critical" && event.isBlocked) {
      await this.blockIp(event.ip, `Critical security threat: ${event.type}`);
    }
  }

  async blockIp(
    ip: string,
    reason: string,
    duration: number = this.config.blockDuration,
  ): Promise<void> {
    const ipInfo: IpInfo = {
      ip,
      attempts: 1,
      lastAttempt: new Date().toISOString(),
      isBlocked: true,
      blockReason: reason,
      firstSeen: new Date().toISOString(),
    };

    await ckStorage.blockIp(ip, ipInfo);
    this.suspiciousIps.add(ip);

    // Auto-unblock after duration
    setTimeout(
      () => {
        this.unblockIp(ip);
      },
      duration * 60 * 1000,
    );
  }

  async unblockIp(ip: string): Promise<void> {
    await ckStorage.unblockIp(ip);
    this.suspiciousIps.delete(ip);
  }

  async getSecurityStats(): Promise<{
    totalEvents: number;
    blockedIps: number;
    recentEvents: SecurityEvent[];
    topThreats: { type: string; count: number }[];
  }> {
    const events = await ckStorage.getSecurityEvents();
    const blockedIps = await ckStorage.getBlockedIps();

    const recentEvents = events
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 50);

    const threatCounts: Record<string, number> = {};
    events.forEach((event) => {
      threatCounts[event.type] = (threatCounts[event.type] || 0) + 1;
    });

    const topThreats = Object.entries(threatCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: events.length,
      blockedIps: blockedIps.length,
      recentEvents,
      topThreats,
    };
  }

  async recordLoginAttempt(
    ip: string,
    success: boolean,
    username?: string,
  ): Promise<{ blocked: boolean; attemptsLeft: number }> {
    const attempts = await ckStorage.getLoginAttempts(ip);
    const newAttempt = {
      ip,
      timestamp: new Date().toISOString(),
      success,
      username,
    };

    await ckStorage.recordLoginAttempt(newAttempt);

    if (!success) {
      const failedAttempts =
        attempts.filter(
          (a) =>
            !a.success &&
            new Date(a.timestamp).getTime() >
              Date.now() - this.config.blockDuration * 60 * 1000,
        ).length + 1;

      if (failedAttempts >= this.config.maxLoginAttempts) {
        await this.blockIp(
          ip,
          `Too many failed login attempts (${failedAttempts})`,
        );
        await this.logSecurityEvent({
          type: "brute_force",
          severity: "high",
          ip,
          userAgent: "",
          endpoint: "/login",
          payload: { username, attempts: failedAttempts },
          isBlocked: true,
        });
        return { blocked: true, attemptsLeft: 0 };
      }

      return {
        blocked: false,
        attemptsLeft: this.config.maxLoginAttempts - failedAttempts,
      };
    }

    return { blocked: false, attemptsLeft: this.config.maxLoginAttempts };
  }

  generateDummyResponse(): string {
    // Generate a realistic-looking but fake response
    const dummyData = {
      status: "success",
      data: {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: "Request processed successfully",
        version: "1.0.0",
        server: "nginx/1.20.1",
      },
    };

    return JSON.stringify(dummyData, null, 2);
  }

  async isIpBlocked(ip: string): Promise<boolean> {
    const blockedIps = await ckStorage.getBlockedIps();
    return blockedIps.some((blocked) => blocked.ip === ip && blocked.isBlocked);
  }

  async updateSecurityConfig(
    newConfig: Partial<SecurityConfig>,
  ): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await ckStorage.storeSecurityConfig(this.config);
  }

  getSecurityConfig(): SecurityConfig {
    return { ...this.config };
  }
}

export const securityService = new SecurityService();
