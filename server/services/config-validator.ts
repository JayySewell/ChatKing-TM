/**
 * Configuration Validator Service
 * Validates that all required environment variables are present
 * and properly formatted without exposing actual values.
 */

interface ConfigValidation {
  service: string;
  key: string;
  required: boolean;
  present: boolean;
  valid: boolean;
  message: string;
}

interface SecurityConfig {
  hideKeysInLogs: boolean;
  requireAllKeys: boolean;
  validateKeyFormats: boolean;
}

export class ConfigValidator {
  private securityConfig: SecurityConfig = {
    hideKeysInLogs: true,
    requireAllKeys: process.env.NODE_ENV === "production",
    validateKeyFormats: true,
  };

  /**
   * Validate all required configuration without exposing values
   */
  validateConfiguration(): {
    valid: boolean;
    validations: ConfigValidation[];
    errors: string[];
  } {
    const validations: ConfigValidation[] = [];
    const errors: string[] = [];

    // Define required configurations
    const requiredConfigs = [
      {
        service: "OpenRouter",
        key: "OPENROUTER_API_KEY",
        required: true,
        validator: (value: string) =>
          value.startsWith("sk-or-v1-") && value.length > 20,
      },
      {
        service: "Pinecone",
        key: "PINECONE_API_KEY",
        required: true,
        validator: (value: string) =>
          (value.startsWith("pcsk_") || value.startsWith("pc-")) &&
          value.length > 20,
      },
      {
        service: "BraveSearch",
        key: "BRAVE_SEARCH_API_KEY",
        required: false,
        validator: (value: string) =>
          value.startsWith("BSA") && value.length > 10,
      },
      {
        service: "Google OAuth",
        key: "GOOGLE_CLIENT_ID",
        required: false,
        validator: (value: string) =>
          value.length > 10 &&
          value.includes(".googleusercontent.com") === false,
      },
      {
        service: "Google OAuth Secret",
        key: "GOOGLE_CLIENT_SECRET",
        required: false,
        validator: (value: string) => value.length > 10,
      },
      {
        service: "SendGrid",
        key: "SENDGRID_API_KEY",
        required: false,
        validator: (value: string) =>
          value.startsWith("SG.") && value.length > 20,
      },
      {
        service: "JWT Secret",
        key: "JWT_SECRET",
        required: true,
        validator: (value: string) => value.length >= 32,
      },
      {
        service: "Encryption Key",
        key: "ENCRYPTION_KEY",
        required: true,
        validator: (value: string) => value.length >= 32,
      },
    ];

    // Validate each configuration
    for (const config of requiredConfigs) {
      const value = process.env[config.key];
      const present = !!value && value.trim() !== "";
      const valid = present ? config.validator(value!) : false;

      const validation: ConfigValidation = {
        service: config.service,
        key: config.key,
        required: config.required,
        present,
        valid: present && valid,
        message: this.getValidationMessage(
          config.service,
          present,
          valid,
          config.required,
        ),
      };

      validations.push(validation);

      // Add errors for required configs that are missing or invalid
      if (config.required && !present) {
        errors.push(`Missing required environment variable: ${config.key}`);
      } else if (config.required && present && !valid) {
        errors.push(`Invalid format for ${config.key}`);
      }
    }

    return {
      valid: errors.length === 0,
      validations,
      errors,
    };
  }

  /**
   * Get sanitized configuration for client-side display
   */
  getPublicConfigStatus(): Record<
    string,
    {
      configured: boolean;
      valid: boolean;
      service: string;
    }
  > {
    const validation = this.validateConfiguration();
    const publicStatus: Record<
      string,
      { configured: boolean; valid: boolean; service: string }
    > = {};

    for (const v of validation.validations) {
      publicStatus[v.key] = {
        configured: v.present,
        valid: v.valid,
        service: v.service,
      };
    }

    return publicStatus;
  }

