'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Wand2,
  Download,
  ArrowUp,
  AlertCircle,
  Cpu,
  Plus,
} from 'lucide-react'
import { VibecodeMark } from '@/components/vibecode-logo'
import { TEMPLATE_LABELS, type DesignSpec } from '@/lib/design'
import {
  COMPILE_STEPS,
  COMPILE_DURATION_MS,
  type ConsultantMessage,
} from '@/lib/consultant'
import type { Recommendation } from '@/lib/consultant'
import { cn } from '@/lib/utils'

const EXAMPLES = [
  'Aplikasi SAMSAT online untuk cek dan bayar pajak kendaraan',
  'A cozy neighborhood coffee shop with menu and delivery',
  'A fashion e-commerce store with cart and checkout',
]

export function ConsultantPanel({
  prompt,
  onPromptChange,
  onGenerate,
  onRecommendation,
  onExport,
  generating,
  chatting = false,
  error,
  messages,
  spec,
}: {
  prompt: string
  onPromptChange: (v: string) => void
  onGenerate: () => void
  onRecommendation: (rec: Recommendation) => void
  onExport: () => void
  generating: boolean
  chatting?: boolean
  error: string | null
  messages: ConsultantMessage[]
  spec: DesignSpec
}) {
  const endRef = useRef<HTMLDivElement>(null)
  const busy = generating || chatting

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, generating, chatting])

  const empty = messages.length === 0 && !busy

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4 text-sm font-medium">
        <Sparkles className="h-4 w-4" />
        AI Consultant
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2 py-0.5 text-[10px] font-normal text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Autonomous agent
        </span>
      </div>

      {/* Conversation */}
      <div className="thin-scroll flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {empty && <EmptyState onPick={onPromptChange} />}

        {messages.map((m) =>
          m.role === 'user' ? (
            <UserBubble key={m.id} text={m.text} />
          ) : (
            <AssistantBubble
              key={m.id}
              message={m}
              onRecommendation={onRecommendation}
              disabled={busy}
            />
          ),
        )}

        <AnimatePresence>{generating && <CompileLog />}</AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Detected context strip */}
      {spec.hasContent && (
        <div className="shrink-0 border-t border-border px-4 py-2.5">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex items-center gap-1">
              {(['bg', 'surface', 'accent', 'text'] as const).map((k) => (
                <span
                  key={k}
                  className="h-4 w-4 rounded-full ring-1 ring-white/10"
                  style={{ backgroundColor: spec.palette[k] }}
                />
              ))}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold leading-tight">
                {spec.industry}
              </p>
              <p className="truncate text-[9px] leading-tight text-muted-foreground">
                {TEMPLATE_LABELS[spec.template]}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg border border-border bg-card/70 p-3 text-xs text-muted-foreground">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Composer */}
      <div className="shrink-0 border-t border-border p-3">
        <div className="glow-border rounded-xl border border-border bg-card/70 p-2 focus-within:border-foreground/40">
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing &&
                e.keyCode !== 229
              ) {
                e.preventDefault()
                onGenerate()
              }
            }}
            rows={2}
            placeholder="Describe any app in any language — the agent detects the industry and brands it for you."
            className="w-full resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-muted-foreground">
              Enter to generate · Shift+Enter for newline
            </span>
            <button
              onClick={onGenerate}
              disabled={!prompt.trim() || busy}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              aria-label="Generate app"
            >
              {busy ? (
                <Wand2 className="h-4 w-4 animate-pulse" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          onClick={onExport}
          disabled={!spec.hasContent || generating}
          className="group relative mt-2 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/60 bg-white px-4 py-2.5 text-sm font-semibold tracking-wide text-black shadow-[0_0_18px_-2px_rgba(255,255,255,0.7)] transition-all hover:shadow-[0_0_30px_0px_rgba(255,255,255,0.95)] disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-foreground disabled:shadow-none disabled:opacity-40"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 animate-pulse rounded-xl bg-white/30 group-disabled:hidden"
          />
          <Download className="relative h-4 w-4" />
          <span className="relative">DOWNLOAD APP</span>
        </button>
        <p className="mt-1.5 px-1 text-[10px] leading-relaxed text-muted-foreground">
          Exports a real Expo / React Native project you can build into an
          installable <span className="font-mono">.apk</span> with{' '}
          <span className="font-mono">eas build -p android</span>.
        </p>
      </div>
    </div>
  )
}

