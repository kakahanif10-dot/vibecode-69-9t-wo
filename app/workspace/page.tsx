'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { PhoneSimulator } from '@/components/workspace/phone-simulator'
import { PromptMenu } from '@/components/workspace/prompt-menu'
import { ApkLoadingOverlay } from '@/components/workspace/apk-loading-overlay'
import { VibecodeLogo } from '@/components/vibecode-logo'
import { DEFAULT_SPEC, type DesignSpec } from '@/lib/design'

export default function WorkspacePage() {
  const [prompt, setPrompt] = useState('')
  const [spec, setSpec] = useState<DesignSpec>(DEFAULT_SPEC)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Live, frontend-only edits to the design spec.
  const patchSpec = (patch: Partial<DesignSpec>) =>
    setSpec((s) => ({ ...s, ...patch }))

  const handleGenerate = async () => {
    const userPrompt = prompt.trim()
    if (!userPrompt || generating) return
    setGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data?.error || data?.message || 'Generation failed')
      }
      setSpec(data.spec as DesignSpec)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
        <VibecodeLogo markClassName="h-7 w-7" />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
            Layer 3 — Prompt Menu
          </span>
          <span className="rounded-full border border-border bg-card/60 px-2.5 py-1 font-mono">
            gemini-3.6-flash
          </span>
        </div>
      </header>

      {/* Two-panel layout */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(360px,460px)_1fr]">
        <div className="relative min-h-0 border-b border-border lg:border-b-0 lg:border-r">
          <PromptMenu
            prompt={prompt}
            onPromptChange={setPrompt}
            spec={spec}
            onPatch={patchSpec}
            onGenerate={handleGenerate}
            generating={generating}
            error={error}
          />
          <AnimatePresence>
            {generating && <ApkLoadingOverlay />}
          </AnimatePresence>
        </div>

        <div className="hidden min-h-0 bg-[oklch(0.12_0_0)] lg:block">
          <PhoneSimulator spec={spec} building={generating} />
        </div>
      </div>
    </div>
  )
}
