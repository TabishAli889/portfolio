'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { z } from 'zod'
import { Loader2, LogIn, ShieldAlert } from 'lucide-react'

const loginSchema = z.object({
  email: z.email({ message: 'Enter a valid email address' }),
  password: z.string().min(1, 'Enter your password'),
})

type LoginValues = z.infer<typeof loginSchema>

/** Auth.js returns these in the `code` of a CredentialsSignin error. */
const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'That email and password combination is not recognised.',
  invalid_input: 'Please check the email and password fields.',
  rate_limited: 'Too many attempts. Wait a few minutes and try again.',
  CredentialsSignin: 'That email and password combination is not recognised.',
}

export function LoginForm() {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginValues) {
    setFormError(null)

    const result = await signIn('credentials', {
      ...values,
      redirect: false,
    })

    if (result?.error) {
      setFormError(ERROR_MESSAGES[result.code ?? ''] ?? ERROR_MESSAGES[result.error] ?? 'Sign-in failed. Please try again.')
      return
    }

    // `refresh()` first so the admin layout picks up the new session cookie.
    router.refresh()
    router.push('/admin')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-200"
        >
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      )}

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          className={`field ${errors.email ? 'field-error' : ''}`}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" className="mt-1.5 text-xs text-rose-300">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={`field ${errors.password ? 'field-error' : ''}`}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
        {errors.password && (
          <p id="password-error" className="mt-1.5 text-xs text-rose-300">
            {errors.password.message}
          </p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn btn-primary mt-2 w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Signing in
          </>
        ) : (
          <>
            <LogIn className="size-4" aria-hidden />
            Sign in
          </>
        )}
      </button>
    </form>
  )
}
