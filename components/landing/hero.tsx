'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Paperclip, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SUGGESTIONS = [
  'A SaaS analytics dashboard',
  'A recipe sharing app',
  'A minimal personal portfolio',
  'A team task board',
]

export function Hero() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')

  const start = () => {
    router.push('/login')
  }

  return (
    <section className="relative overflow-hidden px-4 pt-28 pb-20">
      <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Now generating full-stack apps in real time
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-balance text-2xl font-semibold leading-[1.1] tracking-tight md:text-3xl"
        >
          Build software
          <br />
          by simply describing it
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mt-4 max-w-md text-pretty text-xs leading-relaxed text-muted-foreground"
        >
          Vibecode is the AI software generator. Turn a plain-language idea into
          a real, deployable app — with instant preview, live code, and one-click
          deploy.
        </motion.p>

        {/* Prompt box */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 w-full max-w-2xl"
        >
          <div className="flex flex-col rounded-2xl border border-border bg-card/70 p-4 backdrop-blur-xl glow-border">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing &&
                  e.keyCode !== 229
                ) {
                  e.preventDefault()
                  start()
                }
              }}
              placeholder="Ask Vibecode to build a dashboard for my coffee shop..."
              className="w-full flex-1 resize-none bg-transparent text-left text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full text-sm text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Attach a file"
              >
                <Paperclip className="h-4 w-4" />
                Attach
              </button>
              <Button
                onClick={start}
                className="rounded-full bg-primary text-primary-foreground transition-all hover:shadow-[0_0_20px_-4px_oklch(1_0_0_/_30%)] active:translate-y-px"
              >
                Start building
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setPrompt(s)}
                className="rounded-full border border-border bg-card/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 text-sm text-muted-foreground"
        >
          No credit card required ·{' '}
          <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
            Create your free account
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
