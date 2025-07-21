import { RequestHandler } from "express";
import { apiKeyManager } from "../services/apikeys";
import { ckStorage } from "../storage/ck-storage";

interface UpdateApiKeyRequest {
  keyId: string;
  newKey: string;
  userId: string;
}

interface TestApiKeyRequest {
  service: string;
  key: string;
  userId: string;
}

interface RotateApiKeyRequest {
  keyId: string;
  userId: string;
}

export const handleGetApiKeys: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID required",
      });
    }

    // Verify user is owner
    const user = await ckStorage.getUser(userId);
    if (!user?.isOwner) {
      return res.status(403).json({
        success: false,
        error: "Access denied: Only owners can view API keys",
      });
    }

    const apiKeys = await apiKeyManager.getApiKeys(userId);

    res.json({
      success: true,
      apiKeys,
    });
  } catch (error) {
    console.error("Get API Keys Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get API keys",
    });
  }
};

export const handleUpdateApiKey: RequestHandler = async (req, res) => {
  try {
    const { keyId, newKey, userId }: UpdateApiKeyRequest = req.body;

    if (!keyId || !newKey || !userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: keyId, newKey, userId",
      });
    }

    const success = await apiKeyManager.updateApiKey(userId, keyId, newKey);

    if (success) {
      res.json({
        success: true,
        message: "API key updated successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Failed to update API key",
      });
    }
  } catch (error) {
    console.error("Update API Key Error:", error);
    res.status(500).json({
      success: false,
      error: "API key update failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleTestApiKey: RequestHandler = async (req, res) => {
  try {
    const { service, key, userId }: TestApiKeyRequest = req.body;

    if (!service || !key || !userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: service, key, userId",
      });
    }

    // Verify user is owner
    const user = await ckStorage.getUser(userId);
    if (!user?.isOwner) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const isValid = await apiKeyManager.testApiKey(service, key);

    res.json({
      success: true,
      isValid,
      service,
    });
  } catch (error) {
    console.error("Test API Key Error:", error);
    res.status(500).json({
      success: false,
      error: "API key test failed",
    });
  }
};

export const handleRotateApiKey: RequestHandler = async (req, res) => {
  try {
    const { keyId, userId }: RotateApiKeyRequest = req.body;

    if (!keyId || !userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: keyId, userId",
      });
    }

    const newKey = await apiKeyManager.rotateApiKey(userId, keyId);

    if (newKey) {
      res.json({
        success: true,
        newKey,
        message: "API key rotated successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Failed to rotate API key",
      });
    }
  } catch (error) {
    console.error("Rotate API Key Error:", error);
    res.status(500).json({
      success: false,
      error: "API key rotation failed",
    });
  }
};

export const handleGetApiKeyUsage: RequestHandler = async (req, res) => {
  try {
    const { keyId } = req.params;
    const { userId, days = 30 } = req.query;

    if (!keyId || !userId) {
      return res.status(400).json({
        success: false,
        error: "Key ID and User ID required",
      });
    }

    // Verify user is owner
    const user = await ckStorage.getUser(userId as string);
    if (!user?.isOwner) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const usage = await apiKeyManager.getApiKeyUsage(
      userId as string,
      keyId,
      parseInt(days as string),
    );

    res.json({
      success: true,
      usage,
    });
  } catch (error) {
    console.error("Get API Key Usage Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get API key usage",
    });
  }
};

export const handleGetSystemApiHealth: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.query;

    // Verify user is owner
    const user = await ckStorage.getUser(userId as string);
    if (!user?.isOwner) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const health = await apiKeyManager.getSystemApiHealth();

    res.json({
      success: true,
      health,
    });
  } catch (error) {
    console.error("Get System API Health Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get system API health",
    });
  }
};

export const handleValidateAllApiKeys: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID required",
      });
    }

    // Verify user is owner
    const user = await ckStorage.getUser(userId);
    if (!user?.isOwner) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const apiKeys = await apiKeyManager.getApiKeys(userId);
    const validationResults = await Promise.all(
      apiKeys.map(async (key) => {
        const isValid = await apiKeyManager.testApiKey(key.service, key.key);
        return {
          keyId: key.id,
          service: key.service,
          isValid,
          lastTested: new Date().toISOString(),
        };
      }),
    );

    // Log analytics
    await ckStorage.logAnalytics("api_keys_validated", {
      userId,
      results: validationResults,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      validationResults,
    });
  } catch (error) {
    console.error("Validate All API Keys Error:", error);
    res.status(500).json({
      success: false,
      error: "API key validation failed",
    });
  }
};
