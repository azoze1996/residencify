import { useState, useEffect } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useServerFn } from '@tanstack/react-start'
import { signOutFn } from '@/server/functions/auth'
import type { Models } from 'node-appwrite'

interface HeaderProps {
  currentUser?: Models.User<Models.Preferences> | null
}

export function Header({ currentUser }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const signOut = useServerFn(signOutFn)

  const handleSignOut = async () => {
    await signOut()
    await router.invalidate()
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-16 flex items-center justify-between">
            {/* Logo with Beta Badge */}
            <Link to="/" className="flex items-center gap-2.5">
              <span
                className="text-xl font-semibold text-slate-900 tracking-tight"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                Residencify
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-slate-900 text-white rounded">
                Beta
              </span>
            </Link>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              {currentUser ? (
                <>
                  <Link to="/dashboard">
                    <Button
                      variant="outline"
                      className="rounded-full px-6 h-10 text-sm font-medium gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => void handleSignOut()}
                    className="rounded-full px-6 h-10 text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link to="/sign-in">
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-7 h-10 text-sm font-medium transition-all active:scale-95">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-600" />
              ) : (
                <Menu className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden"
          >
            <div className="bg-white/95 backdrop-blur-2xl border-b border-slate-200/50 shadow-lg">
              <nav className="max-w-5xl mx-auto px-6 py-4 space-y-3">
                {currentUser ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block"
                    >
                      <Button
                        variant="outline"
                        className="w-full rounded-xl h-12 touch-manipulation gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={() => void handleSignOut()}
                      className="w-full rounded-xl h-12 touch-manipulation text-rose-600 hover:bg-rose-50 gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Link
                    to="/sign-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block"
                  >
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-700 rounded-xl h-12 touch-manipulation">
                      Sign In
                    </Button>
                  </Link>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
