import { useState, useEffect } from 'react';
import { Calculator as CalcIcon, History, Sigma, Delete, RotateCcw, Settings, Trash2 } from 'lucide-react';
import { Layout } from '../components/Layout';

interface CalculationResult {
  expression: string;
  result: string;
  isValid: boolean;
  error?: string;
  type: 'basic' | 'scientific' | 'programming';
}

interface CalculatorLog {
  id: string;
  expression: string;
  result: string;
  timestamp: string;
}

interface Constant {
  value: number;
  description: string;
  symbol: string;
}

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [previousResult, setPreviousResult] = useState('');
  const [isNewCalculation, setIsNewCalculation] = useState(true);
  const [mode, setMode] = useState<'basic' | 'scientific' | 'programming'>('basic');
  const [showHistory, setShowHistory] = useState(false);
  const [showConstants, setShowConstants] = useState(false);
  const [history, setHistory] = useState<CalculatorLog[]>([]);
  const [constants, setConstants] = useState<{ mathematical: Record<string, Constant>, physical: Record<string, Constant> }>({
    mathematical: {},
    physical: {}
  });
  const [userId] = useState('demo-user'); // In real app, get from auth

  useEffect(() => {
    loadHistory();
    loadConstants();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch(`/api/calculator/history/${userId}`);
      const data = await response.json();
      if (data.history) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to load calculator history:', error);
    }
  };

  const loadConstants = async () => {
    try {
      const response = await fetch('/api/calculator/constants');
      const data = await response.json();
      if (data.constants) {
        setConstants(data.constants);
      }
    } catch (error) {
      console.error('Failed to load constants:', error);
    }
  };

  const handleButtonClick = (value: string) => {
    if (value === '=') {
      calculate();
    } else if (value === 'C') {
      clear();
    } else if (value === 'CE') {
      clearEntry();
    } else if (value === '⌫') {
      backspace();
    } else if (value === 'Ans') {
      insertValue(previousResult || '0');
    } else {
      insertValue(value);
    }
  };

  const insertValue = (value: string) => {
    if (isNewCalculation && !isNaN(Number(value))) {
      setDisplay(value);
      setIsNewCalculation(false);
    } else {
      setDisplay(prev => prev === '0' ? value : prev + value);
      setIsNewCalculation(false);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousResult('');
    setIsNewCalculation(true);
  };

  const clearEntry = () => {
    setDisplay('0');
    setIsNewCalculation(true);
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(prev => prev.slice(0, -1));
    } else {
      setDisplay('0');
      setIsNewCalculation(true);
    }
  };

  const calculate = async () => {
    try {
      const response = await fetch('/api/calculator/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expression: display,
          userId: userId
        })
      });

      const result: CalculationResult = await response.json();

      if (result.isValid) {
        setDisplay(result.result);
        setPreviousResult(result.result);
        setIsNewCalculation(true);
        loadHistory(); // Refresh history
      } else {
        setDisplay('Error: ' + (result.error || 'Invalid expression'));
        setIsNewCalculation(true);
      }
    } catch (error) {
      setDisplay('Error: Network error');
      setIsNewCalculation(true);
    }
  };

  const clearHistory = async () => {
    try {
      await fetch('/api/calculator/clear-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const insertFromHistory = (expression: string) => {
    setDisplay(expression);
    setIsNewCalculation(false);
    setShowHistory(false);
  };

  const insertConstant = (value: number) => {
    insertValue(value.toString());
    setShowConstants(false);
  };

  const renderBasicButtons = () => (
    <div className="grid grid-cols-4 gap-3">
      {/* Row 1 */}
      <button onClick={() => handleButtonClick('C')} className="btn-calc btn-operator">C</button>
      <button onClick={() => handleButtonClick('CE')} className="btn-calc btn-operator">CE</button>
      <button onClick={() => handleButtonClick('⌫')} className="btn-calc btn-operator">⌫</button>
      <button onClick={() => handleButtonClick('/')} className="btn-calc btn-operator">÷</button>
      
      {/* Row 2 */}
      <button onClick={() => handleButtonClick('7')} className="btn-calc">7</button>
      <button onClick={() => handleButtonClick('8')} className="btn-calc">8</button>
      <button onClick={() => handleButtonClick('9')} className="btn-calc">9</button>
      <button onClick={() => handleButtonClick('*')} className="btn-calc btn-operator">×</button>
      
      {/* Row 3 */}
      <button onClick={() => handleButtonClick('4')} className="btn-calc">4</button>
      <button onClick={() => handleButtonClick('5')} className="btn-calc">5</button>
      <button onClick={() => handleButtonClick('6')} className="btn-calc">6</button>
      <button onClick={() => handleButtonClick('-')} className="btn-calc btn-operator">−</button>
      
      {/* Row 4 */}
      <button onClick={() => handleButtonClick('1')} className="btn-calc">1</button>
      <button onClick={() => handleButtonClick('2')} className="btn-calc">2</button>
      <button onClick={() => handleButtonClick('3')} className="btn-calc">3</button>
      <button onClick={() => handleButtonClick('+')} className="btn-calc btn-operator">+</button>
      
      {/* Row 5 */}
      <button onClick={() => handleButtonClick('0')} className="btn-calc col-span-2">0</button>
      <button onClick={() => handleButtonClick('.')} className="btn-calc">.</button>
      <button onClick={() => handleButtonClick('=')} className="btn-calc btn-equals">=</button>
    </div>
  );

  const renderScientificButtons = () => (
    <div className="grid grid-cols-5 gap-2 text-sm">
      {/* Row 1 - Functions */}
      <button onClick={() => handleButtonClick('sin(')} className="btn-calc btn-function">sin</button>
      <button onClick={() => handleButtonClick('cos(')} className="btn-calc btn-function">cos</button>
      <button onClick={() => handleButtonClick('tan(')} className="btn-calc btn-function">tan</button>
      <button onClick={() => handleButtonClick('log(')} className="btn-calc btn-function">log</button>
      <button onClick={() => handleButtonClick('ln(')} className="btn-calc btn-function">ln</button>
      
      {/* Row 2 - Inverse Functions */}
      <button onClick={() => handleButtonClick('asin(')} className="btn-calc btn-function">sin⁻¹</button>
      <button onClick={() => handleButtonClick('acos(')} className="btn-calc btn-function">cos⁻¹</button>
      <button onClick={() => handleButtonClick('atan(')} className="btn-calc btn-function">tan⁻¹</button>
      <button onClick={() => handleButtonClick('10^(')} className="btn-calc btn-function">10ˣ</button>
      <button onClick={() => handleButtonClick('exp(')} className="btn-calc btn-function">eˣ</button>
      
      {/* Row 3 - Powers & Roots */}
      <button onClick={() => handleButtonClick('^2')} className="btn-calc btn-function">x²</button>
      <button onClick={() => handleButtonClick('^3')} className="btn-calc btn-function">x³</button>
      <button onClick={() => handleButtonClick('^(')} className="btn-calc btn-function">xʸ</button>
      <button onClick={() => handleButtonClick('sqrt(')} className="btn-calc btn-function">√</button>
      <button onClick={() => handleButtonClick('cbrt(')} className="btn-calc btn-function">∛</button>
      
      {/* Row 4 - Constants & Special */}
      <button onClick={() => handleButtonClick('pi')} className="btn-calc btn-constant">π</button>
      <button onClick={() => handleButtonClick('e')} className="btn-calc btn-constant">e</button>
      <button onClick={() => handleButtonClick('(')} className="btn-calc btn-operator">(</button>
      <button onClick={() => handleButtonClick(')')} className="btn-calc btn-operator">)</button>
      <button onClick={() => handleButtonClick('Ans')} className="btn-calc btn-constant">Ans</button>
      
      {/* Row 5 - Additional */}
      <button onClick={() => handleButtonClick('factorial(')} className="btn-calc btn-function">n!</button>
      <button onClick={() => handleButtonClick('abs(')} className="btn-calc btn-function">|x|</button>
      <button onClick={() => handleButtonClick('floor(')} className="btn-calc btn-function">⌊x⌋</button>
      <button onClick={() => handleButtonClick('ceil(')} className="btn-calc btn-function">⌈x⌉</button>
      <button onClick={() => handleButtonClick('round(')} className="btn-calc btn-function">round</button>
    </div>
  );

  return (
    <Layout isAuthenticated={true} isOwner={true} username="Owner">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-amber to-yellow-400 flex items-center justify-center">
              <CalcIcon className="w-8 h-8 text-main-bg" />
            </div>
            <h1 className="font-orbitron font-bold text-4xl text-glow-cyber mb-2">
              Scientific Calculator
            </h1>
            <p className="text-text-muted">
              Advanced calculations with full history tracking
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Calculator */}
            <div className="lg:col-span-3">
              <div className="glass-card">
                {/* Display */}
                <div className="mb-6">
                  <div className="bg-secondary-bg border border-border-glow rounded-lg p-4 min-h-[80px] flex items-center justify-end">
                    <div className="text-right">
                      {previousResult && (
                        <div className="text-text-muted text-sm mb-1">
                          Ans = {previousResult}
                        </div>
                      )}
                      <div className="text-text-primary text-2xl md:text-3xl font-mono break-all">
                        {display}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setMode('basic')}
                      className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                        mode === 'basic'
                          ? 'bg-cyber-blue text-main-bg'
                          : 'bg-secondary-bg text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Basic
                    </button>
                    <button
                      onClick={() => setMode('scientific')}
                      className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                        mode === 'scientific'
                          ? 'bg-cyber-blue text-main-bg'
                          : 'bg-secondary-bg text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Scientific
                    </button>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowConstants(!showConstants)}
                      className="p-2 rounded hover:bg-cyber-blue/10 transition-colors"
                    >
                      <Sigma className="w-5 h-5 text-cyber-blue" />
                    </button>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="p-2 rounded hover:bg-cyber-blue/10 transition-colors"
                    >
                      <History className="w-5 h-5 text-cyber-blue" />
                    </button>
                  </div>
                </div>

                {/* Constants Panel */}
                {showConstants && (
                  <div className="mb-6 p-4 bg-secondary-bg rounded-lg border border-border-glow">
                    <h3 className="font-semibold text-lg mb-3 text-text-primary">Constants</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(constants.mathematical).map(([key, constant]) => (
                        <button
                          key={key}
                          onClick={() => insertConstant(constant.value)}
                          className="p-2 text-left rounded border border-border-glow hover:border-cyber-blue/50 transition-colors"
                        >
                          <div className="font-medium text-cyber-blue">{constant.symbol}</div>
                          <div className="text-xs text-text-muted">{constant.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Button Grid */}
                <div className="space-y-4">
                  {mode === 'scientific' && renderScientificButtons()}
                  {renderBasicButtons()}
                </div>
              </div>
            </div>

            {/* History Sidebar */}
            <div className="lg:col-span-1">
              <div className="glass-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-text-primary">History</h3>
                  <button
                    onClick={clearHistory}
                    className="p-2 rounded hover:bg-neon-red/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-neon-red" />
                  </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => insertFromHistory(entry.expression)}
                      className="w-full text-left p-3 rounded border border-border-glow hover:border-cyber-blue/50 transition-colors"
                    >
                      <div className="text-sm text-text-primary font-mono">
                        {entry.expression}
                      </div>
                      <div className="text-xs text-cyber-blue font-mono">
                        = {entry.result}
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </button>
                  ))}
                  
                  {history.length === 0 && (
                    <div className="text-center text-text-muted py-8">
                      No calculations yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .btn-calc {
          @apply bg-secondary-bg hover:bg-border-glow text-text-primary font-medium py-3 px-4 rounded border border-border-glow transition-all hover:border-cyber-blue/50;
        }
        
        .btn-operator {
          @apply bg-cyber-blue/20 text-cyber-blue hover:bg-cyber-blue/30;
        }
        
        .btn-function {
          @apply bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 text-xs;
        }
        
        .btn-constant {
          @apply bg-neon-amber/20 text-neon-amber hover:bg-neon-amber/30;
        }
        
        .btn-equals {
          @apply bg-neon-green/20 text-neon-green hover:bg-neon-green/30 font-bold;
        }
      `}</style>
    </Layout>
  );
}
