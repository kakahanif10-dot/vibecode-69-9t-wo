'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { PhoneSimulator } from '@/components/workspace/phone-simulator'
import { PromptMenu } from '@/components/workspace/prompt-menu'
import { ApkLoadingOverlay } from '@/components/workspace/apk-loading-overlay'
import {
  WorkspaceSidebar,
  type SidebarTab,
} from '@/components/workspace/workspace-sidebar'
import { VibecodeLogo } from '@/components/vibecode-logo'
import { DEFAULT_SPEC, type DesignSpec } from '@/lib/design'

type Session = {
  id: string
  title: string
  prompt: string
  spec: DesignSpec
  updated: number
}

const STORE_KEY = 'vibecode.sessions.v1'

// Persist sessions as a base64 string — lightweight, client-only, 0 MB server storage.
function encode(sessions: Session[]): string {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(sessions))))
  } catch {
    return ''
  }
}
function decode(raw: string): Session[] {
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(raw))))
    return Array.isArray(parsed) ? (parsed as Session[]) : []
  } catch {
    return []
  }
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.round(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.round(hr / 24)}d ago`
}

export default function WorkspacePage() {
  const [prompt, setPrompt] = useState('')
  const [spec, setSpec] = useState<DesignSpec>(DEFAULT_SPEC)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [collapsed, setCollapsed] = useState(false)
  const [tab, setTab] = useState<SidebarTab>('chats')
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  // Hydrate sessions from the browser after mount (avoids SSR mismatch).
  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORE_KEY) : null
    if (raw) setSessions(decode(raw))
  }, [])

  const persist = (next: Session[]) => {
    setSessions(next)
    try {
      localStorage.setItem(STORE_KEY, encode(next))
    } catch {
      /* storage unavailable — stay in-memory */
    }
  }

  // Live, frontend-only edits to the design spec (also mirrored into the active session).
  const patchSpec = (patch: Partial<DesignSpec>) =>
    setSpec((s) => {
      const next = { ...s, ...patch }
      if (activeId) {
        setSessions((list) => {
          const updated = list.map((se) =>
            se.id === activeId ? { ...se, spec: next, updated: Date.now() } : se,
          )
          try {
            localStorage.setItem(STORE_KEY, encode(updated))
          } catch {
            /* ignore */
          }
          return updated
        })
      }
      return next
    })

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
      const newSpec = data.spec as DesignSpec
      setSpec(newSpec)

      const id = crypto.randomUUID()
      const session: Session = {
        id,
        title: newSpec.appName || userPrompt.slice(0, 24),
        prompt: userPrompt,
        spec: newSpec,
        updated: Date.now(),
      }
      persist([session, ...sessions].slice(0, 30))
      setActiveId(id)
      setTab('chats')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  const selectSession = (id: string) => {
    const s = sessions.find((x) => x.id === id)
    if (!s) return
    setActiveId(id)
    setSpec(s.spec)
    setPrompt(s.prompt)
    setError(null)
  }

  const deleteSession = (id: string) => {
    const next = sessions.filter((x) => x.id !== id)
    persist(next)
    if (activeId === id) {
      setActiveId(null)
      setSpec(DEFAULT_SPEC)
      setPrompt('')
    }
  }

  const newProject = () => {
    setActiveId(null)
    setSpec(DEFAULT_SPEC)
    setPrompt('')
    setError(null)
  }

  const sidebarSessions = useMemo(
    () =>
      sessions.map((s) => ({
        id: s.id,
        name: s.title,
        updated: relativeTime(s.updated),
      })),
    [sessions],
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <WorkspaceSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        tab={tab}
        onTabChange={setTab}
        sessions={sidebarSessions}
        activeId={activeId}
        onSelect={selectSession}
        onNew={newProject}
        onDelete={deleteSession}
        spec={spec}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
          <VibecodeLogo markClassName="h-7 w-7" />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="hidden items-center gap-1.5 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
              Universal Context-Aware Engine
            </span>
            <span className="rounded-full border border-border bg-card/60 px-2.5 py-1 font-mono">
              gemini-3.5-flash · Google AI
            </span>
          </div>
        </header>

        {/* Two-panel layout */}
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(340px,440px)_1fr]">
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
            <AnimatePresence>{generating && <ApkLoadingOverlay />}</AnimatePresence>
          </div>

          <div className="hidden min-h-0 bg-[oklch(0.12_0_0)] lg:block">
            <PhoneSimulator spec={spec} building={generating} />
          </div>
        </div>
      </div>
    </div>
  )
}
