import { useState, useEffect } from 'react'
import { Link, useLocation, useRouter } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  User,
  Calendar,
  Crown,
  Shield,
  Share2,
  Menu,
  X,
  Stethoscope,
  Bookmark,
  Sun,
  Moon,
  StickyNote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useServerFn } from '@tanstack/react-start'
import { signOutFn } from '@/server/functions/auth'
import { getUserNotificationsFn } from '@/server/functions/notifications'
import { DeviceGuard } from './DeviceGuard'
import { DashboardFooter } from './DashboardFooter'
import type { Users } from '@/server/lib/appwrite.types'

interface DashboardLayoutProps {
  children: React.ReactNode
  userProfile?: Users | null
}

export function DashboardLayout({
  children,
  userProfile,
}: DashboardLayoutProps) {
  const location = useLocation()
  const router = useRouter()
  const signOut = useServerFn(signOutFn)
  const getNotifications = useServerFn(getUserNotificationsFn)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [hasNewNotification, setHasNewNotification] = useState(false)

  const isAdmin = userProfile?.isAdmin === true
  const isExamAdmin = userProfile?.accessLevel === 'exam_admin'

  // Load dark mode preference
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode')
    if (savedMode) {
      setDarkMode(savedMode === 'true')
      if (savedMode === 'true') {
        document.documentElement.classList.add('dark')
      }
    }
  }, [])

  // Fetch unread notification count
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const result = await getNotifications()
        setHasNewNotification(result.unreadCount > 0)
      } catch {
        // Silently fail - notifications are not critical
      }
    }

    void fetchNotifications()

    // Refresh every 60 seconds
    const interval = setInterval(() => {
      void fetchNotifications()
    }, 60000)

    return () => clearInterval(interval)
  }, [getNotifications])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    await router.invalidate()
    void router.navigate({ to: '/' })
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'trainee_resident':
        return 'Trainee Resident'
      default:
        return category
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return (
        location.pathname === '/dashboard' ||
        location.pathname === '/dashboard/'
      )
    }
    return (
      location.pathname === href || location.pathname.startsWith(href + '/')
    )
  }

  const navItems = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      exact: true,
    },
    { href: '/dashboard/practice', icon: BookOpen, label: 'Practice' },
    { href: '/dashboard/osce', icon: Stethoscope, label: 'OSCE' },
    { href: '/dashboard/bookmarks', icon: Bookmark, label: 'Bookmarks' },
    { href: '/dashboard/notes', icon: StickyNote, label: 'Notes' },
    { href: '/dashboard/sharing', icon: Share2, label: 'Sharing Center' },
    { href: '/dashboard/support', icon: MessageSquare, label: 'Support' },
    {
      href: '/dashboard/notifications',
      icon: Bell,
      label: 'Notifications',
      hasNotification: hasNewNotification,
    },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  ]

  const isNavActive = (item: (typeof navItems)[0]) => {
    if (item.exact) {
      return (
        isActiveRoute('/dashboard') &&
        !isActiveRoute('/dashboard/practice') &&
        !isActiveRoute('/dashboard/osce') &&
        !isActiveRoute('/dashboard/bookmarks') &&
        !isActiveRoute('/dashboard/notes') &&
        !isActiveRoute('/dashboard/support') &&
        !isActiveRoute('/dashboard/notifications') &&
        !isActiveRoute('/dashboard/settings') &&
        !isActiveRoute('/dashboard/sharing')
      )
    }
    return isActiveRoute(item.href)
  }

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Logo */}
      <div
        className={`p-4 border-b border-slate-100/80 dark:border-slate-800/80 flex items-center justify-between ${isCollapsed && !mobile ? 'px-3' : ''}`}
      >
        <Link
          to="/"
          className="flex items-center gap-2.5"
          onClick={() => mobile && setIsMobileMenuOpen(false)}
        >
          {(!isCollapsed || mobile) && (
            <>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 flex items-center justify-center shadow-sm">
                <span className="text-sm font-bold text-white dark:text-slate-900">
                  R
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className="text-base font-semibold text-slate-900 dark:text-white tracking-tight leading-none"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                >
                  Residencify
                </span>
                <span className="text-[9px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-0.5">
                  Beta
                </span>
              </div>
            </>
          )}
          {isCollapsed && !mobile && (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-white dark:text-slate-900">
                R
              </span>
            </div>
          )}
        </Link>
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hidden lg:flex rounded-lg"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </Button>
        )}
      </div>

      {/* User Card */}
      {userProfile && (!isCollapsed || mobile) && (
        <div className="p-2.5 mx-3 mt-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-100 dark:to-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <User className="w-4 h-4 text-white dark:text-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                {userProfile.username}
                {(isAdmin || isExamAdmin) && (
                  <Shield className="w-3 h-3 text-blue-500" />
                )}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {getCategoryLabel(userProfile.accessCategory)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <Crown className="w-3 h-3 text-amber-500" />
              <span className="capitalize font-medium">
                {userProfile.planType}
              </span>
            </div>
            <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(userProfile.endDate)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed User Avatar */}
      {userProfile && isCollapsed && !mobile && (
        <div className="p-3 flex justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-100 dark:to-white flex items-center justify-center shadow-sm">
            <User className="w-4 h-4 text-white dark:text-slate-900" />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isNavActive(item)
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => mobile && setIsMobileMenuOpen(false)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 touch-manipulation ${
                active
                  ? 'bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-100 text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white active:bg-slate-200 dark:active:bg-slate-700'
              } ${isCollapsed && !mobile ? 'justify-center' : ''}`}
            >
              <div className="relative flex-shrink-0">
                <item.icon
                  className={`w-[18px] h-[18px] ${active ? '' : 'group-hover:scale-110 transition-transform'}`}
                />
                {/* Bold blue notification dot indicator */}
                {'hasNotification' in item && item.hasNotification && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-lg shadow-blue-500/50" />
                )}
              </div>
              {(!isCollapsed || mobile) && (
                <>
                  <span className="text-[13px] font-medium">{item.label}</span>
                  {active && (
                    <ChevronRight className="w-4 h-4 ml-auto opacity-70" />
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Dark Mode Toggle */}
      <div className="px-2.5 pb-1.5">
        <button
          onClick={toggleDarkMode}
          className={`group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition-all duration-200 touch-manipulation ${
            isCollapsed && !mobile ? 'justify-center' : ''
          }`}
        >
          {darkMode ? (
            <>
              <Sun className="w-[18px] h-[18px] flex-shrink-0 group-hover:scale-110 transition-transform text-amber-500" />
              {(!isCollapsed || mobile) && (
                <span className="text-[13px] font-medium">Light Mode</span>
              )}
            </>
          ) : (
            <>
              <Moon className="w-[18px] h-[18px] flex-shrink-0 group-hover:scale-110 transition-transform text-indigo-500" />
              {(!isCollapsed || mobile) && (
                <span className="text-[13px] font-medium">Dark Mode</span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Admin Panel Link */}
      {(isAdmin || isExamAdmin) && (
        <div className="px-2.5 pb-1.5">
          <Link
            to="/admin"
            onClick={() => mobile && setIsMobileMenuOpen(false)}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 transition-all duration-200 touch-manipulation shadow-sm ${
              isCollapsed && !mobile ? 'justify-center' : ''
            }`}
          >
            <Shield className="w-[18px] h-[18px] flex-shrink-0" />
            {(!isCollapsed || mobile) && (
              <>
                <span className="text-[13px] font-medium">
                  {isExamAdmin ? 'Exam Admin' : 'Admin Panel'}
                </span>
                <ChevronRight className="w-4 h-4 ml-auto opacity-70" />
              </>
            )}
          </Link>
        </div>
      )}

      {/* Sign Out */}
      <div className="p-2.5 border-t border-slate-100/80 dark:border-slate-800/80">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={`group w-full gap-3 text-slate-500 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 active:bg-rose-100 dark:active:bg-rose-500/20 touch-manipulation rounded-xl h-10 ${
            isCollapsed && !mobile ? 'justify-center px-0' : 'justify-start'
          }`}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0 group-hover:scale-110 transition-transform" />
          {(!isCollapsed || mobile) && (
            <span className="text-[13px] font-medium">Sign Out</span>
          )}
        </Button>
      </div>
    </>
  )

  return (
    <DeviceGuard
      userPlanType={userProfile?.planType}
      isAdmin={isAdmin || isExamAdmin}
    >
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col select-none">
        <div className="flex flex-1">
          {/* Mobile Header */}
          <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <span
                className="text-base font-semibold text-slate-900 dark:text-white tracking-tight"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                Residencify
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded">
                Beta
              </span>
            </Link>
            <div className="flex items-center gap-1">
              {/* Bold blue notification dot indicator for mobile */}
              <Link
                to="/dashboard/notifications"
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 touch-manipulation"
              >
                <Bell className="w-5 h-5" />
                {hasNewNotification && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-lg shadow-blue-500/50" />
                )}
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 touch-manipulation rounded-xl"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col"
                >
                  <SidebarContent mobile />
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Desktop Sidebar */}
          <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1, width: isCollapsed ? 72 : 256 }}
            transition={{ duration: 0.3 }}
            className="hidden lg:flex bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 flex-col fixed h-screen"
          >
            <SidebarContent />
          </motion.aside>

          {/* Main Content */}
          <main
            className={`flex-1 pt-14 lg:pt-0 transition-all duration-300 ${
              isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
            }`}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="p-4 md:p-6"
            >
              {children}
            </motion.div>
          </main>
        </div>

        {/* Footer */}
        <div
          className={`transition-all duration-300 ${
            isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
          }`}
        >
          <DashboardFooter />
        </div>
      </div>
    </DeviceGuard>
  )
}
