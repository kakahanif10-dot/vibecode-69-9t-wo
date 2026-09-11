'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Mail, Lock, User, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Mode = 'signin' | 'signup'

export function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signup')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (status !== 'idle') return
    setStatus('loading')
    // Simulate an auth request, then a success state before routing.
    setTimeout(() => {
      setStatus('success')
      setTimeout(() => router.push('/workspace'), 700)
    }, 1000)
  }

  const social = (provider: string) => {
    if (status !== 'idle') return
    setStatus('loading')
    setTimeout(() => {
      setStatus('success')
      setTimeout(() => router.push('/workspace'), 700)
    }, 900)
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border bg-card/70 p-7 backdrop-blur-xl glow-border">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {mode === 'signup'
            ? 'Start building software with Vibecode in seconds.'
            : 'Sign in to return to your workspace.'}
        </p>

        {/* Social logins */}
        <div className="mt-6 grid gap-2.5">
          <SocialButton
            onClick={() => social('google')}
            disabled={status !== 'idle'}
            label="Continue with Google"
            icon={<GoogleIcon />}
          />
          <SocialButton
            onClick={() => social('github')}
            disabled={status !== 'idle'}
            label="Continue with GitHub"
            icon={<GithubIcon />}
          />
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or continue with email
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="grid gap-3">
          <AnimatePresence initial={false}>
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <Field
                  icon={<User className="h-4 w-4" />}
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={setName}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Field
            icon={<Mail className="h-4 w-4" />}
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={setEmail}
            required
          />
          <Field
            icon={<Lock className="h-4 w-4" />}
            type="password"
            placeholder="Password"
            value={password}
            onChange={setPassword}
            required
          />

          <Button
            type="submit"
            disabled={status !== 'idle'}
            className="mt-2 h-11 w-full rounded-lg bg-primary font-medium text-primary-foreground hover:opacity-90"
          >
            {status === 'loading' && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            {status === 'success' && <Check className="mr-1.5 h-4 w-4" />}
            {status === 'idle' && (
              <>
                {mode === 'signup' ? 'Create account' : 'Sign in'}
                <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
            {status === 'loading' && 'One moment…'}
            {status === 'success' && 'Success'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {mode === 'signup' ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>

      <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
        By continuing you agree to Vibecode&apos;s Terms of Service and Privacy
        Policy.
      </p>
    </div>
  )
}

function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
  required,
}: {
  icon: React.ReactNode
  type: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  return (
    <label className="flex items-center gap-2.5 rounded-lg border border-border bg-background/50 px-3.5 transition-colors focus-within:border-primary/50">
      <span className="text-muted-foreground">{icon}</span>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
    </label>
  )
}

function SocialButton({
  onClick,
  label,
  icon,
  disabled,
}: {
  onClick: () => void
  label: string
  icon: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 items-center justify-center gap-2.5 rounded-lg border border-border bg-background/50 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
    >
      {icon}
      {label}
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.3 14.7 2.3 12 2.3 6.9 2.3 2.8 6.4 2.8 11.5S6.9 20.7 12 20.7c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.2-1.5H12z"
      />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg className="h-4 w-4 fill-foreground" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.79-4.58 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
    </svg>
  )
}
