import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from 'next-themes'
import { safeGetCurrentUser } from '@/server/functions/safe-auth'

interface MyRouterContext {
  queryClient: QueryClient
}

const scripts: React.DetailedHTMLProps<
  React.ScriptHTMLAttributes<HTMLScriptElement>,
  HTMLScriptElement
>[] = []

if (import.meta.env.VITE_INSTRUMENTATION_SCRIPT_SRC) {
  scripts.push({
    src: import.meta.env.VITE_INSTRUMENTATION_SCRIPT_SRC,
    type: 'module',
  })
}

const seoDescription =
  'The comprehensive MCQ platform for trainee residents. Excel always.'
const siteTitle = 'Residencify | Medical Residency Exam Preparation'

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    const currentUser = await safeGetCurrentUser()
    return { currentUser }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content:
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
      },
      {
        title: siteTitle,
      },
      {
        name: 'description',
        content: seoDescription,
      },
      {
        name: 'keywords',
        content:
          'medical residency, MCQ, exam preparation, trainee residents, medical education, practice questions, residency exam',
      },
      {
        name: 'author',
        content: 'Residencify',
      },
      {
        name: 'robots',
        content: 'index, follow',
      },
      // Open Graph / Facebook
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:title',
        content: siteTitle,
      },
      {
        property: 'og:description',
        content: seoDescription,
      },
      {
        property: 'og:image',
        content: '/favicon.png',
      },
      {
        property: 'og:site_name',
        content: 'Residencify',
      },
      // Twitter
      {
        name: 'twitter:card',
        content: 'summary',
      },
      {
        name: 'twitter:title',
        content: siteTitle,
      },
      {
        name: 'twitter:description',
        content: seoDescription,
      },
      {
        name: 'twitter:image',
        content: '/favicon.png',
      },
      // Mobile App Meta
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'default',
      },
      {
        name: 'apple-mobile-web-app-title',
        content: 'Residencify',
      },
      {
        name: 'mobile-web-app-capable',
        content: 'yes',
      },
      // Theme color with media queries for light/dark mode
      {
        name: 'theme-color',
        content: '#FFFFFF',
        media: '(prefers-color-scheme: light)',
      },
      {
        name: 'theme-color',
        content: '#0f172a',
        media: '(prefers-color-scheme: dark)',
      },
      // Touch optimization
      {
        name: 'format-detection',
        content: 'telephone=no',
      },
      // Windows Tiles
      {
        name: 'msapplication-TileColor',
        content: '#0d9488',
      },
      {
        name: 'msapplication-config',
        content: '/browserconfig.xml',
      },
    ],
    links: [
      // Modern favicon implementation with SVG as primary
      // SVG icon (scalable, best quality, works in all modern browsers)
      {
        rel: 'icon',
        href: '/favicon.svg',
        type: 'image/svg+xml',
      },
      // PNG fallback for browsers that don't support SVG favicons
      {
        rel: 'icon',
        type: 'image/png',
        href: '/favicon.png',
      },
      // Apple Touch Icon
      {
        rel: 'apple-touch-icon',
        href: '/favicon.png',
      },
      // Safari Pinned Tab
      {
        rel: 'mask-icon',
        href: '/safari-pinned-tab.svg',
        color: '#0d9488',
      },
      // Web Manifest for PWAs
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,100..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
    scripts: [...scripts],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body
        className="touch-manipulation"
        style={{
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
          WebkitTapHighlightColor: 'transparent',
          WebkitTouchCallout: 'none',
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
