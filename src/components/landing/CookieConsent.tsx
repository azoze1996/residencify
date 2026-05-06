import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Cookie, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem('cookieConsent')
    if (!hasAccepted) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true')
    setIsVisible(false)
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50"
        >
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 backdrop-blur-xl">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/20">
                <Cookie className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 pt-1">
                <h3
                  className="text-base font-semibold text-slate-900 dark:text-white mb-2"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                >
                  Cookie Notice
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  We use cookies to enhance your login experience and maintain
                  your session. You can choose to disable cookies through your
                  browser settings, but this may affect some features of the
                  platform.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleAccept}
                className="flex-1 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-xl h-10 text-sm font-medium shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 transition-all"
              >
                Accept
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="px-4 rounded-xl h-10 text-sm font-medium border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
