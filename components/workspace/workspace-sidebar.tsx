'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  MessageSquare,
  Trash2,
  Settings,
  LifeBuoy,
  FolderGit2,
  Folder,
  Users,
} from 'lucide-react'
import { VibecodeMark } from '@/components/vibecode-logo'
import { cn } from '@/lib/utils'

export type Session = {
  id: string
  name: string
  updated: string
}

export type SidebarTab = 'chats' | 'projects'

const TEAM_PROJECTS = [
  { name: 'Public Sector Suite', status: '4 apps · shared', icon: FolderGit2 },
  { name: 'Retail & Commerce', status: '2 apps · shared', icon: Folder },
  { name: 'Hospitality', status: '1 app · draft', icon: Users },
]

export function WorkspaceSidebar({
  collapsed,
  onToggle,
  tab,
  onTabChange,
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: {
  collapsed: boolean
  onToggle: () => void
  tab: SidebarTab
  onTabChange: (t: SidebarTab) => void
  sessions: Session[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const filtered = sessions.filter((s) =>
    s.name.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 264 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative z-20 flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar"
    >
      {/* Brand + collapse */}
      <div className="flex h-14 items-center justify-between px-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <VibecodeMark className="h-8 w-8 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap text-sm font-semibold tracking-tight"
              >
                Vibecode
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* New project */}
      <div className="px-3">
        <button
          onClick={onNew}
          className={cn(
            'flex h-10 w-full items-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90',
            collapsed ? 'justify-center px-0' : 'px-3',
          )}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsed && 'New Project'}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Tabs */}
          <div className="mt-3 px-3">
            <div className="flex gap-1 rounded-lg border border-sidebar-border bg-background/40 p-0.5">
              {(['chats', 'projects'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onTabChange(t)}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize transition-colors',
                    tab === t
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {tab === 'chats' && (
            <div className="px-3 pt-3">
              <label className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-background/40 px-2.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search chats"
                  className="h-9 w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                />
              </label>
            </div>
          )}
        </>
      )}

      {/* Body */}
      <div className="thin-scroll mt-4 flex-1 overflow-y-auto px-3">
        {tab === 'chats' ? (
          <>
            {!collapsed && (
              <p className="px-1 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Chats
              </p>
            )}
            {filtered.length === 0 ? (
              !collapsed && (
                <p className="px-1 py-4 text-xs text-muted-foreground">
                  No chats yet. Generate an app to start a session.
                </p>
              )
            ) : (
              <ul className="flex flex-col gap-1">
                {filtered.map((s) => {
                  const active = s.id === activeId
                  return (
                    <li key={s.id} className="group relative">
                      <button
                        onClick={() => onSelect(s.id)}
                        title={s.name}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-lg py-2 pl-2.5 pr-8 text-left text-sm transition-colors',
                          active
                            ? 'bg-sidebar-accent text-foreground'
                            : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                          collapsed && 'justify-center px-0 pr-0',
                        )}
                      >
                        <MessageSquare
                          className={cn('h-4 w-4 shrink-0', active && 'text-primary')}
                        />
                        {!collapsed && (
                          <span className="flex-1 overflow-hidden">
                            <span className="block truncate">{s.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {s.updated}
                            </span>
                          </span>
                        )}
                      </button>
                      {!collapsed && (
                        <button
                          onClick={() => onDelete(s.id)}
                          aria-label={`Delete ${s.name}`}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-background/60 hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        ) : (
          <>
            {!collapsed && (
              <p className="px-1 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Team folders
              </p>
            )}
            <ul className="flex flex-col gap-1">
              {TEAM_PROJECTS.map((proj) => (
                <li key={proj.name}>
                  <button
                    title={proj.name}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground',
                      collapsed && 'justify-center px-0',
                    )}
                  >
                    <proj.icon className="h-4 w-4 shrink-0 text-primary" />
                    {!collapsed && (
                      <span className="flex-1 overflow-hidden">
                        <span className="block truncate">{proj.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {proj.status}
                        </span>
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-sidebar-border p-3">
        <ul className="flex flex-col gap-1">
          {[
            { icon: LifeBuoy, label: 'Support' },
            { icon: Settings, label: 'Settings' },
          ].map((item) => (
            <li key={item.label}>
              <button
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground',
                  collapsed && 'justify-center px-0',
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </motion.aside>
  )
}
