import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Scale } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-main-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/register" 
            className="inline-flex items-center text-cyber-blue hover:text-cyber-blue-light transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registration
          </Link>
          
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyber-blue to-neon-purple rounded-full flex items-center justify-center">
              <Scale className="w-6 h-6 text-main-bg" />
            </div>
            <div>
              <h1 className="font-orbitron font-bold text-3xl text-glow-cyber">Terms of Service</h1>
              <p className="text-text-muted">Last updated: January 21, 2025</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="glass-card">
          <div className="prose prose-invert max-w-none">
            <div className="space-y-8 text-text-primary">
              
              <section>
                <h2 className="text-2xl font-bold text-cyber-blue mb-4">1. Acceptance of Terms</h2>
                <p className="text-text-muted leading-relaxed">
                  By accessing and using ChatKing ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                  ChatKing is owned and operated by ChatKing. All rights reserved.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-cyber-blue mb-4">2. Description of Service</h2>
                <p className="text-text-muted leading-relaxed mb-4">
                  ChatKing is a next-generation all-in-one AI platform that provides:
                </p>
                <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
                  <li>AI chat capabilities powered by OpenRouter</li>
                  <li>Web search functionality via BraveSearch</li>
                  <li>Vector database and knowledge indexing through Pinecone</li>
                  <li>Scientific calculator with advanced mathematical functions</li>
                  <li>Secure, encrypted data storage using our proprietary CK-Storage system</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-cyber-blue mb-4">3. User Accounts</h2>
                <p className="text-text-muted leading-relaxed mb-4">
                  To access certain features of the Service, you must create an account. You agree to:
                </p>
                <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your account information</li>
                  <li>Keep your password secure and confidential</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-cyber-blue mb-4">4. Privacy and Data Protection</h2>
                <p className="text-text-muted leading-relaxed mb-4">
                  ChatKing is committed to protecting your privacy:
                </p>
                <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
                  <li>All data is encrypted using industry-standard encryption</li>
                  <li>We use our proprietary CK-Storage system for secure, local data storage</li>
                  <li>No personal data is shared with third parties without explicit consent</li>
                  <li>You maintain full ownership and control of your data</li>
                  <li>Data can be exported or deleted at any time upon request</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-cyber-blue mb-4">5. Acceptable Use</h2>
                <p className="text-text-muted leading-relaxed mb-4">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Distribute harmful, offensive, or inappropriate content</li>
                  <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
                  <li>Interfere with or disrupt the Service or servers</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-cyber-blue mb-4">6. Intellectual Property</h2>
                <p className="text-text-muted leading-relaxed">
                  The Service and its original content, features, and functionality are and will remain the exclusive property of 
                  ChatKing and its licensors. The Service is protected by copyright, trademark, and other laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-cyber-blue mb-4">7. API Usage and Third-Party Services</h2>
                <p className="text-text-muted leading-relaxed mb-4">
                  ChatKing integrates with third-party services including:
                </p>
                <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
                  <li>OpenRouter for AI chat capabilities</li>
                  <li>BraveSearch for web search functionality</li>
                  <li>Pinecone for vector database operations</li>
                </ul>
                <p className="text-text-muted leading-relaxed">
                  These integrations are subject to their respective terms of service and privacy policies.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-cyber-blue mb-4">8. Limitation of Liability</h2>
                <p className="text-text-muted leading-relaxed">
                  ChatKing shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
                  including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-cyber-blue mb-4">9. Termination</h2>
                <p className="text-text-muted leading-relaxed">
                  We may terminate or suspend your account and bar access to the Service immediately, without prior notice 
                  or liability, under our sole discretion, for any reason whatsoever and without limitation.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-cyber-blue mb-4">10. Changes to Terms</h2>
                <p className="text-text-muted leading-relaxed">
                  We reserve the right to modify or replace these Terms at any time. If a revision is material, 
                  we will provide at least 30 days notice prior to any new terms taking effect.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-cyber-blue mb-4">11. Contact Information</h2>
                <p className="text-text-muted leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us through the platform 
                  or reach out to our support team.
                </p>
              </section>

              <section className="border-t border-border-glow pt-6">
                <p className="text-text-muted text-sm">
                  © 2025 ChatKing. Owned and Operated by ChatKing. All rights reserved.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
