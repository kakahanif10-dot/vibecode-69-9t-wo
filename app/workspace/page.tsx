'use client'

import { useState } from 'react'
import {
  WorkspaceSidebar,
  type Project,
} from '@/components/workspace/workspace-sidebar'
import { WorkspaceTopnav } from '@/components/workspace/workspace-topnav'
import { ChatPanel, type ChatMessage } from '@/components/workspace/chat-panel'
import { PreviewPanel } from '@/components/workspace/preview-panel'

const PROJECTS: Project[] = [
  { id: 'p1', name: 'Cloudpour Coffee', updated: 'Edited just now' },
  { id: 'p2', name: 'Northlight Dashboard', updated: 'Edited 2h ago' },
  { id: 'p3', name: 'Recipe Box', updated: 'Yesterday' },
  { id: 'p4', name: 'Portfolio v3', updated: '3 days ago' },
]

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    role: 'user',
    content: 'Build a landing page for my coffee shop with a menu and hours.',
  },
  {
    id: 'm2',
    role: 'assistant',
    content:
      'Done. I generated a landing page with a hero, a six-item menu grid, and an hours section. Preview it on the right, or ask for changes.',
    steps: [
      'Created app/page.tsx',
      'Added Hero and MenuGrid components',
      'Wired up the hours schedule',
    ],
  },
]

let idCounter = 100

export default function WorkspacePage() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeId, setActiveId] = useState('p1')
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [built, setBuilt] = useState(true)
  const [deployState, setDeployState] = useState<
    'idle' | 'deploying' | 'deployed'
  >('idle')

  const handleSend = () => {
    if (!input.trim() || generating) return
    const userMsg: ChatMessage = {
      id: `u${idCounter++}`,
      role: 'user',
      content: input.trim(),
    }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setGenerating(true)
    setBuilt(false)

    // Simulate generation streaming + preview build.
    setTimeout(() => {
      setBuilt(true)
    }, 1600)
    setTimeout(() => {
      setGenerating(false)
      setMessages((m) => [
        ...m,
        {
          id: `a${idCounter++}`,
          role: 'assistant',
          content:
            'Applied your changes and rebuilt the preview. Let me know what to refine next.',
          steps: ['Updated components', 'Rebuilt live preview'],
        },
      ])
    }, 2400)
  }

  const handleNew = () => {
    setMessages([])
    setBuilt(false)
    setDeployState('idle')
  }

  const handleDeploy = () => {
    if (deployState === 'deploying') return
    setDeployState('deploying')
    setTimeout(() => setDeployState('deployed'), 2000)
  }

  const activeProject =
    PROJECTS.find((p) => p.id === activeId)?.name ?? 'Untitled Project'

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <WorkspaceSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        projects={PROJECTS}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNew}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceTopnav
          projectName={activeProject}
          deployState={deployState}
          onDeploy={handleDeploy}
        />

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(340px,420px)_1fr]">
          <div className="min-h-0 border-r border-border">
            <ChatPanel
              messages={messages}
              input={input}
              onInputChange={setInput}
              onSend={handleSend}
              generating={generating}
            />
          </div>
          <div className="hidden min-h-0 lg:block">
            <PreviewPanel building={generating && !built} built={built} />
          </div>
        </div>
      </div>
    </div>
  )
}
