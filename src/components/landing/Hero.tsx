import { motion } from 'motion/react'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white pt-20 pb-24 md:pt-24 md:pb-32">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-slate-50/80 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="space-y-12"
        >
          {/* Main Headline - Apple Style */}
          <div className="space-y-6">
            <h1
              className="text-[clamp(2.5rem,7vw,5rem)] font-semibold text-slate-900 tracking-[-0.02em] leading-[1.1]"
              style={{
                fontFamily:
                  '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
              }}
            >
              Ace Your
              <br />
              <span className="bg-gradient-to-r from-slate-600 to-slate-900 bg-clip-text text-transparent">
                Residency Exams
              </span>
            </h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed px-4"
            >
              The comprehensive platform for trainee residents to practice MCQs
              and OSCE.
              <br className="hidden sm:block" />
              Practice smarter. Learn faster. Excel always.
            </motion.p>
          </div>

          {/* Laptop Mockup with Animated Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.4,
              ease: [0.25, 0.4, 0.25, 1],
            }}
            className="relative mt-16 mx-auto max-w-4xl"
          >
            {/* Laptop Frame */}
            <div className="relative">
              {/* Screen bezel */}
              <div className="relative bg-slate-900 rounded-t-xl pt-3 pb-2 px-3 shadow-2xl shadow-slate-900/20">
                {/* Camera dot */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-700" />

                {/* Screen content */}
                <div className="relative bg-slate-50 rounded-lg overflow-hidden aspect-[16/10]">
                  {/* Mock Dashboard UI */}
                  <div className="absolute inset-0 flex">
                    {/* Sidebar */}
                    <div className="w-[18%] bg-white border-r border-slate-200 flex flex-col">
                      {/* Logo area */}
                      <div className="p-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded bg-gradient-to-br from-slate-800 to-slate-600" />
                          <div className="h-2 w-12 bg-slate-800 rounded" />
                        </div>
                      </div>
                      {/* Nav items */}
                      <div className="p-2 space-y-1 flex-1">
                        <div className="h-5 bg-slate-100 rounded-md" />
                        <div className="h-5 bg-slate-900 rounded-md" />
                        <div className="h-5 bg-slate-100 rounded-md" />
                        <div className="h-5 bg-slate-100 rounded-md" />
                        <div className="h-5 bg-slate-100 rounded-md" />
                      </div>
                      {/* User area skeleton */}
                      <div className="p-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200" />
                          <div className="h-2 w-10 bg-slate-200 rounded" />
                        </div>
                      </div>
                    </div>

                    {/* Main content - Question Card */}
                    <div className="flex-1 p-3 overflow-hidden">
                      {/* Header skeleton */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <motion.div
                            className="h-3 w-20 bg-slate-200 rounded"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <motion.div
                            className="h-3 w-12 bg-slate-100 rounded"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: 0.2,
                            }}
                          />
                        </div>
                        <motion.div
                          className="h-3 w-16 bg-emerald-100 rounded"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: 0.4,
                          }}
                        />
                      </div>

                      {/* Question Card */}
                      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        {/* Question header */}
                        <div className="p-2 border-b border-slate-100 bg-slate-50">
                          <div className="flex items-center gap-2">
                            <div className="px-1.5 py-0.5 bg-slate-800 rounded text-[6px] text-white font-medium">
                              Q.15
                            </div>
                            <motion.div
                              className="h-2 flex-1 bg-slate-200 rounded"
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          </div>
                        </div>

                        {/* Question text */}
                        <div className="p-2 space-y-1">
                          <div className="h-2 w-full bg-slate-100 rounded" />
                          <div className="h-2 w-4/5 bg-slate-100 rounded" />
                          <div className="h-2 w-3/4 bg-slate-100 rounded" />
                        </div>

                        {/* Answer options with animation */}
                        <div className="p-2 space-y-1.5">
                          {/* Option A - Loading */}
                          <motion.div
                            className="flex items-center gap-1.5 p-1.5 rounded-md bg-slate-50 border border-slate-100"
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                            <div className="h-2 flex-1 bg-slate-200 rounded" />
                          </motion.div>

                          {/* Option B - Correct answer being selected */}
                          <motion.div
                            className="flex items-center gap-1.5 p-1.5 rounded-md border"
                            initial={{
                              backgroundColor: '#f8fafc',
                              borderColor: '#e2e8f0',
                            }}
                            animate={{
                              backgroundColor: [
                                '#f8fafc',
                                '#f8fafc',
                                '#ecfdf5',
                                '#ecfdf5',
                              ],
                              borderColor: [
                                '#e2e8f0',
                                '#e2e8f0',
                                '#10b981',
                                '#10b981',
                              ],
                            }}
                            transition={{
                              duration: 4,
                              repeat: Infinity,
                              times: [0, 0.3, 0.5, 1],
                            }}
                          >
                            <motion.div
                              className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                              initial={{ borderColor: '#cbd5e1' }}
                              animate={{
                                borderColor: [
                                  '#cbd5e1',
                                  '#cbd5e1',
                                  '#10b981',
                                  '#10b981',
                                ],
                                backgroundColor: [
                                  'transparent',
                                  'transparent',
                                  '#10b981',
                                  '#10b981',
                                ],
                              }}
                              transition={{
                                duration: 4,
                                repeat: Infinity,
                                times: [0, 0.3, 0.5, 1],
                              }}
                            >
                              <motion.div
                                className="w-1.5 h-1.5 rounded-full bg-white"
                                initial={{ scale: 0 }}
                                animate={{ scale: [0, 0, 1, 1] }}
                                transition={{
                                  duration: 4,
                                  repeat: Infinity,
                                  times: [0, 0.3, 0.5, 1],
                                }}
                              />
                            </motion.div>
                            <div className="h-2 flex-1 bg-slate-200 rounded" />
                            <motion.svg
                              className="w-3 h-3 text-emerald-500"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{
                                opacity: [0, 0, 1, 1],
                                scale: [0, 0, 1, 1],
                              }}
                              transition={{
                                duration: 4,
                                repeat: Infinity,
                                times: [0, 0.4, 0.6, 1],
                              }}
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </motion.svg>
                          </motion.div>

                          {/* Option C - Loading */}
                          <motion.div
                            className="flex items-center gap-1.5 p-1.5 rounded-md bg-slate-50 border border-slate-100"
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: 0.3,
                            }}
                          >
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                            <div className="h-2 flex-1 bg-slate-200 rounded" />
                          </motion.div>

                          {/* Option D - Loading */}
                          <motion.div
                            className="flex items-center gap-1.5 p-1.5 rounded-md bg-slate-50 border border-slate-100"
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: 0.5,
                            }}
                          >
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                            <div className="h-2 flex-1 bg-slate-200 rounded" />
                          </motion.div>
                        </div>

                        {/* Footer with progress */}
                        <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <motion.div className="h-1.5 w-16 bg-slate-200 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-emerald-500 rounded-full"
                                initial={{ width: '60%' }}
                                animate={{
                                  width: ['60%', '60%', '64%', '64%'],
                                }}
                                transition={{
                                  duration: 4,
                                  repeat: Infinity,
                                  times: [0, 0.5, 0.6, 1],
                                }}
                              />
                            </motion.div>
                            <div className="text-[6px] text-slate-400">
                              15/25
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-5 h-4 bg-slate-200 rounded" />
                            <motion.div
                              className="w-5 h-4 rounded"
                              initial={{ backgroundColor: '#e2e8f0' }}
                              animate={{
                                backgroundColor: [
                                  '#e2e8f0',
                                  '#e2e8f0',
                                  '#10b981',
                                  '#10b981',
                                ],
                              }}
                              transition={{
                                duration: 4,
                                repeat: Infinity,
                                times: [0, 0.5, 0.6, 1],
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Stats row below */}
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <motion.div
                          className="bg-white rounded-lg p-1.5 border border-slate-100"
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className="h-2 w-6 bg-emerald-100 rounded mb-1" />
                          <div className="h-1.5 w-10 bg-slate-200 rounded" />
                        </motion.div>
                        <motion.div
                          className="bg-white rounded-lg p-1.5 border border-slate-100"
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: 0.2,
                          }}
                        >
                          <div className="h-2 w-5 bg-blue-100 rounded mb-1" />
                          <div className="h-1.5 w-8 bg-slate-200 rounded" />
                        </motion.div>
                        <motion.div
                          className="bg-white rounded-lg p-1.5 border border-slate-100"
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: 0.4,
                          }}
                        >
                          <div className="h-2 w-7 bg-amber-100 rounded mb-1" />
                          <div className="h-1.5 w-9 bg-slate-200 rounded" />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Laptop base/keyboard */}
              <div className="relative">
                <div className="h-3 bg-gradient-to-b from-slate-800 to-slate-700 rounded-b-lg" />
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-16 h-1 bg-slate-600 rounded-b-lg" />
              </div>

              {/* Bottom stand/shadow */}
              <div className="h-1 bg-slate-300 rounded-full mx-auto w-[60%] mt-0.5" />
            </div>

            {/* Reflection/glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-t from-slate-100/50 to-transparent rounded-3xl -z-10 blur-2xl" />
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-8 rounded-full border-2 border-slate-300 flex items-start justify-center p-1.5"
        >
          <div className="w-1 h-1.5 rounded-full bg-slate-400" />
        </motion.div>
      </motion.div>
    </section>
  )
}
