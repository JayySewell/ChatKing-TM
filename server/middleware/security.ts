import { Request, Response, NextFunction } from "express";
import { securityService } from "../services/security";

export interface SecurityRequest extends Request {
  security?: {
    ip: string;
    blocked: boolean;
    threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
    redirect?: string;
  };
}

export const securityMiddleware = async (req: SecurityRequest, res: Response, next: NextFunction) => {
  try {
    const analysis = await securityService.analyzeRequest(req);
    
    req.security = {
      ip: securityService['getClientIp'](req),
      blocked: analysis.block || false,
      threatLevel: 'none',
      redirect: analysis.redirect,
    };

    // If blocked, redirect to dummy site or send dummy response
    if (analysis.block) {
      req.security.blocked = true;
      req.security.threatLevel = 'critical';
      
      if (analysis.redirect) {
        // Redirect to dummy site for maximum deception
        return res.redirect(302, analysis.redirect);
      } else {
        // Send dummy JSON response for API requests
        return res.status(200).json({
          status: 'success',
          message: 'Request processed successfully',
          data: securityService.generateDummyResponse(),
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (!analysis.safe) {
      req.security.threatLevel = 'medium';
    }

    next();
  } catch (error) {
    console.error('Security middleware error:', error);
    // In case of security middleware failure, allow request but log it
    req.security = {
      ip: req.ip || 'unknown',
      blocked: false,
      threatLevel: 'none',
    };
    next();
  }
};

export const rateLimitMiddleware = (maxRequests: number = 60, windowMs: number = 60000) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: SecurityRequest, res: Response, next: NextFunction) => {
    const ip = req.security?.ip || req.ip || 'unknown';
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;

    const current = requestCounts.get(ip);

    if (!current || current.resetTime !== windowStart) {
      requestCounts.set(ip, { count: 1, resetTime: windowStart });
      res.set('X-RateLimit-Limit', maxRequests.toString());
      res.set('X-RateLimit-Remaining', (maxRequests - 1).toString());
      res.set('X-RateLimit-Reset', new Date(windowStart + windowMs).toISOString());
      return next();
    }

    current.count++;

    if (current.count > maxRequests) {
      res.set('X-RateLimit-Limit', maxRequests.toString());
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', new Date(windowStart + windowMs).toISOString());
      
      // Log as potential DDoS and redirect to dummy site
      securityService.logSecurityEvent({
        type: 'ddos_attempt',
        severity: 'high',
        ip,
        userAgent: req.get('User-Agent') || '',
        endpoint: req.path,
        payload: { requests: current.count, window: windowMs },
        isBlocked: true,
      });

      return res.redirect(302, 'https://www.google.com');
    }

    res.set('X-RateLimit-Limit', maxRequests.toString());
    res.set('X-RateLimit-Remaining', (maxRequests - current.count).toString());
    res.set('X-RateLimit-Reset', new Date(windowStart + windowMs).toISOString());

    next();
  };
};

export const bruteForceProtection = async (req: SecurityRequest, res: Response, next: NextFunction) => {
  // Only apply to login and sensitive endpoints
  const sensitiveEndpoints = ['/api/auth/login', '/api/auth/register', '/api/auth/reset-password'];
  
  if (!sensitiveEndpoints.some(endpoint => req.path.includes(endpoint))) {
    return next();
  }

  const ip = req.security?.ip || req.ip || 'unknown';
  
  // Check if IP is already blocked for brute force
  const isBlocked = await securityService.isIpBlocked(ip);
  if (isBlocked) {
    return res.redirect(302, 'https://www.example.com/maintenance');
  }

  next();
};

export const honeypotMiddleware = (req: SecurityRequest, res: Response, next: NextFunction) => {
  const honeypotPaths = [
    '/admin', '/administrator', '/wp-admin', '/wp-login.php',
    '/phpmyadmin', '/pma', '/mysql', '/database',
    '/.env', '/config.php', '/configuration.php',
    '/backup', '/backups', '/db_backup',
    '/shell.php', '/webshell.php', '/c99.php',
    '/install.php', '/setup.php', '/test.php',
    '/xmlrpc.php', '/readme.html', '/license.txt'
  ];

  const isHoneypot = honeypotPaths.some(path => req.path.includes(path));
  
  if (isHoneypot) {
    const ip = req.security?.ip || req.ip || 'unknown';
    
    // Log the honeypot access
    securityService.logSecurityEvent({
      type: 'suspicious_activity',
      severity: 'high',
      ip,
      userAgent: req.get('User-Agent') || '',
      endpoint: req.path,
      payload: req.body,
      isBlocked: true,
    });

    // Block the IP
    securityService.blockIp(ip, `Honeypot access: ${req.path}`);

    // Redirect to a convincing fake admin panel or 404 page
    const fakeResponses = [
      'https://wordpress.org/support/article/login-trouble/',
      'https://www.phpmyadmin.net/docs/',
      'https://httpd.apache.org/docs/2.4/misc/security_tips.html',
    ];
    
    const randomResponse = fakeResponses[Math.floor(Math.random() * fakeResponses.length)];
    return res.redirect(302, randomResponse);
  }

  next();
};

export const antiScanMiddleware = (req: SecurityRequest, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent') || '';
  const suspiciousAgents = [
    'sqlmap', 'nikto', 'dirb', 'dirbuster', 'wpscan', 'nmap', 'masscan',
    'nuclei', 'gobuster', 'ffuf', 'burpsuite', 'owasp', 'paros', 'w3af',
    'havij', 'acunetix', 'netsparker', 'appscan', 'webinspect', 'nessus',
    'openvas', 'rapid7', 'metasploit', 'cobalt', 'empire'
  ];

  const isScanTool = suspiciousAgents.some(tool => userAgent.toLowerCase().includes(tool));
  
  if (isScanTool) {
    const ip = req.security?.ip || req.ip || 'unknown';
    
    securityService.logSecurityEvent({
      type: 'malicious_request',
      severity: 'critical',
      ip,
      userAgent,
      endpoint: req.path,
      payload: { scanTool: true },
      isBlocked: true,
    });

    // Block IP and redirect to a fake vulnerable site to waste their time
    securityService.blockIp(ip, `Security scan tool detected: ${userAgent}`);
    
    // Redirect to a convincing but harmless site
    return res.redirect(302, 'http://testphp.vulnweb.com/');
  }

  next();
};

export const headerSecurityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  res.setHeader('Server', 'nginx/1.20.1'); // Fake server header
  
  // HSTS for production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

export const geoBlockMiddleware = async (req: SecurityRequest, res: Response, next: NextFunction) => {
  // Block known hostile countries (can be configured)
  const blockedCountries = process.env.BLOCKED_COUNTRIES?.split(',') || [];
  
  if (blockedCountries.length === 0) {
    return next();
  }

  const ip = req.security?.ip || req.ip || 'unknown';
  
  try {
    // In a real implementation, you'd use a GeoIP service
    // For now, just check for obvious Tor exit nodes or VPN ranges
    const suspiciousRanges = [
      '10.', '172.16.', '192.168.', // Private ranges (shouldn't hit public server)
      '169.254.', // Link-local
    ];

    const isSuspiciousRange = suspiciousRanges.some(range => ip.startsWith(range));
    
    if (isSuspiciousRange) {
      securityService.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        ip,
        userAgent: req.get('User-Agent') || '',
        endpoint: req.path,
        payload: { reason: 'suspicious_ip_range' },
        isBlocked: false, // Don't block, just log
      });
    }
  } catch (error) {
    console.error('Geo-blocking error:', error);
  }

  next();
};
