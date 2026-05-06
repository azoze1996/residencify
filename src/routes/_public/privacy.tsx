import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/landing/Header'
import { Footer } from '@/components/landing/Footer'

export const Route = createFileRoute('/_public/privacy')({
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">
          Privacy Policy
        </h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              1. Information We Collect
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2">
              <li>Account information (username, email, password)</li>
              <li>Profile information</li>
              <li>Practice session data and progress</li>
              <li>Feedback and support messages</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your transactions and manage your account</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze trends and usage</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              3. Information Sharing
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              We do not sell, trade, or otherwise transfer your personal
              information to third parties. This does not include trusted third
              parties who assist us in operating our platform, conducting our
              business, or servicing you, as long as those parties agree to keep
              this information confidential.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              4. Data Security
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              We implement appropriate security measures to protect your
              personal information. However, no method of transmission over the
              Internet or electronic storage is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              5. Cookies and Tracking
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              We use cookies and similar tracking technologies to track activity
              on our service and hold certain information. You can instruct your
              browser to refuse all cookies or to indicate when a cookie is
              being sent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              6. Your Rights
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Request data portability</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              7. Children's Privacy
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Our service is not intended for children under 13 years of age. We
              do not knowingly collect personal information from children under
              13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              8. Changes to This Policy
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              9. Contact Us
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              If you have any questions about this Privacy Policy, please
              contact us through our support page.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
