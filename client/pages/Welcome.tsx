import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Zap, Globe, Database, Calculator, CheckCircle, ArrowRight } from 'lucide-react';

export default function Welcome() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    {
      title: 'Welcome to ChatKing!',
      description: 'You are now the owner of this ChatKing platform with full administrative access.',
      icon: Crown,
      color: 'text-neon-amber'
    },
    {
      title: 'ChatKing AI',
      description: 'Access powerful AI models through OpenRouter including DeepSeek R1 and Gemma 3 27B.',
      icon: Zap,
      color: 'text-cyber-blue'
    },
    {
      title: 'ChatKing Web',
      description: 'Browse the web with privacy-focused search powered by BraveSearch.',
      icon: Globe,
      color: 'text-neon-green'
    },
    {
      title: 'Pinecone Index',
      description: 'Store and search your knowledge using advanced vector database technology.',
      icon: Database,
      color: 'text-neon-purple'
    },
    {
      title: 'Calculator',
      description: 'Perform scientific calculations with full history and advanced mathematical functions.',
      icon: Calculator,
      color: 'text-neon-amber'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/');
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-main-bg flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-blue/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-green/3 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="w-full max-w-2xl relative">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-text-muted">Step {currentStep + 1} of {steps.length}</span>
            <button 
              onClick={handleSkip}
              className="text-sm text-cyber-blue hover:text-cyber-blue-light transition-colors"
            >
              Skip Tour
            </button>
          </div>
          <div className="w-full bg-secondary-bg rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cyber-blue to-neon-purple h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Welcome Card */}
        <div className="glass-card text-center">
          <div className="mb-8">
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r ${
              currentStep === 0 ? 'from-neon-amber to-yellow-400' :
              currentStep === 1 ? 'from-cyber-blue to-blue-400' :
              currentStep === 2 ? 'from-neon-green to-green-400' :
              currentStep === 3 ? 'from-neon-purple to-purple-400' :
              'from-neon-amber to-yellow-400'
            } flex items-center justify-center`}>
              <Icon className="w-10 h-10 text-main-bg" />
            </div>

            <h1 className="font-orbitron font-bold text-3xl text-glow-cyber mb-4">
              {currentStepData.title}
            </h1>
            
            <p className="text-text-muted text-lg max-w-lg mx-auto leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Features Overview for first step */}
          {currentStep === 0 && (
            <div className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {steps.slice(1).map((step, index) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={index} className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-secondary-bg flex items-center justify-center">
                        <StepIcon className={`w-6 h-6 ${step.color}`} />
                      </div>
                      <p className="text-xs text-text-muted">{step.title.replace('ChatKing ', '')}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Feature Details for other steps */}
          {currentStep > 0 && (
            <div className="mb-8">
              <div className="bg-secondary-bg rounded-lg p-6">
                <h3 className="font-semibold text-lg text-text-primary mb-4">What you can do:</h3>
                <div className="space-y-3 text-left">
                  {currentStep === 1 && (
                    <>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-text-muted">Chat with advanced AI models</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-text-muted">Switch between different AI models</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-text-muted">Save and manage chat history</span>
                      </div>
                    </>
                  )}
                  {currentStep === 2 && (
                    <>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-text-muted">Search web, images, videos, and news</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-text-muted">Browse with privacy protection</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-text-muted">Use incognito mode for private browsing</span>
                      </div>
                    </>
                  )}
                  {currentStep === 3 && (
                    <>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-text-muted">Create and manage vector indexes</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-text-muted">Upload and search documents</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-text-muted">Build your personal knowledge base</span>
                      </div>
                    </>
                  )}
                  {currentStep === 4 && (
                    <>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-text-muted">Perform advanced mathematical calculations</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-text-muted">Access scientific functions and constants</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-text-muted">Review calculation history</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-cyber-blue' : 'bg-border-glow'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="btn-cyber flex items-center space-x-2"
            >
              <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Owner Badge */}
        {currentStep === 0 && (
          <div className="mt-6 glass-card">
            <div className="flex items-center justify-center space-x-2 text-neon-amber">
              <Crown className="w-5 h-5" />
              <span className="font-medium">Platform Owner Access Granted</span>
            </div>
            <p className="text-text-muted text-sm text-center mt-2">
              You have full administrative control over this ChatKing instance
            </p>
          </div>
        )}

        {/* Copyright */}
        <div className="mt-8 text-center">
          <p className="text-xs text-text-muted">
            © 2025 ChatKing. Owned and Operated by ChatKing. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
