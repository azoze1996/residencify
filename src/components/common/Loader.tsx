import { motion } from 'motion/react'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Loader({ size = 'md', className = '' }: LoaderProps) {
  const sizeMap = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className={`${sizeMap[size]} border-2 border-slate-200 border-t-slate-900 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  )
}

// Full page loader variant - no text, just the spinner
export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
      <Loader size="lg" />
    </div>
  )
}

// Inline loader for buttons or small areas
export function InlineLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-1.5 h-1.5 bg-current rounded-full"
          animate={{
            y: [0, -4, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: index * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Card loader for content areas
export function CardLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <Loader size="md" />
    </div>
  )
}
