import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Database } from "lucide-react";

export default function Privacy() {
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
            <div className="w-12 h-12 bg-gradient-to-r from-neon-green to-green-400 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-main-bg" />
            </div>
            <div>
              <h1 className="font-orbitron font-bold text-3xl text-glow-cyber">
                Privacy Policy
              </h1>
              <p className="text-text-muted">Last updated: January 21, 2025</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="glass-card">
          <div className="prose prose-invert max-w-none">
            <div className="space-y-8 text-text-primary">
              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">
                  1. Our Commitment to Privacy
                </h2>
                <p className="text-text-muted leading-relaxed">
                  ChatKing is committed to protecting your privacy and ensuring
                  the security of your personal information. This Privacy Policy
                  explains how we collect, use, and safeguard your data when you
                  use our platform. ChatKing is owned and operated by ChatKing.
                  All rights reserved.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">
                  2. Information We Collect
                </h2>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-cyber-blue mb-3 flex items-center">
                    <Lock className="w-5 h-5 mr-2" />
                    Account Information
                  </h3>
                  <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
                    <li>Username and display name</li>
                    <li>Email address (for account management and security)</li>
                    <li>Account preferences and settings</li>
                    <li>Authentication data (securely hashed passwords)</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-cyber-blue mb-3 flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    Usage Data
                  </h3>
                  <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
                    <li>Chat conversations and AI interactions</li>
                    <li>Search queries and results</li>
                    <li>Calculator usage and computation history</li>
                    <li>Pinecone index data and vector searches</li>
                    <li>System performance and analytics data</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">
                  3. CK-Storage: Our Private Data Engine
                </h2>
                <div className="bg-secondary-bg rounded-lg p-6 mb-4">
                  <h3 className="text-lg font-semibold text-cyber-blue mb-3">
                    What makes CK-Storage special:
                  </h3>
                  <ul className="list-disc list-inside text-text-muted space-y-2">
                    <li>
                      <strong>Local Storage:</strong> All your data is stored
                      locally on our servers, not in third-party databases
                    </li>
                    <li>
                      <strong>End-to-End Encryption:</strong> Data is encrypted
                      both in transit and at rest
                    </li>
                    <li>
                      <strong>User Ownership:</strong> You maintain complete
                      ownership and control of your data
                    </li>
                    <li>
                      <strong>No Vendor Lock-in:</strong> Your data is portable
                      and can be exported at any time
                    </li>
                    <li>
                      <strong>Zero Third-Party Access:</strong> Your data is
                      never shared with external parties
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">
                  4. How We Use Your Information
                </h2>
                <p className="text-text-muted leading-relaxed mb-4">
                  We use your information exclusively to:
                </p>
                <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
                  <li>Provide and maintain the ChatKing service</li>
                  <li>Process AI chat requests through OpenRouter</li>
                  <li>Execute web searches via BraveSearch</li>
                  <li>Manage vector data through Pinecone</li>
                  <li>Improve platform performance and user experience</li>
                  <li>Ensure system security and prevent abuse</li>
                  <li>Communicate important updates and security notices</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">
                  5. Data Sharing and Third Parties
                </h2>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-cyber-blue mb-3">
                    API Partners
                  </h3>
                  <p className="text-text-muted leading-relaxed mb-3">
                    ChatKing integrates with the following third-party APIs to
                    provide services:
                  </p>
                  <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
                    <li>
                      <strong>OpenRouter:</strong> For AI chat processing (only
                      chat messages are sent)
                    </li>
                    <li>
                      <strong>BraveSearch:</strong> For web search functionality
                      (only search queries)
                    </li>
                    <li>
                      <strong>Pinecone:</strong> For vector database operations
                      (only vector data)
                    </li>
                  </ul>
                </div>

                <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-neon-green mb-2">
                    Our Promise
                  </h3>
                  <p className="text-text-muted">
                    We NEVER share your personal information, account details,
                    or usage patterns with any third party. Only the minimum
                    necessary data for each specific function is transmitted to
                    our API partners.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">
                  6. Data Security
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-secondary-bg rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-cyber-blue mb-3 flex items-center">
                      <Lock className="w-5 h-5 mr-2" />
                      Encryption
                    </h3>
                    <ul className="text-text-muted text-sm space-y-1">
                      <li>• AES-256 encryption for data at rest</li>
                      <li>• TLS 1.3 for data in transit</li>
                      <li>• Encrypted password storage</li>
                      <li>• Secure API communications</li>
                    </ul>
                  </div>

                  <div className="bg-secondary-bg rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-cyber-blue mb-3 flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      Access Control
                    </h3>
                    <ul className="text-text-muted text-sm space-y-1">
                      <li>• Multi-factor authentication support</li>
                      <li>• Role-based access control</li>
                      <li>• Regular security audits</li>
                      <li>• Automated threat detection</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">
                  7. Your Rights and Choices
                </h2>
                <p className="text-text-muted leading-relaxed mb-4">
                  You have complete control over your data:
                </p>
                <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
                  <li>
                    <strong>Access:</strong> View all data associated with your
                    account
                  </li>
                  <li>
                    <strong>Export:</strong> Download your complete data in JSON
                    format
                  </li>
                  <li>
                    <strong>Modify:</strong> Update or correct your personal
                    information
                  </li>
                  <li>
                    <strong>Delete:</strong> Permanently remove your account and
                    all associated data
                  </li>
                  <li>
                    <strong>Opt-out:</strong> Disable analytics and usage
                    tracking
                  </li>
                  <li>
                    <strong>Incognito Mode:</strong> Use services without saving
                    history
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">
                  8. Data Retention
                </h2>
                <p className="text-text-muted leading-relaxed">
                  We retain your data only as long as necessary to provide
                  services or as required by law. You can configure data
                  retention periods in your account settings (30-3650 days).
                  When you delete your account, all data is permanently removed
                  within 30 days.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">
                  9. Children's Privacy
                </h2>
                <p className="text-text-muted leading-relaxed">
                  ChatKing is not intended for children under 13 years of age.
                  We do not knowingly collect personal information from children
                  under 13. If you are a parent or guardian and believe your
                  child has provided us with personal information, please
                  contact us.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">
                  10. International Data Transfers
                </h2>
                <p className="text-text-muted leading-relaxed">
                  Your data is processed and stored on secure servers. If you
                  are accessing ChatKing from outside the jurisdiction where our
                  servers are located, your information may be transferred,
                  processed, and stored there. We ensure appropriate safeguards
                  are in place for such transfers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">
                  11. Changes to This Policy
                </h2>
                <p className="text-text-muted leading-relaxed">
                  We may update this Privacy Policy from time to time. We will
                  notify you of any changes by posting the new Privacy Policy on
                  this page and updating the "Last updated" date. Significant
                  changes will be communicated via email or platform
                  notification.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">
                  12. Contact Us
                </h2>
                <p className="text-text-muted leading-relaxed">
                  If you have any questions about this Privacy Policy, your
                  data, or your rights, please contact us through the platform
                  settings or reach out to our privacy team.
                </p>
              </section>

              <section className="border-t border-border-glow pt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Eye className="w-5 h-5 text-neon-green" />
                  <span className="font-semibold text-neon-green">
                    Transparency Promise
                  </span>
                </div>
                <p className="text-text-muted text-sm leading-relaxed">
                  We believe in complete transparency about how your data is
                  handled. This policy reflects our commitment to your privacy
                  and our technical implementation of privacy-by-design
                  principles.
                </p>
                <p className="text-text-muted text-sm mt-4">
                  © 2025 ChatKing. Owned and Operated by ChatKing. All rights
                  reserved.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
