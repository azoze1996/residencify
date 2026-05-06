import * as React from 'react'
import { UseFormReturn, FieldValues, DefaultValues } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Loader2 } from 'lucide-react'

interface AuthFormProps<T extends FieldValues> {
  schema: z.ZodSchema<T>
  defaultValues: DefaultValues<T>
  onSubmit: (data: T, form: UseFormReturn<T>) => void
  children: (form: UseFormReturn<T>) => React.ReactNode
  submitText: string
  loadingText: string
  isLoading?: boolean
  className?: string
  form: UseFormReturn<T>
}

export function AuthForm<T extends FieldValues>({
  onSubmit,
  children,
  submitText,
  loadingText,
  isLoading = false,
  className = 'space-y-5',
  form,
}: AuthFormProps<T>) {
  const handleSubmit = (data: T) => {
    onSubmit(data, form)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
        {children(form)}

        {form.formState.errors.root && (
          <div className="text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg px-4 py-3">
            {form.formState.errors.root.message}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-14 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 dark:from-teal-600 dark:to-teal-700 dark:hover:from-teal-700 dark:hover:to-teal-800 text-white rounded-xl font-semibold text-base shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          style={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{loadingText}</span>
            </div>
          ) : (
            submitText
          )}
        </Button>
      </form>
    </Form>
  )
}
