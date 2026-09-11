'use client'

import { motion } from 'framer-motion'
import { ChevronDown, Rocket, Share2, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function WorkspaceTopnav({
  projectName,
  deployState,
  onDeploy,
}: {
  projectName: string
  deployState: 'idle' | 'deploying' | 'deployed'
  onDeploy: () => void
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/60 px-4 backdrop-blur">
      <div className="flex items-center gap-2 text-sm">
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-foreground transition-colors hover:bg-secondary">
          <span className="font-medium">{projectName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <span className="rounded-full border border-border bg-card/60 px-2 py-0.5 text-xs text-muted-foreground">
          Draft
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>
        <Button
          onClick={onDeploy}
          disabled={deployState === 'deploying'}
          className="h-9 gap-1.5 rounded-lg bg-primary font-medium text-primary-foreground hover:opacity-90"
        >
          {deployState === 'idle' && (
            <>
              <Rocket className="h-4 w-4" />
              Deploy
            </>
          )}
          {deployState === 'deploying' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deploying
            </>
          )}
          {deployState === 'deployed' && (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              Live
            </motion.span>
          )}
        </Button>
        <span
          className="ml-1 h-8 w-8 rounded-full border border-border bg-secondary"
          aria-label="Account"
        />
      </div>
    </header>
  )
}
