import { useState } from 'react'
import { Link, useLocation, useRouter } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import {
  LayoutDashboard,
  Users,
  FolderTree,
  HelpCircle,
  CreditCard,
  FileQuestion,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Shield,
  ArrowLeft,
  Menu,
  X,
  MessageSquareText,
  Bell,
  ClipboardList,
  Stethoscope,
  ChevronDown,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useServerFn } from '@tanstack/react-start'
import { signOutFn } from '@/server/functions/auth'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import type { Users as UsersType } from '@/server/lib/appwrite.types'

interface AdminLayoutProps {
  children: React.ReactNode
  userProfile?: UsersType | null
  isExamAdmin?: boolean
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  adminOnly: boolean
}

interface NavGroup {
  icon: React.ComponentType<{ className?: string }>
  label: string
  adminOnly: boolean
  items: NavItem[]
}

const standaloneNavItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Overview',
    href: '/admin',
    adminOnly: false,
  },
  { icon: Users, label: 'Users', href: '/admin/users', adminOnly: true },
]

const navGroups: NavGroup[] = [
  {
    icon: BookOpen,
    label: 'Manage MCQs',
    adminOnly: false,
    items: [
      {
        icon: FolderTree,
        label: 'Categories',
        href: '/admin/categories',
        adminOnly: false,
      },
      {
        icon: FileQuestion,
        label: 'Questions',
        href: '/admin/questions',
        adminOnly: false,
      },
    ],
  },
  {
    icon: Stethoscope,
    label: 'Manage OSCE',
    adminOnly: false,
    items: [
      {
        icon: Stethoscope,
        label: 'OSCE Topics',
        href: '/admin/osce',
        adminOnly: false,
      },
    ],
  },
]

const bottomNavItems: NavItem[] = [
  { icon: CreditCard, label: 'Plans', href: '/admin/plans', adminOnly: true },
  {
    icon: Bell,
    label: 'Notifications',
    href: '/admin/notifications',
    adminOnly: false,
  },
  {
    icon: MessageSquareText,
    label: 'Feedback',
    href: '/admin/feedback',
    adminOnly: false,
  },
  {
    icon: HelpCircle,
    label: 'Support',
    href: '/admin/support',
    adminOnly: false,
  },
]