function EmptyState({ onPick }: { onPick: (v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <VibecodeMark className="h-7 w-7 shrink-0" />
        <div className="rounded-2xl rounded-tl-sm border border-border bg-card/70 px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
          I&apos;m your autonomous engineering consultant. Describe any product —
          a government tax portal, a coffee shop, a marketplace — and I&apos;ll
          detect the industry, brand it, and compile a functional multi-page app
          preview. Try one of these:
        </div>
      </div>
      <div className="flex flex-col gap-1.5 pl-10">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => onPick(ex)}
            className="rounded-lg border border-border bg-card/50 px-3 py-2 text-left text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}

// Lightweight, dependency-free markdown renderer for assistant replies.
// Supports short headings (##, ###), bold (**text**), inline code (`code`),
// and bullet lists (-, *). Everything else renders as plain paragraphs so the
// consultant can add light structure without ever leaking raw markup.
function renderInline(text: string, keyPrefix: string) {
  // Split on **bold** and `code` while keeping the delimiters.
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={key}
          className="rounded bg-secondary px-1 py-0.5 font-mono text-[0.85em]"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={key}>{part}</span>
  })
}

function RichText({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: ReactNode[] = []
  let bullets: string[] = []

  const flushBullets = () => {
    if (bullets.length === 0) return
    const items = bullets
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="space-y-1 pl-1">
        {items.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
            <span className="flex-1">{renderInline(b, `li-${blocks.length}-${i}`)}</span>
          </li>
        ))}
      </ul>,
    )
    bullets = []
  }

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd()
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    if (bullet) {
      bullets.push(bullet[1])
      return
    }
    flushBullets()
    if (!line.trim()) return
    const heading = line.match(/^\s*(#{2,3})\s+(.*)$/)
    if (heading) {
      blocks.push(
        <p key={`h-${idx}`} className="text-[13px] font-semibold text-foreground">
          {renderInline(heading[2], `h-${idx}`)}
        </p>,
      )
      return
    }
    blocks.push(
      <p key={`p-${idx}`}>{renderInline(line, `p-${idx}`)}</p>,
    )
  })
  flushBullets()

  return <div className="space-y-2">{blocks}</div>
}

function UserBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-row-reverse gap-3"
    >
      <span className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-secondary" />
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-secondary px-3.5 py-2.5 text-sm leading-relaxed text-secondary-foreground">
        {text}
      </div>
    </motion.div>
  )
}

function AssistantBubble({
  message,
  onRecommendation,
  disabled,
}: {
  message: ConsultantMessage
  onRecommendation: (rec: Recommendation) => void
  disabled: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <VibecodeMark className="mt-0.5 h-7 w-7 shrink-0" />
      <div className="max-w-[85%] space-y-2">
        <div className="rounded-2xl rounded-tl-sm border border-border bg-card/70 px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
          {message.text ? (
            <RichText text={message.text} />
          ) : (
            <span className="inline-flex gap-1 py-1 align-middle" aria-label="Assistant is typing">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </span>
          )}
        </div>
        {message.recommendations && message.recommendations.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {message.recommendations.map((rec, i) => (
              <button
                key={rec.label}
                onClick={() => onRecommendation(rec)}
                disabled={disabled}
                className="group flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-left text-[12px] font-medium transition-colors hover:border-foreground/30 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-secondary text-[10px] font-bold text-muted-foreground group-hover:bg-foreground group-hover:text-background">
                  {i + 1}
                </span>
                <span className="flex-1">{rec.label}</span>
                <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Real-time compile log — the agent streaming its analytical thoughts.
function CompileLog() {
  const [step, setStep] = useState(0)
  const perStep = COMPILE_DURATION_MS / COMPILE_STEPS.length

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, COMPILE_STEPS.length - 1))
    }, perStep)
    return () => clearInterval(id)
  }, [perStep])

  const progress = Math.round(((step + 1) / COMPILE_STEPS.length) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-3"
    >
      <VibecodeMark className="mt-0.5 h-7 w-7 shrink-0" />
      <div className="w-full max-w-[85%] space-y-2 rounded-2xl rounded-tl-sm border border-border bg-card/70 px-3.5 py-3">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          <Cpu className="h-3.5 w-3.5 animate-pulse" />
          Compiling snapshot… {progress}%
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-foreground"
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.4 }}
          />
        </div>
        <ul className="space-y-1 pt-0.5">
          {COMPILE_STEPS.slice(0, step + 1).map((s, i) => (
            <motion.li
              key={s}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'flex items-center gap-2 text-[11px]',
                i === step ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  i === step ? 'animate-pulse bg-foreground' : 'bg-muted-foreground/50',
                )}
              />
              {s}
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}
