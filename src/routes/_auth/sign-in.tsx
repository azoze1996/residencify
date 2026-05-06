/**
 * @imagine-readonly
 */

import { useMutation } from '@tanstack/react-query'
import {
  createFileRoute,
  useNavigate,
  useRouter,
  useSearch,
  Link,
} from '@tanstack/react-router'
import { z } from 'zod'
import { AuthCard } from '@/components/auth/auth-card'
import { AuthForm } from '@/components/auth/auth-form'
import { AuthField } from '@/components/auth/auth-field'
import { signInFn } from '@/server/functions/auth'
import { useServerFn } from '@tanstack/react-start'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/_auth/sign-in')({
  component: SignInPage,
  validateSearch: searchSchema,
})

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

function SignInPage() {
  const search = useSearch({ from: '/_auth/sign-in' })
  const navigate = useNavigate()
  const router = useRouter()
  const signIn = useServerFn(signInFn)
  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const signInMutation = useMutation({
    mutationFn: async (data: z.infer<typeof signInSchema>) => {
      await signIn({
        data: { ...data, redirect: search.redirect || '/dashboard' },
      })
    },
    onSuccess: async () => {
      // Invalidate router to refresh auth state
      await router.invalidate()
      // Navigate to the redirect destination or dashboard
      await navigate({ to: search.redirect || '/dashboard' })
    },

    onError: async (error: {
      status: number
      redirect: boolean
      message: string
    }) => {
      // Check if it's a redirect error (TanStack Start throws redirects as errors)
      if (
        error?.status === 302 ||
        error?.redirect ||
        error?.message?.includes('redirect')
      ) {
        // Invalidate router to refresh auth state
        await router.invalidate()
        // Navigate to the redirect destination or dashboard
        await navigate({ to: search.redirect || '/dashboard' })
        return
      }
      console.error('Sign in error:', error)
      form.setError('root', { message: error.message || 'Failed to sign in' })
    },
  })

  return (
    <AuthCard
      title="Sign In"
      description="To sign in to an account in the application, enter your email and password"
    >
      <AuthForm
        schema={signInSchema}
        defaultValues={{
          email: '',
          password: '',
          rememberMe: false,
        }}
        onSubmit={(data) => signInMutation.mutate(data)}
        submitText="Continue"
        loadingText="Signing in..."
        isLoading={signInMutation.isPending}
        form={form}
      >
        {(form) => (
          <>
            <AuthField
              control={form.control}
              name="email"
              label="Email"
              placeholder="E-mail"
              type="email"
            />

            <AuthField
              control={form.control}
              name="password"
              label="Password"
              placeholder="Password"
              type="password"
            />

            {/* Remember Me */}
            <div className="flex items-center -mt-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={form.watch('rememberMe')}
                  onCheckedChange={(checked) =>
                    form.setValue('rememberMe', checked as boolean)
                  }
                  className="border-slate-300 dark:border-slate-600 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm text-slate-600 dark:text-slate-400 font-normal cursor-pointer"
                >
                  Remember me
                </Label>
              </div>
            </div>
          </>
        )}
      </AuthForm>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white/60 dark:bg-slate-900/60 px-3 text-slate-500 dark:text-slate-400 font-medium backdrop-blur-sm">
            Or continue with
          </span>
        </div>
      </div>

      {/* Social Sign In */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-800 hover:shadow-md gap-3 transition-all"
          disabled
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          <span style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Sign in with Apple
          </span>
        </Button>

        <Button
          variant="outline"
          className="w-full h-12 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-800 hover:shadow-md gap-3 transition-all"
          disabled
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Sign in with Google
          </span>
        </Button>
      </div>

      {/* Terms and Privacy */}
      <div className="text-center text-xs text-slate-500 dark:text-slate-400 px-2 leading-relaxed">
        By clicking "Continue", I have read and agree with the{' '}
        <Link
          to="/terms"
          className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline font-medium transition-colors"
        >
          Term Sheet
        </Link>
        {' and '}
        <Link
          to="/privacy"
          className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline font-medium transition-colors"
        >
          Privacy Policy
        </Link>
      </div>
    </AuthCard>
  )
}
