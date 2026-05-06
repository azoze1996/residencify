import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/landing/Header'
import { Footer } from '@/components/landing/Footer'

export const Route = createFileRoute('/_public/terms')({
  component: TermsPage,
})

function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">
          Terms of Service
        </h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              By accessing and using this service, you accept and agree to be
              bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              2. Use License
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Permission is granted to temporarily access the materials
              (information or software) on our platform for personal,
              non-commercial transitory viewing only.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              3. User Accounts
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              You are responsible for maintaining the confidentiality of your
              account and password. You agree to accept responsibility for all
              activities that occur under your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              4. Prohibited Uses
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              You may not use our service:
            </p>
            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2">
              <li>For any unlawful purpose</li>
              <li>To solicit others to perform unlawful acts</li>
              <li>
                To violate any international, federal, or state regulations
              </li>
              <li>To infringe upon intellectual property rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              5. Disclaimer
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              The materials on our platform are provided on an 'as is' basis. We
              make no warranties, expressed or implied, and hereby disclaim all
              other warranties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              6. Limitations
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              In no event shall we or our suppliers be liable for any damages
              arising out of the use or inability to use the materials on our
              platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              7. Modifications
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              We may revise these terms of service at any time without notice.
              By using this platform you are agreeing to be bound by the current
              version of these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              8. Contact Information
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              If you have any questions about these Terms, please contact us
              through our support page.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
