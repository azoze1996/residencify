import { createFileRoute } from '@tanstack/react-router'
import { Header, Hero, Features, CTA, Footer } from '@/components/landing'
import { CookieConsent } from '@/components/landing/CookieConsent'
import { safeGetCurrentUser } from '@/server/functions/safe-auth'

export const Route = createFileRoute('/_public/')({
  loader: async () => {
    const currentUser = await safeGetCurrentUser()
    return { currentUser }
  },
  component: HomePage,
})

function HomePage() {
  const { currentUser } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-white select-none">
      <Header currentUser={currentUser} />
      <main>
        <Hero />
        <Features />
        <CTA />
      </main>
      <Footer />
      <CookieConsent />
    </div>
  )
}
