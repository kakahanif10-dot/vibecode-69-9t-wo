'use client'

import { useState } from 'react'
import {
  Sparkles,
  Wand2,
  Download,
  Check,
  Palette,
  LayoutTemplate,
  Building2,
  AlertCircle,
} from 'lucide-react'
import { usePwaInstall } from '@/lib/use-pwa-install'
import {
  APP_TYPE_OPTIONS,
  COLOR_SCHEME_OPTIONS,
  PALETTES,
  type AppType,
  type ColorScheme,
  type DesignSpec,
} from '@/lib/design'
import { cn } from '@/lib/utils'

export function PromptMenu({
  prompt,
  onPromptChange,
  spec,
  onPatch,
  onGenerate,
  generating,
  error,
}: {
  prompt: string
  onPromptChange: (v: string) => void
  spec: DesignSpec
  onPatch: (patch: Partial<DesignSpec>) => void
  onGenerate: () => void
  generating: boolean
  error: string | null
}) {
  const { status, install } = usePwaInstall()
  const [installNote, setInstallNote] = useState<string | null>(null)

  const handleInstall = async () => {
    if (status === 'installed') {
      setInstallNote('Already installed on this device.')
      return
    }
    const outcome = await install()
    if (outcome === 'unavailable') {
      setInstallNote(
        'Open on Android Chrome (or use the browser menu → “Add to Home screen”) to install.',
      )
    } else if (outcome === 'dismissed') {
      setInstallNote('Install dismissed — you can try again anytime.')
    } else {
      setInstallNote(null)
    }
  }

  return (
    <div className="thin-scroll flex h-full flex-col overflow-y-auto">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4 text-sm font-medium">
        <Sparkles className="h-4 w-4" />
        Universal App Settings
      </div>

      <div className="flex-1 space-y-6 px-4 py-5">
        {/* Prompt */}
        <section className="space-y-2">
          <label
            htmlFor="l3-prompt"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Describe your design
          </label>
          <div className="glow-border rounded-xl border border-border bg-card/70">
            <textarea
              id="l3-prompt"
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  (e.metaKey || e.ctrlKey) &&
                  !e.nativeEvent.isComposing &&
                  e.keyCode !== 229
                ) {
                  e.preventDefault()
                  onGenerate()
                }
              }}
              rows={4}
              placeholder="e.g. A student portal for Nusantara University with class schedules, grades and campus news."
              className="w-full resize-none bg-transparent p-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Press{' '}
            <kbd className="rounded border border-border bg-secondary px-1">
              ⌘/Ctrl
            </kbd>{' '}
            + <kbd className="rounded border border-border bg-secondary px-1">
              Enter
            </kbd>{' '}
            to generate.
          </p>
        </section>

        {/* App type */}
        <section className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <LayoutTemplate className="h-3.5 w-3.5" /> Application type
          </p>
          <div className="grid grid-cols-2 gap-2">
            {APP_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onPatch({ appType: opt.value as AppType })}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                  spec.appType === opt.value
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Color scheme */}
        <section className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Palette className="h-3.5 w-3.5" /> UI color scheme
          </p>
          <div className="grid grid-cols-2 gap-2">
            {COLOR_SCHEME_OPTIONS.map((opt) => {
              const active = spec.colorScheme === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() =>
                    onPatch({ colorScheme: opt.value as ColorScheme })
                  }
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                    active
                      ? 'border-foreground text-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-white/15"
                    style={{ backgroundColor: PALETTES[opt.value].swatch }}
                  />
                  <span className="truncate">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* App name / brand */}
        <section className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" /> App name / brand
          </p>
          <input
            value={spec.hasContent ? spec.appName : ''}
            maxLength={22}
            onChange={(e) =>
              onPatch({ appName: e.target.value, hasContent: true })
            }
            className="w-full rounded-lg border border-border bg-card/70 px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none"
            placeholder="e.g. Nusantara University"
          />
        </section>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-card/70 p-3 text-xs text-muted-foreground">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 space-y-2 border-t border-border bg-background/90 p-3 backdrop-blur">
        <button
          onClick={onGenerate}
          disabled={!prompt.trim() || generating}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold tracking-wide text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Wand2 className="h-4 w-4" />
          {generating ? 'GENERATING…' : 'GENERATE WITH AI'}
        </button>

        <button
          onClick={handleInstall}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold tracking-wide text-foreground transition-colors hover:bg-secondary"
        >
          {status === 'installed' ? (
            <>
              <Check className="h-4 w-4" /> INSTALLED AS APP
            </>
          ) : (
            <>
              <Download className="h-4 w-4" /> INSTALL AS APP (PWA)
            </>
          )}
        </button>
        {installNote && (
          <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
            {installNote}
          </p>
        )}
      </div>
    </div>
  )
}
