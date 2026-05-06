import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Footer } from '@/components/landing/Footer'

interface AuthCardProps {
  title: string
  description: string
  children: React.ReactNode
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="min-h-screen w-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-200/20 dark:bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-200/10 dark:bg-slate-700/10 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex relative z-10">
        {/* Left Panel - Glassmorphism Design - Desktop Only */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        >
          {/* Glassmorphism card container */}
          <div className="relative w-full max-w-md z-10">
            {/* Main frosted glass card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative backdrop-blur-2xl bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-slate-900/10"
              style={{
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              }}
            >
              {/* Brand name */}
              <h2
                className="text-2xl font-semibold text-slate-900 dark:text-white text-center mb-3"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                Residencify
              </h2>

              <p className="text-sm text-slate-600 dark:text-slate-300 text-center leading-relaxed mb-8">
                Your comprehensive platform for residency exam preparation.
                Practice MCQs and OSCE scenarios with confidence.
              </p>

              {/* Decorative elements */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-white">
                      Practice Questions
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Comprehensive MCQ bank
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-white">
                      OSCE Scenarios
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Interactive clinical cases
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 4 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-white">
                      Track Progress
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Monitor your improvement
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Floating decorative elements - positioned outside card container */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-20 right-20 w-32 h-32 rounded-3xl backdrop-blur-xl bg-gradient-to-br from-teal-300/30 to-cyan-300/30 border border-white/30 shadow-xl -z-10"
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          />
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
            className="absolute bottom-20 left-20 w-40 h-40 rounded-3xl backdrop-blur-xl bg-gradient-to-br from-purple-300/20 to-pink-300/20 border border-white/30 shadow-xl -z-10"
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          />
        </motion.div>

        {/* Right Panel - Form with Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 flex items-center justify-center p-6 lg:p-12"
        >
          <div className="w-full max-w-md">
            {/* Desktop: Logo Link - Text Only */}
            <Link to="/" className="hidden lg:flex items-center mb-10 group">
              <span
                className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                Residencify
              </span>
            </Link>

            {/* Form Header */}
            <div className="mb-8 text-center lg:text-left">
              <h1
                className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight mb-2"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                {title}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {description}
              </p>
            </div>

            {/* Form Content with glassmorphism container */}
            <div
              className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/50 dark:border-slate-700/50 rounded-2xl p-6 lg:p-8 shadow-xl shadow-slate-900/5"
              style={{
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              }}
            >
              <div className="space-y-6">{children}</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
