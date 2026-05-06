import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [showDialog, setShowDialog] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('')
  const [dialogContent, setDialogContent] = useState<
    'terms' | 'about' | 'privacy' | 'contact'
  >('contact')

  const handleLinkClick = (
    title: string,
    content: 'terms' | 'about' | 'privacy' | 'contact',
  ) => {
    setDialogTitle(title)
    setDialogContent(content)
    setShowDialog(true)
  }

  const renderDialogContent = () => {
    if (dialogContent === 'contact') {
      return (
        <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300">
          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
              Get in Touch
            </h3>
            <p className="mb-4">
              We're here to help! If you have any questions, feedback, or need
              support, please don't hesitate to reach out.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
              Founder & Contact
            </h3>
            <div className="space-y-2">
              <p>
                <span className="font-medium text-slate-900 dark:text-white">
                  Dr. Abdulaziz Saud
                </span>
              </p>
              <p>Founder of Residencify</p>
              <p>
                <span className="font-medium">Email:</span>{' '}
                <a
                  href="mailto:aziz.saud.salem@gmail.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  aziz.saud.salem@gmail.com
                </a>
              </p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
              Support Hours
            </h3>
            <p>
              We typically respond to inquiries within 24-48 hours during
              business days.
            </p>
          </section>

          <section className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              For technical issues, please include details about your device,
              browser, and the steps to reproduce the problem.
            </p>
          </section>
        </div>
      )
    }

    if (dialogContent === 'privacy') {
      return (
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300">
            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                1. Introduction
              </h3>
              <p>
                Residencify ("we," "our," or "us") is committed to protecting
                your privacy and personal data. This Privacy Policy explains how
                we collect, use, disclose, and safeguard your information when
                you use our medical exam preparation platform. This policy
                complies with the General Data Protection Regulation (GDPR), the
                California Consumer Privacy Act (CCPA), and the Saudi Personal
                Data Protection Law (PDPL).
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                2. Data Controller
              </h3>
              <p className="mb-2">
                The data controller responsible for your personal data is:
              </p>
              <p className="ml-4">
                Residencify
                <br />
                Contact: Dr. Abdulaziz Saud
                <br />
                Email: aziz.saud.salem@gmail.com
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                3. Information We Collect
              </h3>
              <p className="mb-2">
                We collect the following types of information:
              </p>

              <h4 className="font-medium text-slate-900 dark:text-white mt-3 mb-2">
                3.1 Personal Information
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Name and username</li>
                <li>Email address</li>
                <li>Account credentials (encrypted passwords)</li>
                <li>Specialty and training level (PGY level)</li>
                <li>Subscription and payment information</li>
              </ul>

              <h4 className="font-medium text-slate-900 dark:text-white mt-3 mb-2">
                3.2 Usage Data
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Practice session data (questions answered, scores, progress)
                </li>
                <li>Study notes and bookmarks</li>
                <li>Device information and identifiers</li>
                <li>IP address and browser type</li>
                <li>Access times and session duration</li>
                <li>Feature usage and interaction patterns</li>
              </ul>

              <h4 className="font-medium text-slate-900 dark:text-white mt-3 mb-2">
                3.3 Technical Data
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Cookies and similar tracking technologies</li>
                <li>Log files and error reports</li>
                <li>Performance and diagnostic data</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                4. Legal Basis for Processing (GDPR)
              </h3>
              <p className="mb-2">We process your personal data based on:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Contract Performance:</strong> To provide our services
                  and fulfill our obligations under your subscription agreement
                </li>
                <li>
                  <strong>Legitimate Interests:</strong> To improve our
                  platform, prevent fraud, and ensure security
                </li>
                <li>
                  <strong>Consent:</strong> For marketing communications and
                  optional features (you may withdraw consent at any time)
                </li>
                <li>
                  <strong>Legal Obligations:</strong> To comply with applicable
                  laws and regulations
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                5. How We Use Your Information
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide and maintain the platform services</li>
                <li>Process your subscription and payments</li>
                <li>Track your learning progress and performance</li>
                <li>Personalize your learning experience</li>
                <li>Send service-related notifications and updates</li>
                <li>Respond to your inquiries and provide support</li>
                <li>Improve platform functionality and user experience</li>
                <li>Detect and prevent fraud, abuse, and security incidents</li>
                <li>Comply with legal obligations and enforce our terms</li>
                <li>Conduct analytics and research (anonymized data)</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                6. Data Sharing and Disclosure
              </h3>
              <p className="mb-2">
                We do not sell your personal data. We may share your information
                with:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Service Providers:</strong> Third-party vendors who
                  assist with hosting, payment processing, analytics, and
                  customer support (under strict confidentiality agreements)
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law,
                  court order, or government request
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a
                  merger, acquisition, or sale of assets (with notice to you)
                </li>
                <li>
                  <strong>With Your Consent:</strong> When you explicitly
                  authorize sharing (e.g., sharing questions with connections)
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                7. Data Security
              </h3>
              <p className="mb-2">
                We implement industry-standard security measures to protect your
                data:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Encryption of data in transit (TLS/SSL) and at rest</li>
                <li>Secure authentication and password hashing</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and employee training</li>
                <li>Automated backups and disaster recovery procedures</li>
                <li>Device-based access limitations</li>
              </ul>
              <p className="mt-2">
                However, no method of transmission over the internet is 100%
                secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                8. Data Retention
              </h3>
              <p>
                We retain your personal data for as long as your account is
                active or as needed to provide services. After account deletion,
                we may retain certain data for:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Legal compliance (e.g., tax records): up to 7 years</li>
                <li>Dispute resolution and fraud prevention: up to 3 years</li>
                <li>
                  Anonymized analytics: indefinitely (cannot identify you)
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                9. Your Rights
              </h3>
              <p className="mb-2">
                Depending on your location, you have the following rights:
              </p>

              <h4 className="font-medium text-slate-900 dark:text-white mt-3 mb-2">
                GDPR Rights (EU/EEA Users)
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Access:</strong> Request a copy of your personal data
                </li>
                <li>
                  <strong>Rectification:</strong> Correct inaccurate or
                  incomplete data
                </li>
                <li>
                  <strong>Erasure:</strong> Request deletion of your data
                  ("right to be forgotten")
                </li>
                <li>
                  <strong>Restriction:</strong> Limit how we process your data
                </li>
                <li>
                  <strong>Portability:</strong> Receive your data in a
                  structured, machine-readable format
                </li>
                <li>
                  <strong>Object:</strong> Object to processing based on
                  legitimate interests
                </li>
                <li>
                  <strong>Withdraw Consent:</strong> Withdraw consent at any
                  time (where processing is based on consent)
                </li>
                <li>
                  <strong>Lodge a Complaint:</strong> File a complaint with your
                  local data protection authority
                </li>
              </ul>

              <h4 className="font-medium text-slate-900 dark:text-white mt-3 mb-2">
                CCPA Rights (California Users)
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Know what personal information is collected</li>
                <li>Know whether personal information is sold or disclosed</li>
                <li>Access your personal information</li>
                <li>Request deletion of personal information</li>
                <li>
                  Opt-out of the sale of personal information (we do not sell)
                </li>
                <li>Non-discrimination for exercising your rights</li>
              </ul>

              <h4 className="font-medium text-slate-900 dark:text-white mt-3 mb-2">
                PDPL Rights (Saudi Arabia Users)
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access and obtain a copy of your personal data</li>
                <li>Correct or update inaccurate data</li>
                <li>Request deletion or restriction of processing</li>
                <li>Object to processing for direct marketing</li>
                <li>
                  File a complaint with the Saudi Data Protection Authority
                </li>
              </ul>

              <p className="mt-3">
                To exercise your rights, contact us at{' '}
                <a
                  href="mailto:aziz.saud.salem@gmail.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  aziz.saud.salem@gmail.com
                </a>
                . We will respond within 30 days.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                10. International Data Transfers
              </h3>
              <p>
                Your data may be transferred to and processed in countries
                outside your country of residence. We ensure appropriate
                safeguards are in place, including:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Standard Contractual Clauses (SCCs) approved by the EU</li>
                <li>Adequacy decisions by relevant authorities</li>
                <li>Compliance with applicable data protection laws</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                11. Cookies and Tracking Technologies
              </h3>
              <p className="mb-2">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Maintain your session and preferences</li>
                <li>Analyze platform usage and performance</li>
                <li>Provide personalized content</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
              <p className="mt-2">
                You can control cookies through your browser settings. Disabling
                cookies may affect platform functionality.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                12. Children's Privacy
              </h3>
              <p>
                Residencify is intended for medical residents and professionals.
                We do not knowingly collect data from individuals under 18 years
                of age. If we discover we have collected data from a minor, we
                will delete it promptly.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                13. Third-Party Links
              </h3>
              <p>
                Our platform may contain links to third-party websites. We are
                not responsible for the privacy practices of these sites. We
                encourage you to review their privacy policies.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                14. Changes to This Privacy Policy
              </h3>
              <p>
                We may update this Privacy Policy periodically to reflect
                changes in our practices or legal requirements. We will notify
                you of significant changes by:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Posting a notice on the platform</li>
                <li>Sending an email to your registered address</li>
                <li>Updating the "Last Updated" date below</li>
              </ul>
              <p className="mt-2">
                Your continued use of the platform after changes constitutes
                acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                15. Contact Us
              </h3>
              <p className="mb-2">
                If you have questions, concerns, or requests regarding this
                Privacy Policy or our data practices, please contact:
              </p>
              <p className="ml-4">
                Dr. Abdulaziz Saud
                <br />
                Founder, Residencify
                <br />
                Email:{' '}
                <a
                  href="mailto:aziz.saud.salem@gmail.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  aziz.saud.salem@gmail.com
                </a>
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                16. Supervisory Authority
              </h3>
              <p className="mb-2">
                You have the right to lodge a complaint with a supervisory
                authority:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>EU/EEA:</strong> Your local Data Protection Authority
                </li>
                <li>
                  <strong>Saudi Arabia:</strong> Saudi Data & AI Authority
                  (SDAIA)
                </li>
                <li>
                  <strong>California:</strong> California Attorney General's
                  Office
                </li>
              </ul>
            </section>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
              <strong>Last Updated:</strong>{' '}
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </ScrollArea>
      )
    }

    if (dialogContent === 'terms') {
      return (
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm text-slate-600">
            <section>
              <h3 className="font-semibold text-slate-900 mb-2">
                1. Acceptance of Terms
              </h3>
              <p>
                By accessing and using Residencify ("the Platform"), you agree
                to be bound by these Terms of Use. If you do not agree to these
                terms, please do not use the Platform.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">
                2. Educational Purpose
              </h3>
              <p>
                Residencify is designed solely for educational and training
                purposes. The content provided, including questions, scenarios,
                and explanations, is intended to supplement your medical
                education and should not be used as a substitute for
                professional medical advice, diagnosis, or treatment.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">
                3. User Accounts
              </h3>
              <p className="mb-2">
                To access certain features of the Platform, you must create an
                account. You agree to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Provide accurate and complete information during registration
                </li>
                <li>Maintain the security of your account credentials</li>
                <li>
                  Notify us immediately of any unauthorized access to your
                  account
                </li>
                <li>
                  Be responsible for all activities that occur under your
                  account
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">
                4. Acceptable Use
              </h3>
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Share your account credentials with others</li>
                <li>Use the Platform for any unlawful purpose</li>
                <li>
                  Attempt to gain unauthorized access to any part of the
                  Platform
                </li>
                <li>
                  Reproduce, distribute, or commercially exploit the content
                  without permission
                </li>
                <li>
                  Upload malicious code or interfere with the Platform's
                  operation
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">
                5. Intellectual Property
              </h3>
              <p>
                All content on the Platform, including but not limited to text,
                graphics, logos, images, and software, is the property of
                Residencify or its content suppliers and is protected by
                intellectual property laws. You may not use, copy, or distribute
                any content without explicit permission.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">
                6. Subscription and Payment
              </h3>
              <p>
                Access to certain features may require a paid subscription. By
                subscribing, you agree to pay the applicable fees and authorize
                us to charge your payment method. Subscription fees are
                non-refundable except as required by law.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">
                7. Device Limitations
              </h3>
              <p>
                Your subscription may be limited to a specific number of
                devices. Attempting to circumvent device restrictions may result
                in account suspension or termination.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">
                8. Content Accuracy
              </h3>
              <p>
                While we strive to provide accurate and up-to-date content, we
                make no warranties regarding the completeness, reliability, or
                accuracy of the information provided. Medical knowledge evolves,
                and you should always verify information with current medical
                literature and guidelines.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">
                9. Limitation of Liability
              </h3>
              <p>
                To the fullest extent permitted by law, Residencify shall not be
                liable for any indirect, incidental, special, consequential, or
                punitive damages arising from your use of the Platform. Our
                total liability shall not exceed the amount you paid for your
                subscription in the past 12 months.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">
                10. Privacy and Data Protection
              </h3>
              <p>
                Your use of the Platform is also governed by our Privacy Policy.
                We collect and process personal data in accordance with
                applicable data protection laws. By using the Platform, you
                consent to such processing.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">
                11. Termination
              </h3>
              <p>
                We reserve the right to suspend or terminate your account at any
                time for violation of these Terms of Use or for any other reason
                at our sole discretion. Upon termination, your right to access
                the Platform will immediately cease.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">
                12. Changes to Terms
              </h3>
              <p>
                We may modify these Terms of Use at any time. We will notify you
                of significant changes by posting a notice on the Platform or
                sending you an email. Your continued use of the Platform after
                such changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">
                13. Governing Law
              </h3>
              <p>
                These Terms of Use shall be governed by and construed in
                accordance with the laws of the jurisdiction in which
                Residencify operates, without regard to its conflict of law
                provisions.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2">
                14. Contact Information
              </h3>
              <p>
                If you have any questions about these Terms of Use, please
                contact us through the support section of the Platform.
              </p>
            </section>

            <p className="text-xs text-slate-500 mt-8">
              Last updated:{' '}
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </ScrollArea>
      )
    }

    if (dialogContent === 'about') {
      return (
        <div className="space-y-4 text-sm text-slate-600">
          <p className="leading-relaxed">
            Residencify is a comprehensive medical exam preparation platform for
            residents. Users can practice Part 1 exams across multiple
            specialties with timed MCQ questions featuring images and detailed
            explanations.
          </p>
          <p className="leading-relaxed">
            The platform includes OSCE practice with clinical scenarios,
            bookmark functionality for important questions, progress tracking
            with statistics, session auto-save, and personalized feedback
            collection.
          </p>
          <p className="leading-relaxed">
            Built with modern authentication, responsive design for
            mobile/desktop, and educational disclaimers for proper use.
          </p>
        </div>
      )
    }

    // Construction content
    return (
      <div className="flex flex-col items-center text-center py-6">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <span className="text-3xl">🚧</span>
        </div>
        <p className="text-slate-600">
          This page is currently under construction.
        </p>
        <p className="text-slate-500 text-sm mt-2">
          We're working hard to bring you this content. Please check back soon!
        </p>
      </div>
    )
  }

  return (
    <footer className="bg-slate-50 border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col items-center justify-center gap-8 mb-12">
          {/* Brand */}
          <div className="flex flex-col items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span
                className="text-2xl font-semibold text-slate-900 tracking-tight"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                Residencify
              </span>
              <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider bg-slate-900 text-white rounded">
                Beta
              </span>
            </Link>
            {/* Beta disclaimer */}
            <p className="text-xs text-slate-500 text-center max-w-md">
              Residencify is a webapp for practicing exams intended for
              educational purposes only.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
            <button
              onClick={() => handleLinkClick('Terms of Use', 'terms')}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              Terms of Use
            </button>
            <button
              onClick={() => handleLinkClick('Privacy Policy', 'privacy')}
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Privacy
            </button>
            <button
              onClick={() => handleLinkClick('About Us', 'about')}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              About Us
            </button>
            <button
              onClick={() => handleLinkClick('Contact Us', 'contact')}
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Contact Us
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200/50 flex flex-col items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-slate-400">
              © {currentYear} Residencify. All rights reserved.
            </p>{' '}
            {/* <--- Added this closing tag */}
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-400">
            <span>Developed by</span>
            <span className="font-medium text-slate-600">Abdulaziz Saud</span>
            <img src="/az-logo.png" alt="AZ Logo" className="h-7 w-auto" />
          </div>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription className="pt-4">
              {renderDialogContent()}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </footer>
  )
}
