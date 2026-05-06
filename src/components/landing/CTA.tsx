import { motion, useInView } from 'motion/react'
import { useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { registerInterestFn } from '@/server/functions/interest'
import { toast } from 'sonner'

export function CTA() {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: '-100px' })

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [level, setLevel] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !specialty.trim() || !level) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await registerInterestFn({
        data: {
          name: name.trim(),
          email: email.trim(),
          specialty: specialty.trim(),
          level: level as
            | 'PGY-1'
            | 'PGY-2'
            | 'PGY-3'
            | 'PGY-4'
            | 'PGY-5'
            | 'PGY-6',
        },
      })

      if (result.success) {
        setIsSuccess(true)
        toast.success('Registration successful!')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      ref={containerRef}
      className="relative py-32 sm:py-40 overflow-hidden"
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-slate-100" />

      {/* Decorative elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-slate-100/50 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-teal-100/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/50 mb-8"
        >
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span className="text-sm font-medium text-teal-700">
            Get your access
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight mb-6"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          Ready to Start?
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto mb-12 leading-relaxed"
        >
          Register your interest and we will contact you.
        </motion.p>

        {/* Form or Success State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6 p-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-3">
                <h3
                  className="text-2xl font-semibold text-slate-900"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                >
                  Thank You!
                </h3>
                <p className="text-slate-600 leading-relaxed max-w-md">
                  Thank you for your interest in Residencify! We are excited to
                  have you join us and start exploring our platform. We look
                  forward to providing you with a great experience!
                </p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="text"
                  placeholder="Your name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="h-14 px-5 text-base rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm focus:border-teal-500 focus:ring-teal-500/20 transition-all"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                />
                <Input
                  type="email"
                  placeholder="Your email *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="h-14 px-5 text-base rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm focus:border-teal-500 focus:ring-teal-500/20 transition-all"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="text"
                  placeholder="Your specialty *"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="h-14 px-5 text-base rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm focus:border-teal-500 focus:ring-teal-500/20 transition-all"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                />
                <Select
                  value={level}
                  onValueChange={setLevel}
                  disabled={isSubmitting}
                  required
                >
                  <SelectTrigger className="h-14 px-5 text-base rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm focus:border-teal-500 focus:ring-teal-500/20 transition-all">
                    <SelectValue placeholder="Select PGY level *" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PGY-1">PGY-1</SelectItem>
                    <SelectItem value="PGY-2">PGY-2</SelectItem>
                    <SelectItem value="PGY-3">PGY-3</SelectItem>
                    <SelectItem value="PGY-4">PGY-4</SelectItem>
                    <SelectItem value="PGY-5">PGY-5</SelectItem>
                    <SelectItem value="PGY-6">PGY-6</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-xl px-10 h-14 text-base font-medium shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 hover:scale-[1.02] transition-all duration-300 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Register Your Interest
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  )
}
