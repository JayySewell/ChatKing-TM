import { Router, RequestHandler } from "express";
import { apiKeyService } from "../services/apikeys";
import { authMiddleware } from "../middleware/auth";

const router = Router();

interface StoreApiKeyRequest {
  service: string;
  name: string;
  key: string;
  environment?: string;
}

interface TestApiKeyRequest {
  service: string;
  key: string;
}

interface UpdateEnvironmentRequest {
  variables: Record<string, string>;
}

export const handleStoreApiKey: RequestHandler = async (req, res) => {
  try {
    const { service, name, key, environment }: StoreApiKeyRequest = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!service || !name || !key) {
      return res.status(400).json({
        error: "Missing required fields: service, name, key",
      });
    }

    // Validate the API key format
    const isValid = await apiKeyService.validateApiKey(service, key);
    if (!isValid) {
      return res.status(400).json({
        error: "Invalid API key format for the specified service",
      });
    }

    // Test the API key if possible
    const testResult = await apiKeyService.testApiKey(service, key);
    if (!testResult.valid) {
      return res.status(400).json({
        error: "API key failed validation test",
        details: testResult.error,
      });
    }

    const success = await apiKeyService.storeApiKey(userId, service, {
      name,
      key,
      environment,
      isActive: true,
    });

    if (success) {
      res.json({
        success: true,
        service,
        name,
        message: "API key stored successfully",
      });
    } else {
      res.status(500).json({
        error: "Failed to store API key",
      });
    }
  } catch (error) {
    console.error("Store API Key Error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetApiKeys: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const apiKeys = await apiKeyService.listApiKeys(userId);

    res.json({
      apiKeys,
      count: Object.keys(apiKeys).length,
    });
  } catch (error) {
    console.error("Get API Keys Error:", error);
    res.status(500).json({
      error: "Failed to retrieve API keys",
    });
  }
};

export const handleDeleteApiKey: RequestHandler = async (req, res) => {
  try {
    const { service } = req.params;
    const userId = req.user?.id || 'anonymous';

    if (!service) {
      return res.status(400).json({
        error: "Service name required",
      });
    }

    const success = await apiKeyService.deleteApiKey(userId, service);

    if (success) {
      res.json({
        success: true,
        service,
        message: "API key deleted successfully",
      });
    } else {
      res.status(404).json({
        error: "API key not found or failed to delete",
      });
    }
  } catch (error) {
    console.error("Delete API Key Error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const handleTestApiKey: RequestHandler = async (req, res) => {
  try {
    const { service, key }: TestApiKeyRequest = req.body;

    if (!service || !key) {
      return res.status(400).json({
        error: "Missing required fields: service, key",
      });
    }

    const result = await apiKeyService.testApiKey(service, key);

    res.json({
      service,
      valid: result.valid,
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Test API Key Error:", error);
    res.status(500).json({
      error: "Failed to test API key",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleUpdateEnvironment: RequestHandler = async (req, res) => {
  try {
    const { variables }: UpdateEnvironmentRequest = req.body;

    if (!variables || typeof variables !== 'object') {
      return res.status(400).json({
        error: "Variables object required",
      });
    }

    await apiKeyService.updateEnvironmentVariables(variables);

    res.json({
      success: true,
      message: "Environment variables updated successfully",
      updatedCount: Object.keys(variables).length,
    });
  } catch (error) {
    console.error("Update Environment Error:", error);
    res.status(500).json({
      error: "Failed to update environment variables",
    });
  }
};

export const handleGetEnvironment: RequestHandler = async (req, res) => {
  try {
    const variables = apiKeyService.getEnvironmentVariables();

    // Mask sensitive values for security
    const masked = Object.keys(variables).reduce((acc, key) => {
      const value = variables[key];
      if (value) {
        acc[key] = value.substring(0, 8) + '***' + value.substring(value.length - 4);
      } else {
        acc[key] = null;
      }
      return acc;
    }, {} as Record<string, string | null>);

    res.json({
      variables: masked,
      count: Object.keys(variables).length,
    });
  } catch (error) {
    console.error("Get Environment Error:", error);
    res.status(500).json({
      error: "Failed to retrieve environment variables",
    });
  }
};

export const handleInitializeDefaults: RequestHandler = async (req, res) => {
  try {
    await apiKeyService.initializeDefaultKeys();

    res.json({
      success: true,
      message: "Default API keys initialized successfully",
    });
  } catch (error) {
    console.error("Initialize Defaults Error:", error);
    res.status(500).json({
      error: "Failed to initialize default API keys",
    });
  }
};

// Routes
router.post('/store', authMiddleware, handleStoreApiKey);
router.get('/list', authMiddleware, handleGetApiKeys);
router.delete('/:service', authMiddleware, handleDeleteApiKey);
router.post('/test', authMiddleware, handleTestApiKey);
router.put('/environment', authMiddleware, handleUpdateEnvironment);
router.get('/environment', authMiddleware, handleGetEnvironment);
router.post('/initialize', authMiddleware, handleInitializeDefaults);

export default router;
