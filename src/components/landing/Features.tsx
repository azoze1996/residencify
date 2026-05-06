import { motion, useInView } from 'motion/react'
import { useRef } from 'react'
import { Layers, Clock, BarChart3, Shield, Bell, Lock } from 'lucide-react'

const features = [
  {
    icon: Layers,
    title: 'Organized Question Banks',
    description:
      'Carefully categorized questions by topic and difficulty level for targeted practice.',
  },
  {
    icon: Clock,
    title: 'Timed Practice Mode',
    description:
      'Optional timer to simulate real exam conditions and improve your time management.',
  },
  {
    icon: BarChart3,
    title: 'Session Persistence',
    description:
      'Save your progress and resume exactly where you left off. Never lose your place.',
  },
  {
    icon: Shield,
    title: 'Category-Based Access',
    description:
      'Content tailored to your program with category-specific question pools.',
  },
  {
    icon: Bell,
    title: 'Real-Time Updates',
    description:
      'Stay informed with instant notifications about new content and updates.',
  },
  {
    icon: Lock,
    title: 'Secure & Private',
    description:
      'Your data is protected with enterprise-grade security. Practice with peace of mind.',
  },
]

export function Features() {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: '-100px' })

  return (
    <section id="features" className="py-32 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative" ref={containerRef}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2
            className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight mb-6"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Everything you need to excel
          </h2>

          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            A comprehensive platform built specifically for trainee residents
            preparing for their board examinations.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.08 }}
              className="group"
            >
              <div className="relative p-8 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-100/50 hover:border-slate-200 transition-all duration-300 h-full">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3
                  className="text-xl font-semibold text-slate-900 mb-3"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                >
                  {feature.title}
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
