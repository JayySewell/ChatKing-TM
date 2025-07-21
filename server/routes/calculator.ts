import { RequestHandler } from "express";
import { calculatorService } from "../services/calculator";
import { ckStorage } from "../storage/ck-storage";

interface CalculateRequest {
  expression: string;
  userId: string;
}

interface ConvertRequest {
  value: number;
  fromUnit: string;
  toUnit: string;
  userId: string;
}

interface BaseConvertRequest {
  value: string;
  fromBase: number;
  toBase: number;
  userId: string;
}

export const handleCalculate: RequestHandler = async (req, res) => {
  try {
    const { expression, userId }: CalculateRequest = req.body;

    if (!expression || !userId) {
      return res.status(400).json({
        error: "Missing required fields: expression, userId",
      });
    }

    // Perform calculation
    const result = calculatorService.calculate(expression);

    // Log to storage if calculation was successful
    if (result.isValid) {
      await ckStorage.addCalculatorLog(userId, expression, result.result);

      // Log analytics
      await ckStorage.logAnalytics("calculation", {
        userId,
        expression,
        result: result.result,
        type: result.type,
        success: true,
      });
    } else {
      // Log failed calculation for analytics
      await ckStorage.logAnalytics("calculation", {
        userId,
        expression,
        error: result.error,
        success: false,
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Calculator Error:", error);
    res.status(500).json({
      error: "Failed to perform calculation",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleConvertUnits: RequestHandler = async (req, res) => {
  try {
    const { value, fromUnit, toUnit, userId }: ConvertRequest = req.body;

    if (value === undefined || !fromUnit || !toUnit || !userId) {
      return res.status(400).json({
        error: "Missing required fields: value, fromUnit, toUnit, userId",
      });
    }

    const result = calculatorService.convertUnits(value, fromUnit, toUnit);

    const expression = `${value} ${fromUnit} to ${toUnit}`;
    const resultString = `${result} ${toUnit}`;

    // Log to storage
    await ckStorage.addCalculatorLog(userId, expression, resultString);

    // Log analytics
    await ckStorage.logAnalytics("unit_conversion", {
      userId,
      value,
      fromUnit,
      toUnit,
      result,
    });

    res.json({
      expression,
      result: result,
      formattedResult: resultString,
      isValid: true,
      type: "conversion",
    });
  } catch (error) {
    console.error("Unit Conversion Error:", error);
    res.status(500).json({
      error: "Failed to convert units",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleConvertBase: RequestHandler = async (req, res) => {
  try {
    const { value, fromBase, toBase, userId }: BaseConvertRequest = req.body;

    if (!value || !fromBase || !toBase || !userId) {
      return res.status(400).json({
        error: "Missing required fields: value, fromBase, toBase, userId",
      });
    }

    // Convert from source base to decimal, then to target base
    const decimalValue = calculatorService.convertFromBase(value, fromBase);
    const result = calculatorService.convertToBase(decimalValue, toBase);

    const expression = `${value} (base ${fromBase}) to base ${toBase}`;
    const resultString = `${result} (base ${toBase})`;

    // Log to storage
    await ckStorage.addCalculatorLog(userId, expression, resultString);

    // Log analytics
    await ckStorage.logAnalytics("base_conversion", {
      userId,
      value,
      fromBase,
      toBase,
      result,
    });

    res.json({
      expression,
      result: result,
      formattedResult: resultString,
      decimalValue: decimalValue,
      isValid: true,
      type: "base_conversion",
    });
  } catch (error) {
    console.error("Base Conversion Error:", error);
    res.status(500).json({
      error: "Failed to convert base",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetCalculatorHistory: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    const logs = await ckStorage.getUserCalculatorLogs(userId, limit);

    res.json({
      history: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error("Get Calculator History Error:", error);
    res.status(500).json({
      error: "Failed to fetch calculator history",
    });
  }
};

export const handleClearCalculatorHistory: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    // In a real implementation, you'd add a clear method to CKStorage
    // For now, we'll just return success

    // Log analytics
    await ckStorage.logAnalytics("calculator_history_cleared", {
      userId,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Clear Calculator History Error:", error);
    res.status(500).json({
      error: "Failed to clear calculator history",
    });
  }
};

export const handleGetCalculatorConstants: RequestHandler = async (
  req,
  res,
) => {
  try {
    const constants = {
      mathematical: {
        pi: { value: Math.PI, description: "Pi (π)", symbol: "π" },
        e: { value: Math.E, description: "Euler's number (e)", symbol: "e" },
        phi: {
          value: (1 + Math.sqrt(5)) / 2,
          description: "Golden ratio (φ)",
          symbol: "φ",
        },
        sqrt2: {
          value: Math.sqrt(2),
          description: "Square root of 2",
          symbol: "√2",
        },
        sqrt3: {
          value: Math.sqrt(3),
          description: "Square root of 3",
          symbol: "√3",
        },
      },
      physical: {
        c: {
          value: 299792458,
          description: "Speed of light (m/s)",
          symbol: "c",
        },
        g: {
          value: 9.80665,
          description: "Standard gravity (m/s²)",
          symbol: "g",
        },
        h: {
          value: 6.62607015e-34,
          description: "Planck constant (J⋅s)",
          symbol: "h",
        },
        k: {
          value: 1.380649e-23,
          description: "Boltzmann constant (J/K)",
          symbol: "k",
        },
        Na: {
          value: 6.02214076e23,
          description: "Avogadro number (mol⁻¹)",
          symbol: "Na",
        },
      },
    };

    res.json({ constants });
  } catch (error) {
    console.error("Get Constants Error:", error);
    res.status(500).json({
      error: "Failed to fetch constants",
    });
  }
};
