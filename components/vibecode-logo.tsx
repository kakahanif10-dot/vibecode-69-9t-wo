import { cn } from '@/lib/utils'

export function VibecodeMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Vibecode"
      className={cn('inline-block', className)}
    >
      <rect
        x="4"
        y="4"
        width="32"
        height="32"
        rx="9"
        className="stroke-border"
        strokeWidth="1.5"
      />
      <path
        d="M17 15l-4 5 4 5M23 15l4 5-4 5"
        className="stroke-foreground"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function VibecodeLogo({
  className,
  markClassName,
  wordmark = true,
}: {
  className?: string
  markClassName?: string
  wordmark?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <VibecodeMark className={cn('h-8 w-8', markClassName)} />
      {wordmark && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          Vibecode
          <span className="text-muted-foreground"> Inc.</span>
        </span>
      )}
    </span>
  )
}
