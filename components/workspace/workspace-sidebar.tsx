'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  MessageSquare,
  Settings,
  LifeBuoy,
} from 'lucide-react'
import { VibecodeMark } from '@/components/vibecode-logo'
import { cn } from '@/lib/utils'

export type Project = {
  id: string
  name: string
  updated: string
}

export function WorkspaceSidebar({
  collapsed,
  onToggle,
  projects,
  activeId,
  onSelect,
  onNew,
}: {
  collapsed: boolean
  onToggle: () => void
  projects: Project[]
  activeId: string
  onSelect: (id: string) => void
  onNew: () => void
}) {
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
        <div className="px-3 pt-3">
          <label className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-background/40 px-2.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              placeholder="Search projects"
              className="h-9 w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
          </label>
        </div>
      )}

      {/* Project history */}
      <div className="thin-scroll mt-4 flex-1 overflow-y-auto px-3">
        {!collapsed && (
          <p className="px-1 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recent
          </p>
        )}
        <ul className="flex flex-col gap-1">
          {projects.map((p) => {
            const active = p.id === activeId
            return (
              <li key={p.id}>
                <button
                  onClick={() => onSelect(p.id)}
                  title={p.name}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                    active
                      ? 'bg-sidebar-accent text-foreground'
                      : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                    collapsed && 'justify-center px-0',
                  )}
                >
                  <MessageSquare
                    className={cn(
                      'h-4 w-4 shrink-0',
                      active && 'text-primary',
                    )}
                  />
                  {!collapsed && (
                    <span className="flex-1 overflow-hidden">
                      <span className="block truncate">{p.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {p.updated}
                      </span>
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
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
