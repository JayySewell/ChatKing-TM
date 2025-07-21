import { evaluate } from 'mathjs';

export interface CalculationResult {
  expression: string;
  result: string;
  isValid: boolean;
  error?: string;
  type: 'basic' | 'scientific' | 'programming';
}

export class CalculatorService {
  private mathFunctions = {
    // Basic operations are handled by mathjs
    
    // Scientific functions
    'sin': Math.sin,
    'cos': Math.cos,
    'tan': Math.tan,
    'asin': Math.asin,
    'acos': Math.acos,
    'atan': Math.atan,
    'sinh': Math.sinh,
    'cosh': Math.cosh,
    'tanh': Math.tanh,
    'log': Math.log10,
    'ln': Math.log,
    'exp': Math.exp,
    'sqrt': Math.sqrt,
    'cbrt': Math.cbrt,
    'abs': Math.abs,
    'floor': Math.floor,
    'ceil': Math.ceil,
    'round': Math.round,
    'factorial': this.factorial,
    'gcd': this.gcd,
    'lcm': this.lcm,
    'isPrime': this.isPrime,
    
    // Constants
    'pi': Math.PI,
    'e': Math.E,
    'phi': (1 + Math.sqrt(5)) / 2, // Golden ratio
  };

  calculate(expression: string): CalculationResult {
    try {
      // Clean and prepare the expression
      const cleanExpression = this.preprocessExpression(expression);
      
      // Determine calculation type
      const type = this.determineCalculationType(cleanExpression);
      
      // Evaluate using mathjs
      const result = evaluate(cleanExpression);
      
      // Format result
      const formattedResult = this.formatResult(result);
      
      return {
        expression: expression,
        result: formattedResult,
        isValid: true,
        type
      };
    } catch (error) {
      return {
        expression: expression,
        result: '0',
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid expression',
        type: 'basic'
      };
    }
  }

  private preprocessExpression(expr: string): string {
    // Replace common notation
    let processed = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'pi')
      .replace(/\^/g, '**')
      .replace(/√/g, 'sqrt')
      .replace(/∛/g, 'cbrt')
      .replace(/∞/g, 'Infinity')
      .replace(/−/g, '-')
      .trim();

    // Handle implicit multiplication (e.g., 2π becomes 2*pi)
    processed = processed.replace(/(\d+)(pi|e|phi)/g, '$1*$2');
    processed = processed.replace(/(\d+)(\()/g, '$1*$2');
    processed = processed.replace(/(\))(\d+)/g, '$1*$2');
    processed = processed.replace(/(\))(pi|e|phi)/g, '$1*$2');
    processed = processed.replace(/(pi|e|phi)(\()/g, '$1*$2');
    
    return processed;
  }

  private determineCalculationType(expr: string): 'basic' | 'scientific' | 'programming' {
    const scientificFunctions = ['sin', 'cos', 'tan', 'log', 'ln', 'exp', 'sqrt', 'factorial'];
    const programmingFunctions = ['hex', 'bin', 'oct', 'gcd', 'lcm', 'isPrime'];
    
    if (programmingFunctions.some(func => expr.includes(func))) {
      return 'programming';
    }
    
    if (scientificFunctions.some(func => expr.includes(func)) || 
        expr.includes('pi') || expr.includes('e') || expr.includes('phi')) {
      return 'scientific';
    }
    
    return 'basic';
  }

  private formatResult(result: any): string {
    if (typeof result === 'number') {
      // Handle special cases
      if (!isFinite(result)) {
        return result.toString();
      }
      
      // Format large numbers in scientific notation
      if (Math.abs(result) >= 1e15 || (Math.abs(result) < 1e-10 && result !== 0)) {
        return result.toExponential(10);
      }
      
      // Round to avoid floating point precision issues
      const rounded = Math.round(result * 1e12) / 1e12;
      
      // Format with appropriate decimal places
      if (rounded % 1 === 0) {
        return rounded.toString();
      } else {
        return rounded.toString();
      }
    }
    
    return result.toString();
  }

  private factorial(n: number): number {
    if (n < 0 || !Number.isInteger(n)) {
      throw new Error('Factorial is only defined for non-negative integers');
    }
    if (n > 170) {
      return Infinity; // JavaScript number limit
    }
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  private gcd(a: number, b: number): number {
    a = Math.abs(Math.floor(a));
    b = Math.abs(Math.floor(b));
    
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

  private lcm(a: number, b: number): number {
    return Math.abs(a * b) / this.gcd(a, b);
  }

  private isPrime(n: number): boolean {
    n = Math.floor(n);
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }

  // Base conversion utilities
  convertToBase(number: number, base: number): string {
    if (base < 2 || base > 36) {
      throw new Error('Base must be between 2 and 36');
    }
    return Math.floor(number).toString(base).toUpperCase();
  }

  convertFromBase(value: string, base: number): number {
    if (base < 2 || base > 36) {
      throw new Error('Base must be between 2 and 36');
    }
    return parseInt(value, base);
  }

  // Unit conversions
  convertUnits(value: number, fromUnit: string, toUnit: string): number {
    const conversions: { [key: string]: { [key: string]: number } } = {
      length: {
        m: 1,
        cm: 0.01,
        mm: 0.001,
        km: 1000,
        in: 0.0254,
        ft: 0.3048,
        yd: 0.9144,
        mi: 1609.344
      },
      weight: {
        kg: 1,
        g: 0.001,
        mg: 0.000001,
        lb: 0.453592,
        oz: 0.0283495
      },
      temperature: {
        // Special handling needed for temperature
      }
    };

    // Find the unit category
    for (const category of Object.values(conversions)) {
      if (fromUnit in category && toUnit in category) {
        return (value * category[fromUnit]) / category[toUnit];
      }
    }

    throw new Error(`Cannot convert from ${fromUnit} to ${toUnit}`);
  }
}

export const calculatorService = new CalculatorService();