  /**
   * Mask sensitive values for logging
   */
  maskApiKey(key: string): string {
    if (!key || key.length < 8) return "***";

    // Show first 4 and last 4 characters, mask the middle
    const start = key.substring(0, 4);
    const end = key.substring(key.length - 4);
    const middle = "*".repeat(Math.max(0, key.length - 8));

    return `${start}${middle}${end}`;
  }

  /**
   * Get environment status without exposing values
   */
  getEnvironmentStatus(): {
    environment: string;
    totalConfigs: number;
    configuredCount: number;
    validCount: number;
    missingRequired: string[];
  } {
    const validation = this.validateConfiguration();
    const totalConfigs = validation.validations.length;
    const configuredCount = validation.validations.filter(
      (v) => v.present,
    ).length;
    const validCount = validation.validations.filter((v) => v.valid).length;
    const missingRequired = validation.validations
      .filter((v) => v.required && !v.present)
      .map((v) => v.service);

    return {
      environment: process.env.NODE_ENV || "development",
      totalConfigs,
      configuredCount,
      validCount,
      missingRequired,
    };
  }

  /**
   * Generate secure configuration for production deployment
   */
  generateSecureConfig(): {
    recommendations: string[];
    warnings: string[];
    securityScore: number;
  } {
    const validation = this.validateConfiguration();
    const recommendations: string[] = [];
    const warnings: string[] = [];
    let securityScore = 100;

    // Check for development/demo keys
    for (const v of validation.validations) {
      const value = process.env[v.key];
      if (value) {
        // Check for common insecure patterns
        if (
          value.includes("demo") ||
          value.includes("test") ||
          value.includes("dev")
        ) {
          warnings.push(`${v.service} appears to use a development key`);
          securityScore -= 15;
        }

        if (value.length < 20 && v.required) {
          warnings.push(`${v.service} key appears too short`);
          securityScore -= 10;
        }
      }
    }

    // Security recommendations
    if (process.env.NODE_ENV !== "production") {
      recommendations.push("Set NODE_ENV=production for production deployment");
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 64) {
      recommendations.push(
        "Use a longer JWT secret (64+ characters) for better security",
      );
      securityScore -= 10;
    }

    if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 64) {
      recommendations.push(
        "Use a longer encryption key (64+ characters) for better security",
      );
      securityScore -= 10;
    }

    recommendations.push("Regularly rotate API keys and secrets");
    recommendations.push("Use environment-specific configurations");
    recommendations.push("Monitor API key usage and set up alerts");

    return {
      recommendations,
      warnings,
      securityScore: Math.max(0, securityScore),
    };
  }

  private getValidationMessage(
    service: string,
    present: boolean,
    valid: boolean,
    required: boolean,
  ): string {
    if (!present && required) {
      return `❌ ${service} configuration is required but missing`;
    }
    if (!present && !required) {
      return `⚠️ ${service} configuration is optional and not configured`;
    }
    if (present && !valid) {
      return `❌ ${service} configuration is present but invalid format`;
    }
    if (present && valid) {
      return `✅ ${service} configuration is properly configured`;
    }
    return `❓ ${service} configuration status unknown`;
  }

  /**
   * Safe logging that doesn't expose sensitive data
   */
  logConfigurationStatus(): void {
    const status = this.getEnvironmentStatus();
    const secureConfig = this.generateSecureConfig();

    console.log("🔧 Configuration Status:");
    console.log(`   Environment: ${status.environment}`);
    console.log(
      `   Configured: ${status.configuredCount}/${status.totalConfigs}`,
    );
    console.log(`   Valid: ${status.validCount}/${status.totalConfigs}`);
    console.log(`   Security Score: ${secureConfig.securityScore}/100`);

    if (status.missingRequired.length > 0) {
      console.log("⚠️ Missing required configurations:");
      status.missingRequired.forEach((service) => {
        console.log(`   - ${service}`);
      });
    }

    if (secureConfig.warnings.length > 0) {
      console.log("⚠️ Security warnings:");
      secureConfig.warnings.forEach((warning) => {
        console.log(`   - ${warning}`);
      });
    }
  }
}

export const configValidator = new ConfigValidator();
