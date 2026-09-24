import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShield, FiFileText } from 'react-icons/fi';
import logo from "../assets/images/LOGO1-removebg-preview.png";

export default function TermsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('terms');

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 py-2.5 sm:py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Logo */}
          <img 
            src={logo} 
            alt="Content Khmer Hub Logo" 
            className="h-7 sm:h-9 w-auto object-contain cursor-pointer shrink-0"
            onClick={() => navigate('/')} 
          />

          {/* Action Button */}
          <Link
            to="/signup"
            className="inline-flex items-center text-xs font-semibold text-[#5352ED] bg-[#EEF2FF] hover:bg-[#E0E7FF] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-colors whitespace-nowrap"
          >
            <span className="sm:hidden">Sign Up</span>
            <span className="hidden sm:inline">Back to Sign Up</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10">
        {/* Page Heading */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="inline-block bg-[#EEF2FF] text-[#5352ED] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            Legal Center
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
            Terms of Service & Privacy Policy
          </h1>
          <p className="text-xs text-[#94A3B8] font-medium mt-2">
            Last Updated: September 24, 2026
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-2xl border border-[#E2E8F0] shadow-2xs flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'terms'
                  ? 'bg-[#5352ED] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <FiFileText size={15} /> Terms of Service
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'privacy'
                  ? 'bg-[#5352ED] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <FiShield size={15} /> Privacy Policy
            </button>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-xs leading-relaxed space-y-8 text-sm text-[#334155]">
          {activeTab === 'terms' ? (
            <>
              <div>
                <p className="text-[#475569] leading-relaxed">
                  Welcome to <strong className="text-[#0F172A]">Content Khmer Hub (CKH)</strong>. These Terms of Service govern your use of the CKH platform and its services. By creating an account or using CKH, you agree to these terms.
                </p>
              </div>

              {/* Section 1 */}
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                  1. About Content Khmer Hub
                </h2>
                <p>
                  Content Khmer Hub is a Content Decision Support Platform designed to help content creators make more informed content decisions. CKH may provide features such as:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-[#64748B]">
                  <li>Personalized content recommendations</li>
                  <li>Content idea evaluation and comparison</li>
                  <li>Content history and reflection</li>
                  <li>Opportunity discovery</li>
                  <li>Creator insights</li>
                  <li>AI-assisted guidance</li>
                  <li>Optional third-party platform integrations</li>
                </ul>
                <div className="p-3.5 bg-[#F5F2FF] rounded-xl text-xs font-semibold text-[#5352ED] border border-[#E0E7FF]">
                  CKH is designed to support your decision-making, not make decisions for you.
                </div>
              </section>

              {/* Section 2 */}
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                  2. Your Account
                </h2>
                <p>
                  You are responsible for providing accurate information when creating your account and for keeping your account credentials secure. You should not:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[#64748B]">
                  <li>Create an account using another person's identity.</li>
                  <li>Share your password with others.</li>
                  <li>Use CKH for unlawful or harmful activities.</li>
                  <li>Attempt to access another user's account.</li>
                  <li>Attempt to interfere with or damage the platform.</li>
                </ul>
                <p className="text-xs text-[#64748B]">
                  You may update your profile information when necessary.
                </p>
              </section>

              {/* Section 3 */}
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                  3. Your Content and Information
                </h2>
                <p>
                  You retain ownership of the content and information you provide to CKH. This may include:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[#64748B]">
                  <li>Content ideas and descriptions</li>
                  <li>Creator profile information</li>
                  <li>Content history and reflections</li>
                  <li>Audience observations</li>
                  <li>Other information you choose to provide</li>
                </ul>
                <p>
                  By using CKH, you give CKH permission to process this information as necessary to provide and improve the platform's features. You are responsible for ensuring that the information and content you provide does not violate the rights of others or applicable laws.
                </p>
              </section>

              {/* Section 4 */}
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                  4. AI-Assisted Features
                </h2>
                <p>
                  Some CKH features may use artificial intelligence to analyze information and provide recommendations, evaluations, summaries, or other guidance. AI-generated information may not always be accurate, complete, or suitable for your specific situation.
                </p>
                <p className="font-semibold text-[#0F172A]">CKH does not guarantee that:</p>
                <ul className="list-disc pl-5 space-y-1 text-[#64748B]">
                  <li>A recommendation will improve your content performance.</li>
                  <li>A particular idea will become successful.</li>
                  <li>A trend will remain relevant.</li>
                  <li>An opportunity will produce a specific result.</li>
                </ul>
                <p className="text-xs text-[#64748B] italic">
                  You should use your own judgment when making content decisions.
                </p>
              </section>

              {/* Section 5 */}
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                  5. Opportunities and External Information
                </h2>
                <p>
                  CKH may display information about events, competitions, workshops, programs, campaigns, and other opportunities from external sources. While CKH aims to provide relevant and useful information, external opportunities may change, expire, or contain requirements updated by their organizers. You should verify important details with the original organizer before applying.
                </p>
              </section>

              {/* Section 6 */}
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                  6. Third-Party Services
                </h2>
                <p>
                  CKH may connect with third-party services such as YouTube or payment providers. When you connect a third-party service, that service may have its own terms and privacy policies. CKH is not responsible for changes, interruptions, or policies of third-party services.
                </p>
              </section>

              {/* Section 7 */}
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                  7. Premium Services
                </h2>
                <p>
                  CKH may offer optional paid features or subscriptions. If you purchase a Premium subscription:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[#64748B]">
                  <li>The applicable price will be shown clearly before payment.</li>
                  <li>Your subscription provides access to the features described at purchase.</li>
                  <li>Subscription access may end when the subscription expires or is cancelled.</li>
                  <li>Payment processing may be handled securely by a third-party payment provider.</li>
                </ul>
              </section>

              {/* Section 8 */}
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                  8. Intellectual Property
                </h2>
                <p>
                  The CKH platform, including its branding, interface, design, software, and original materials, belongs to CKH or its respective owners. You may not copy, reproduce, modify, distribute, or commercially exploit CKH's platform or materials without permission.
                </p>
              </section>

              {/* Section 9 */}
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                  9. Service Availability
                </h2>
                <p>
                  CKH is provided on an ongoing-development basis. Features may be changed, improved, temporarily unavailable, or discontinued. We make reasonable efforts to maintain the platform, but cannot guarantee that CKH will always be available without interruption or errors.
                </p>
              </section>

              {/* Section 10 */}
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                  10. Account Termination
                </h2>
                <p>
                  CKH may suspend or terminate an account if it is used in violation of these Terms of Service or in a way that harms the platform or other users. You may also stop using CKH and request deletion of your account at any time.
                </p>
              </section>

              {/* Section 11 */}
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                  11. Changes to These Terms
                </h2>
                <p>
                  These Terms of Service may be updated as CKH develops. When significant changes are made, the updated date will be displayed at the top of this page. Continued use of CKH after an update signifies acceptance of the revised terms.
                </p>
              </section>
            </>
          ) : (
            <>
              {/* Privacy Policy Tab */}
              <div>
                <p className="text-[#475569] leading-relaxed">
                  Your privacy is important to us. This Privacy Policy explains how Content Khmer Hub (CKH) collects, uses, and safeguards your information when you access our platform.
                </p>
              </div>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                  1. Information We Collect
                </h2>
                <ul className="list-disc pl-5 space-y-1.5 text-[#64748B]">
                  <li><strong>Account Data:</strong> Email address, username, password hash, and profile details provided during signup.</li>
                  <li><strong>Creator Profile & Goals:</strong> Topics, platforms, audience goals, and onboarding answers provided to tailor recommendations.</li>
                  <li><strong>Creator Activity:</strong> Ideas saved, reflections shared, notes, and interactions with recommendations.</li>
                  <li><strong>Technical Data:</strong> Browser type, approximate location, device details, and session timestamps to protect and maintain platform stability.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                  2. How We Use Your Information
                </h2>
                <p>We use your information solely to:</p>
                <ul className="list-disc pl-5 space-y-1 text-[#64748B]">
                  <li>Generate tailored content recommendations and ideas suited to your audience.</li>
                  <li>Maintain and secure your account credentials.</li>
                  <li>Allow you to save, bookmark, and reflect on your creator growth over time.</li>
                  <li>Deliver essential notifications, feature updates, and customer support.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                  3. Data Storage & Security
                </h2>
                <p>
                  CKH uses modern cloud infrastructure and secure authentication through Supabase. We do not sell your personal data or creator content ideas to third parties or advertising brokers.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                  4. Your Rights and Deletion
                </h2>
                <p>
                  You retain full control over your creator data. You may edit your profile information or delete your account permanently at any time through your Account Settings. Upon account deletion, all associated ideas, responses, and saved observations are permanently removed from our active database.
                </p>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}