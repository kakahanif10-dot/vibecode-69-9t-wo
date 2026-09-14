'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ConsultantPanel } from '@/components/workspace/consultant-panel'
import { ResponsivePreview } from '@/components/workspace/responsive-preview'
import { ThemeDrawer } from '@/components/workspace/theme-drawer'
import {
  WorkspaceSidebar,
  type SidebarTab,
} from '@/components/workspace/workspace-sidebar'
import { VibecodeLogo } from '@/components/vibecode-logo'
import { DEFAULT_SPEC, type DesignSpec } from '@/lib/design'
import {
  COMPILE_DURATION_MS,
  downloadSourceZip,
  introMessage,
  recommendationsFor,
  type ConsultantMessage,
  type Recommendation,
} from '@/lib/consultant'

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

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function WorkspacePage() {
  const [prompt, setPrompt] = useState('')
  const [lastPrompt, setLastPrompt] = useState('')
  const [spec, setSpec] = useState<DesignSpec>(DEFAULT_SPEC)
  const [messages, setMessages] = useState<ConsultantMessage[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [collapsed, setCollapsed] = useState(false)
  const [tab, setTab] = useState<SidebarTab>('chats')
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  // Pane 3 — theme modifier drawer + its 3.6s hydration loop.
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [hydrating, setHydrating] = useState(false)
  const hydrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (hydrateTimer.current) clearTimeout(hydrateTimer.current)
    }
  }, [])

  // Commit a new accent token from the 2D color canvas and run a fluid
  // theme-hydration loop across the active simulator frame (~3.6s).
  const applyAccent = (hex: string) => {
    setSpec((s) => ({ ...s, palette: { ...s.palette, accent: hex } }))
    setHydrating(true)
    if (hydrateTimer.current) clearTimeout(hydrateTimer.current)
    hydrateTimer.current = setTimeout(() => setHydrating(false), COMPILE_DURATION_MS)
  }

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

  // Core generation routine, shared by the composer and the recommendation chips.
  const runGenerate = async (fullPrompt: string, userLabel: string) => {
    if (generating) return
    setGenerating(true)
    setError(null)
    setMessages((m) => [...m, { id: uid(), role: 'user', text: userLabel }])

    try {
      const fetchPromise = fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt: fullPrompt }),
      }).then(async (res) => ({ ok: res.ok, data: await res.json() }))

      // Hold the reveal until the compile log has fully streamed (~3.6s).
      const [{ ok, data }] = await Promise.all([fetchPromise, delay(COMPILE_DURATION_MS)])

      if (!ok || !data.success) {
        throw new Error(data?.error || data?.message || 'Generation failed')
      }

      const newSpec = data.spec as DesignSpec
      setSpec(newSpec)
      setLastPrompt(fullPrompt)

      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          text: introMessage(newSpec),
          recommendations: recommendationsFor(newSpec),
        },
      ])

      // Persist / update the session.
      const title = newSpec.appName || userLabel.slice(0, 24)
      if (activeId) {
        persist(
          sessions.map((se) =>
            se.id === activeId
              ? { ...se, title, prompt: fullPrompt, spec: newSpec, updated: Date.now() }
              : se,
          ),
        )
      } else {
        const id = uid()
        persist(
          [
            { id, title, prompt: fullPrompt, spec: newSpec, updated: Date.now() },
            ...sessions,
          ].slice(0, 30),
        )
        setActiveId(id)
      }
      setTab('chats')
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          text: `I hit a snag compiling that: ${(err as Error).message}. Try rephrasing the prompt or generate again.`,
        },
      ])
      setError((err as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerate = () => {
    const userPrompt = prompt.trim()
    if (!userPrompt) return
    setPrompt('')
    void runGenerate(userPrompt, userPrompt)
  }

  const handleRecommendation = (rec: Recommendation) => {
    const base = lastPrompt || spec.industry || 'the current app'
    void runGenerate(`${base}. Also ${rec.append}.`, `Please add: ${rec.label}`)
  }

  // Universal App Input — industry quick-action seeds run generation directly.
  const handleIndustry = (seed: string) => {
    setPrompt('')
    void runGenerate(seed, seed)
  }

  // Editable App Name / Brand field — live-updates the active spec.
  const handleAppNameChange = (name: string) => {
    setSpec((s) => ({ ...s, appName: name }))
  }

  const handleExport = () => {
    if (spec.hasContent) downloadSourceZip(spec)
  }

  const selectSession = (id: string) => {
    const s = sessions.find((x) => x.id === id)
    if (!s) return
    setActiveId(id)
    setSpec(s.spec)
    setPrompt('')
    setLastPrompt(s.prompt)
    setError(null)
    // Restore a lightweight conversation recap for the loaded project.
    setMessages([
      {
        id: uid(),
        role: 'assistant',
        text: introMessage(s.spec),
        recommendations: recommendationsFor(s.spec),
      },
    ])
  }

  const deleteSession = (id: string) => {
    const next = sessions.filter((x) => x.id !== id)
    persist(next)
    if (activeId === id) {
      setActiveId(null)
      setSpec(DEFAULT_SPEC)
      setPrompt('')
      setLastPrompt('')
      setMessages([])
    }
  }

  const newProject = () => {
    setActiveId(null)
    setSpec(DEFAULT_SPEC)
    setPrompt('')
    setLastPrompt('')
    setMessages([])
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

        {/* Three-pane console: consultant · preview · modifier drawer */}
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(340px,420px)_1fr_auto]">
          <div className="min-h-0 border-b border-border lg:border-b-0 lg:border-r">
            <ConsultantPanel
              prompt={prompt}
              onPromptChange={setPrompt}
              onGenerate={handleGenerate}
              onRecommendation={handleRecommendation}
              onExport={handleExport}
              generating={generating}
              error={error}
              messages={messages}
              spec={spec}
            />
          </div>

          <div className="hidden min-h-0 lg:block">
            <ResponsivePreview spec={spec} building={generating || hydrating} />
          </div>

          <ThemeDrawer
            spec={spec}
            open={drawerOpen}
            onToggle={() => setDrawerOpen((o) => !o)}
            onApplyAccent={applyAccent}
            disabled={!spec.hasContent || generating}
            prompt={prompt}
            onPromptChange={setPrompt}
            onGenerate={handleGenerate}
            onIndustry={handleIndustry}
            onAppNameChange={handleAppNameChange}
            generating={generating}
          />
        </div>
      </div>
    </div>
  )
}
