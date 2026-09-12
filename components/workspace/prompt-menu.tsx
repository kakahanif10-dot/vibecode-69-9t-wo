'use client'

import { useState } from 'react'
import {
  Sparkles,
  Wand2,
  Download,
  Check,
  Type,
  Palette,
  Shirt,
  AlertCircle,
} from 'lucide-react'
import { usePwaInstall } from '@/lib/use-pwa-install'
import {
  GARMENT_OPTIONS,
  SWATCHES,
  type DesignSpec,
  type Garment,
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
        Prompt Menu
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
              placeholder="e.g. A minimalist streetwear hoodie for a coffee brand called Cloudpour, cream on charcoal."
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

        {/* Garment */}
        <section className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Shirt className="h-3.5 w-3.5" /> Garment
          </p>
          <div className="grid grid-cols-3 gap-2">
            {GARMENT_OPTIONS.map((g) => (
              <button
                key={g.value}
                onClick={() => onPatch({ garment: g.value as Garment })}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                  spec.garment === g.value
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </section>

        {/* Garment color */}
        <ColorRow
          icon={<Palette className="h-3.5 w-3.5" />}
          label="Fabric color"
          value={spec.garmentColor}
          onChange={(garmentColor) => onPatch({ garmentColor })}
        />

        {/* Print color */}
        <ColorRow
          icon={<Palette className="h-3.5 w-3.5" />}
          label="Print color"
          value={spec.textColor}
          onChange={(textColor) => onPatch({ textColor })}
        />

        {/* Slogan */}
        <section className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Type className="h-3.5 w-3.5" /> Printed slogan
          </p>
          <input
            value={spec.slogan}
            maxLength={24}
            onChange={(e) => onPatch({ slogan: e.target.value.toUpperCase() })}
            className="w-full rounded-lg border border-border bg-card/70 px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none"
            placeholder="VIBECODE"
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

function ColorRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <section className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {SWATCHES.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            aria-label={`Set ${label} to ${c}`}
            className={cn(
              'h-7 w-7 rounded-full ring-1 ring-white/15 transition-transform hover:scale-110',
              value.toLowerCase() === c.toLowerCase() &&
                'ring-2 ring-foreground ring-offset-2 ring-offset-background',
            )}
            style={{ backgroundColor: c }}
          />
        ))}
        <label className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full ring-1 ring-white/15">
          <span
            className="block h-full w-full"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={`Custom ${label}`}
          />
        </label>
      </div>
    </section>
  )
}