export function AdminLayout({
  children,
  userProfile,
  isExamAdmin = false,
}: AdminLayoutProps) {
  const location = useLocation()
  const router = useRouter()
  const signOut = useServerFn(signOutFn)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    'Manage MCQs',
    'Manage OSCE',
  ])

  const handleSignOut = async () => {
    await signOut()
    await router.invalidate()
    void router.navigate({ to: '/' })
  }

  const isActiveRoute = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/'
    }
    return (
      location.pathname === href || location.pathname.startsWith(href + '/')
    )
  }

  const isGroupActive = (group: NavGroup) => {
    return group.items.some((item) => isActiveRoute(item.href))
  }

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label],
    )
  }

  const roleLabel = isExamAdmin ? 'Exam Admin' : 'Administrator'
  const RoleIcon = isExamAdmin ? ClipboardList : Shield

  // Filter items based on role
  const filteredStandaloneItems = standaloneNavItems.filter((item) => {
    if (isExamAdmin && item.adminOnly) return false
    return true
  })

  const filteredGroups = navGroups
    .filter((group) => {
      if (isExamAdmin && group.adminOnly) return false
      return true
    })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (isExamAdmin && item.adminOnly) return false
        return true
      }),
    }))
    .filter((group) => group.items.length > 0)

  const filteredBottomItems = bottomNavItems.filter((item) => {
    if (isExamAdmin && item.adminOnly) return false
    return true
  })

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Logo */}
      <div
        className={`p-5 border-b border-slate-800 flex items-center justify-between ${isCollapsed && !mobile ? 'px-3' : ''}`}
      >
        <Link
          to="/admin"
          className="flex items-center gap-2"
          onClick={() => mobile && setIsMobileMenuOpen(false)}
        >
          {(!isCollapsed || mobile) && (
            <>
              <span
                className="text-xl font-semibold text-white tracking-tight"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                Residencify
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-white text-slate-900 rounded">
                Beta
              </span>
            </>
          )}
          {isCollapsed && !mobile && (
            <span
              className="text-xl font-semibold text-white"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              R
            </span>
          )}
        </Link>
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 hidden lg:flex"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Admin Info */}
      {userProfile && (!isCollapsed || mobile) && (
        <div className="p-3 mx-3 mt-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <RoleIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userProfile.username}
              </p>
              <p className="text-xs text-slate-400 truncate">{roleLabel}</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Admin Avatar */}
      {userProfile && isCollapsed && !mobile && (
        <div className="p-3 flex justify-center">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center">
            <RoleIcon className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {/* Standalone Items */}
        {filteredStandaloneItems.map((item) => {
          const isActive = isActiveRoute(item.href)

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => mobile && setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all touch-manipulation ${
                isActive
                  ? 'bg-white text-slate-900'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white active:bg-slate-700'
              } ${isCollapsed && !mobile ? 'justify-center' : ''}`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {(!isCollapsed || mobile) && (
                <>
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </>
              )}
            </Link>
          )
        })}

        {/* Grouped Items */}
        {filteredGroups.map((group) => {
          const isExpanded = expandedGroups.includes(group.label)
          const groupActive = isGroupActive(group)

          return (
            <div key={group.label} className="mt-2">
              {!isCollapsed || mobile ? (
                <>
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all touch-manipulation ${
                      groupActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <group.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium flex-1 text-left">
                      {group.label}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-700 pl-3">
                          {group.items.map((item) => {
                            const isActive = isActiveRoute(item.href)
                            return (
                              <Link
                                key={item.href}
                                to={item.href}
                                onClick={() =>
                                  mobile && setIsMobileMenuOpen(false)
                                }
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all touch-manipulation ${
                                  isActive
                                    ? 'bg-white text-slate-900'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                <item.icon className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm font-medium">
                                  {item.label}
                                </span>
                                {isActive && (
                                  <ChevronRight className="w-4 h-4 ml-auto" />
                                )}
                              </Link>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                // Collapsed view - show first item icon
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = isActiveRoute(item.href)
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`flex items-center justify-center px-3 py-2.5 rounded-lg transition-all ${
                          isActive
                            ? 'bg-white text-slate-900'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Separator */}
        <div className="my-3 border-t border-slate-800" />

        {/* Bottom Items */}
        {filteredBottomItems.map((item) => {
          const isActive = isActiveRoute(item.href)

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => mobile && setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all touch-manipulation ${
                isActive
                  ? 'bg-white text-slate-900'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white active:bg-slate-700'
              } ${isCollapsed && !mobile ? 'justify-center' : ''}`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {(!isCollapsed || mobile) && (
                <>
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Back to Dashboard */}
      <div className="px-3 pb-2">
        <Link
          to="/dashboard"
          onClick={() => mobile && setIsMobileMenuOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white active:bg-slate-700 transition-all touch-manipulation ${
            isCollapsed && !mobile ? 'justify-center' : ''
          }`}
        >
          <ArrowLeft className="w-4 h-4 flex-shrink-0" />
          {(!isCollapsed || mobile) && (
            <span className="text-sm font-medium">Back to Dashboard</span>
          )}
        </Link>
      </div>

      {/* Sign Out */}
      <div className="p-3 border-t border-slate-800">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={`w-full gap-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20 touch-manipulation ${
            isCollapsed && !mobile ? 'justify-center px-0' : 'justify-start'
          }`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {(!isCollapsed || mobile) && (
            <span className="text-sm font-medium">Sign Out</span>
          )}
        </Button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col select-none">
      <div className="flex flex-1">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 px-4 h-14 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <span
              className="text-lg font-semibold text-white tracking-tight"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              Residencify
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-white text-slate-900 rounded">
              Beta
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white hover:bg-slate-800 active:bg-slate-700 touch-manipulation"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
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
                className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col"
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
          className="hidden lg:flex bg-slate-900 border-r border-slate-800 flex-col fixed h-screen"
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
  )
}
