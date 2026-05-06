import { Control, FieldPath, FieldValues } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Mail, Lock } from 'lucide-react'

interface AuthFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>
  name: TName
  label: string
  placeholder: string
  type?: string
}

export function AuthField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  placeholder,
  type = 'text',
}: AuthFieldProps<TFieldValues, TName>) {
  const getIcon = () => {
    if (type === 'email' || name === 'email') {
      return <Mail className="w-5 h-5 text-slate-400 dark:text-slate-500" />
    }
    if (type === 'password' || name === 'password') {
      return <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500" />
    }
    return null
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="sr-only">{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                {getIcon()}
              </div>
              <Input
                className="h-14 pl-12 pr-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:border-teal-500 dark:focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all shadow-sm hover:shadow-md"
                style={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                }}
                type={type}
                placeholder={placeholder}
                {...field}
              />
            </div>
          </FormControl>
          <FormMessage className="text-xs mt-1.5 ml-1" />
        </FormItem>
      )}
    />
  )
}
