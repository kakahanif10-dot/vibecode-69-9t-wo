'use client'

/* ------------------------------------------------------------------ */
/* Vibecode Arcade — real, playable games rendered live in the preview  */
/* Snake · Tetris · Dino. Each is a self-contained React component with  */
/* keyboard + on-screen touch controls, scoring, pause and restart.     */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import type { DesignSpec, GameKind } from '@/lib/design'
import { cn } from '@/lib/utils'

const GAMES: { key: GameKind; label: string }[] = [
  { key: 'snake', label: 'Snake' },
  { key: 'tetris', label: 'Tetris' },
  { key: 'dino', label: 'Dino Run' },
]

export function GameArcade({ spec }: { spec: DesignSpec }) {
  const p = spec.palette
  const [active, setActive] = useState<GameKind>(spec.game ?? 'snake')

  useEffect(() => {
    if (spec.game) setActive(spec.game)
  }, [spec.game])

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ backgroundColor: p.bg, color: p.text }}
    >
      {/* Cabinet header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${p.border}` }}
      >
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold leading-tight tracking-wide">
            {spec.appName}
          </p>
          <p className="truncate text-[9px] leading-tight" style={{ color: p.muted }}>
            {spec.industry || 'Arcade / Game'}
          </p>
        </div>
        <span
          className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase"
          style={{ backgroundColor: p.accent, color: p.accentText }}
        >
          Insert Coin
        </span>
      </div>

      {/* Game selector */}
      <div className="flex shrink-0 gap-1.5 px-3 py-2" style={{ borderBottom: `1px solid ${p.border}` }}>
        {GAMES.map((g) => {
          const on = g.key === active
          return (
            <button
              key={g.key}
              onClick={() => setActive(g.key)}
              className="flex-1 rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors"
              style={{
                backgroundColor: on ? p.accent : p.surface,
                color: on ? p.accentText : p.muted,
                border: `1px solid ${p.border}`,
              }}
            >
              {g.label}
            </button>
          )
        })}
      </div>

      {/* Active game */}
      <div className="thin-scroll flex min-h-0 flex-1 items-start justify-center overflow-y-auto p-3">
        {active === 'snake' && <SnakeGame spec={spec} />}
        {active === 'tetris' && <TetrisGame spec={spec} />}
        {active === 'dino' && <DinoGame spec={spec} />}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Shared UI bits                                                       */
/* ------------------------------------------------------------------ */

function ScoreBar({
  spec,
  items,
}: {
  spec: DesignSpec
  items: { label: string; value: string | number }[]
}) {
  const p = spec.palette
  return (
    <div className="flex w-full items-center justify-between gap-2">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex-1 rounded-lg px-2 py-1 text-center"
          style={{ backgroundColor: p.surface, border: `1px solid ${p.border}` }}
        >
          <p className="text-[8px] uppercase tracking-wide" style={{ color: p.muted }}>
            {it.label}
          </p>
          <p className="font-mono text-sm font-bold" style={{ color: p.accent }}>
            {it.value}
          </p>
        </div>
      ))}
    </div>
  )
}

function ControlButton({
  spec,
  onClick,
  children,
  ariaLabel,
  className,
}: {
  spec: DesignSpec
  onClick: () => void
  children: React.ReactNode
  ariaLabel: string
  className?: string
}) {
  const p = spec.palette
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={cn(
        'flex items-center justify-center rounded-lg transition-transform active:scale-90',
        className,
      )}
      style={{ backgroundColor: p.surface, color: p.text, border: `1px solid ${p.border}` }}
    >
      {children}
    </button>
  )
}

function Overlay({
  spec,
  title,
  hint,
  onAction,
  actionLabel,
}: {
  spec: DesignSpec
  title: string
  hint: string
  onAction: () => void
  actionLabel: string
}) {
  const p = spec.palette
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.62)' }}>
      <p className="text-lg font-black uppercase tracking-widest" style={{ color: p.accent }}>
        {title}
      </p>
      <p className="px-6 text-center text-[11px]" style={{ color: p.text }}>
        {hint}
      </p>
      <button
        onClick={onAction}
        className="mt-1 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition-opacity active:opacity-80"
        style={{ backgroundColor: p.accent, color: p.accentText }}
      >
        <Play className="h-3.5 w-3.5" /> {actionLabel}
      </button>
    </div>
  )
}

// Small helper — subscribe to arrow/WASD/space with preventDefault scroll.
function useGameKeys(handler: (key: string) => void, enabled = true) {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const k = e.key
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(k)
      ) {
        e.preventDefault()
        ref.current(k)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}

/* ------------------------------------------------------------------ */
/* SNAKE                                                                */
/* ------------------------------------------------------------------ */

const SNAKE_COLS = 17
const SNAKE_ROWS = 17

type Cell = { x: number; y: number }
type Dir = 'up' | 'down' | 'left' | 'right'

function SnakeGame({ spec }: { spec: DesignSpec }) {
  const p = spec.palette
  const [snake, setSnake] = useState<Cell[]>([{ x: 8, y: 8 }])
  const [food, setFood] = useState<Cell>({ x: 4, y: 4 })
  const [dir, setDir] = useState<Dir>('right')
  const [running, setRunning] = useState(false)
  const [over, setOver] = useState(false)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)

  const dirRef = useRef(dir)
  const nextDirRef = useRef(dir)
  dirRef.current = dir

  const randFood = useCallback((body: Cell[]): Cell => {
    let c: Cell
    do {
      c = { x: Math.floor(Math.random() * SNAKE_COLS), y: Math.floor(Math.random() * SNAKE_ROWS) }
    } while (body.some((s) => s.x === c.x && s.y === c.y))
    return c
  }, [])

  const reset = useCallback(() => {
    const start = [{ x: 8, y: 8 }]
    setSnake(start)
    setDir('right')
    nextDirRef.current = 'right'
    setFood(randFood(start))
    setScore(0)
    setOver(false)
    setRunning(true)
  }, [randFood])

  const turn = useCallback((d: Dir) => {
    const cur = dirRef.current
    const opposite =
      (cur === 'up' && d === 'down') ||
      (cur === 'down' && d === 'up') ||
      (cur === 'left' && d === 'right') ||
      (cur === 'right' && d === 'left')
    if (!opposite) nextDirRef.current = d
  }, [])

  useGameKeys((k) => {
    if (k === 'ArrowUp' || k === 'w' || k === 'W') turn('up')
    else if (k === 'ArrowDown' || k === 's' || k === 'S') turn('down')
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') turn('left')
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') turn('right')
    else if (k === ' ') {
      if (over) reset()
      else setRunning((r) => !r)
    }
  })

  useEffect(() => {
    if (!running || over) return
    const speed = Math.max(75, 140 - score * 3)
    const id = setInterval(() => {
      setSnake((prev) => {
        const d = nextDirRef.current
        setDir(d)
        const head = { ...prev[0] }
        if (d === 'up') head.y -= 1
        if (d === 'down') head.y += 1
        if (d === 'left') head.x -= 1
        if (d === 'right') head.x += 1

        // Wall or self collision → game over.
        if (
          head.x < 0 || head.x >= SNAKE_COLS ||
          head.y < 0 || head.y >= SNAKE_ROWS ||
          prev.some((s) => s.x === head.x && s.y === head.y)
        ) {
          setOver(true)
          setRunning(false)
          setBest((b) => Math.max(b, score))
          return prev
        }

        const ate = head.x === food.x && head.y === food.y
        const next = [head, ...prev]
        if (ate) {
          setScore((s) => s + 1)
          setFood(randFood(next))
        } else {
          next.pop()
        }
        return next
      })
    }, speed)
    return () => clearInterval(id)
  }, [running, over, score, food, randFood])

  return (
    <div className="flex w-full max-w-[300px] flex-col gap-2.5">
      <ScoreBar spec={spec} items={[{ label: 'Score', value: score }, { label: 'Best', value: best }]} />

      <div className="relative">
        <div
          className="grid aspect-square w-full overflow-hidden rounded-xl"
          style={{
            gridTemplateColumns: `repeat(${SNAKE_COLS}, 1fr)`,
            backgroundColor: p.surface,
            border: `1px solid ${p.border}`,
          }}
        >
          {Array.from({ length: SNAKE_COLS * SNAKE_ROWS }).map((_, i) => {
            const x = i % SNAKE_COLS
            const y = Math.floor(i / SNAKE_COLS)
            const isHead = snake[0]?.x === x && snake[0]?.y === y
            const isBody = !isHead && snake.some((s) => s.x === x && s.y === y)
            const isFood = food.x === x && food.y === y
            return (
              <div
                key={i}
                style={{
                  backgroundColor: isHead
                    ? p.accent
                    : isBody
                      ? `${p.accent}aa`
                      : isFood
                        ? '#f43f5e'
                        : 'transparent',
                  borderRadius: isFood ? '50%' : isHead || isBody ? '2px' : 0,
                }}
              />
            )
          })}
        </div>

        {!running && !over && (
          <Overlay spec={spec} title="Snake" hint="Arrows / WASD to move · eat the dots · avoid the walls and yourself." onAction={reset} actionLabel="Play" />
        )}
        {over && (
          <Overlay spec={spec} title="Game Over" hint={`You scored ${score}. Press play or Space to try again.`} onAction={reset} actionLabel="Retry" />
        )}
      </div>

      <SnakePad spec={spec} onTurn={turn} onToggle={() => (over ? reset() : setRunning((r) => !r))} running={running} over={over} />
    </div>
  )
}

function SnakePad({
  spec,
  onTurn,
  onToggle,
  running,
  over,
}: {
  spec: DesignSpec
  onTurn: (d: Dir) => void
  onToggle: () => void
  running: boolean
  over: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="grid grid-cols-3 grid-rows-3 gap-1" style={{ width: 116 }}>
        <span />
        <ControlButton spec={spec} ariaLabel="Up" onClick={() => onTurn('up')} className="h-9"><ChevronUp className="h-4 w-4" /></ControlButton>
        <span />
        <ControlButton spec={spec} ariaLabel="Left" onClick={() => onTurn('left')} className="h-9"><ChevronLeft className="h-4 w-4" /></ControlButton>
        <ControlButton spec={spec} ariaLabel="Down" onClick={() => onTurn('down')} className="h-9"><ChevronDown className="h-4 w-4" /></ControlButton>
        <ControlButton spec={spec} ariaLabel="Right" onClick={() => onTurn('right')} className="h-9"><ChevronRight className="h-4 w-4" /></ControlButton>
      </div>
      <ControlButton spec={spec} ariaLabel={over ? 'Restart' : running ? 'Pause' : 'Play'} onClick={onToggle} className="h-11 w-11">
        {over ? <RotateCcw className="h-4 w-4" /> : running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </ControlButton>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* TETRIS                                                               */
/* ------------------------------------------------------------------ */

const T_COLS = 10
const T_ROWS = 18

type Shape = number[][]
const TETROMINOES: { shape: Shape; color: string }[] = [
  { shape: [[1, 1, 1, 1]], color: '#22d3ee' }, // I
  { shape: [[1, 1], [1, 1]], color: '#facc15' }, // O
  { shape: [[0, 1, 0], [1, 1, 1]], color: '#a855f7' }, // T
  { shape: [[0, 1, 1], [1, 1, 0]], color: '#4ade80' }, // S
  { shape: [[1, 1, 0], [0, 1, 1]], color: '#f43f5e' }, // Z
  { shape: [[1, 0, 0], [1, 1, 1]], color: '#3b82f6' }, // J
  { shape: [[0, 0, 1], [1, 1, 1]], color: '#fb923c' }, // L
]

type Piece = { shape: Shape; color: string; x: number; y: number }

const emptyBoard = (): (string | null)[][] =>
  Array.from({ length: T_ROWS }, () => Array<string | null>(T_COLS).fill(null))

function randomPiece(): Piece {
  const t = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)]
  return { shape: t.shape, color: t.color, x: Math.floor((T_COLS - t.shape[0].length) / 2), y: 0 }
}

function rotate(shape: Shape): Shape {
  const rows = shape.length
  const cols = shape[0].length
  const out: Shape = Array.from({ length: cols }, () => Array<number>(rows).fill(0))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out[c][rows - 1 - r] = shape[r][c]
    }
  }
  return out
}

function collides(board: (string | null)[][], piece: Piece, nx: number, ny: number, shape?: Shape): boolean {
  const s = shape ?? piece.shape
  for (let r = 0; r < s.length; r++) {
    for (let c = 0; c < s[r].length; c++) {
      if (!s[r][c]) continue
      const x = nx + c
      const y = ny + r
      if (x < 0 || x >= T_COLS || y >= T_ROWS) return true
      if (y >= 0 && board[y][x]) return true
    }
  }
  return false
}

function TetrisGame({ spec }: { spec: DesignSpec }) {
  const p = spec.palette
  const [board, setBoard] = useState<(string | null)[][]>(emptyBoard)
  const [piece, setPiece] = useState<Piece>(randomPiece)
  const [running, setRunning] = useState(false)
  const [over, setOver] = useState(false)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)

  const boardRef = useRef(board)
  const pieceRef = useRef(piece)
  boardRef.current = board
  pieceRef.current = piece

  const lockAndSpawn = useCallback((b: (string | null)[][], pc: Piece) => {
    const nb = b.map((row) => [...row])
    pc.shape.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v) {
          const y = pc.y + r
          const x = pc.x + c
          if (y >= 0) nb[y][x] = pc.color
        }
      }),
    )
    // Clear full lines.
    let cleared = 0
    for (let r = T_ROWS - 1; r >= 0; r--) {
      if (nb[r].every((cell) => cell)) {
        nb.splice(r, 1)
        nb.unshift(Array<string | null>(T_COLS).fill(null))
        cleared++
        r++
      }
    }
    if (cleared) {
      setLines((l) => l + cleared)
      setScore((s) => s + [0, 40, 100, 300, 1200][cleared])
    }
    const next = randomPiece()
    if (collides(nb, next, next.x, next.y)) {
      setBoard(nb)
      setOver(true)
      setRunning(false)
      return
    }
    setBoard(nb)
    setPiece(next)
  }, [])

  const step = useCallback(() => {
    const b = boardRef.current
    const pc = pieceRef.current
    if (!collides(b, pc, pc.x, pc.y + 1)) {
      setPiece({ ...pc, y: pc.y + 1 })
    } else {
      lockAndSpawn(b, pc)
    }
  }, [lockAndSpawn])

  const move = useCallback((dx: number) => {
    const b = boardRef.current
    const pc = pieceRef.current
    if (!collides(b, pc, pc.x + dx, pc.y)) setPiece({ ...pc, x: pc.x + dx })
  }, [])

  const rotatePiece = useCallback(() => {
    const b = boardRef.current
    const pc = pieceRef.current
    const r = rotate(pc.shape)
    // Basic wall kick.
    for (const kick of [0, -1, 1, -2, 2]) {
      if (!collides(b, pc, pc.x + kick, pc.y, r)) {
        setPiece({ ...pc, x: pc.x + kick, shape: r })
        return
      }
    }
  }, [])

  const drop = useCallback(() => {
    const b = boardRef.current
    const pc = pieceRef.current
    let y = pc.y
    while (!collides(b, pc, pc.x, y + 1)) y++
    lockAndSpawn(b, { ...pc, y })
  }, [lockAndSpawn])

  const reset = useCallback(() => {
    setBoard(emptyBoard())
    setPiece(randomPiece())
    setScore(0)
    setLines(0)
    setOver(false)
    setRunning(true)
  }, [])

  useGameKeys((k) => {
    if (over) {
      if (k === ' ') reset()
      return
    }
    if (!running) {
      if (k === ' ') setRunning(true)
      return
    }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') move(-1)
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') move(1)
    else if (k === 'ArrowDown' || k === 's' || k === 'S') step()
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') rotatePiece()
    else if (k === ' ') drop()
  })

  useEffect(() => {
    if (!running || over) return
    const speed = Math.max(140, 520 - lines * 24)
    const id = setInterval(step, speed)
    return () => clearInterval(id)
  }, [running, over, lines, step])

  // Compose board + active piece for rendering.
  const view = board.map((row) => [...row])
  piece.shape.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v) {
        const y = piece.y + r
        const x = piece.x + c
        if (y >= 0 && y < T_ROWS && x >= 0 && x < T_COLS) view[y][x] = piece.color
      }
    }),
  )

  return (
    <div className="flex w-full max-w-[280px] flex-col gap-2.5">
      <ScoreBar spec={spec} items={[{ label: 'Score', value: score }, { label: 'Lines', value: lines }]} />

      <div className="relative mx-auto">
        <div
          className="grid overflow-hidden rounded-xl"
          style={{
            gridTemplateColumns: `repeat(${T_COLS}, 1fr)`,
            width: 'min(56vw, 200px)',
            aspectRatio: `${T_COLS} / ${T_ROWS}`,
            backgroundColor: p.surface,
            border: `1px solid ${p.border}`,
          }}
        >
          {view.flatMap((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                style={{
                  backgroundColor: cell ?? 'transparent',
                  outline: cell ? '1px solid rgba(0,0,0,0.25)' : 'none',
                  outlineOffset: -1,
                }}
              />
            )),
          )}
        </div>

        {!running && !over && (
          <Overlay spec={spec} title="Tetris" hint="← → move · ↑ rotate · ↓ soft drop · Space hard drop." onAction={reset} actionLabel="Play" />
        )}
        {over && (
          <Overlay spec={spec} title="Game Over" hint={`Score ${score} · ${lines} lines cleared.`} onAction={reset} actionLabel="Retry" />
        )}
      </div>

      <div className="flex items-center justify-between gap-1.5">
        <ControlButton spec={spec} ariaLabel="Left" onClick={() => move(-1)} className="h-10 flex-1"><ChevronLeft className="h-4 w-4" /></ControlButton>
        <ControlButton spec={spec} ariaLabel="Rotate" onClick={rotatePiece} className="h-10 flex-1"><RotateCcw className="h-4 w-4" /></ControlButton>
        <ControlButton spec={spec} ariaLabel="Right" onClick={() => move(1)} className="h-10 flex-1"><ChevronRight className="h-4 w-4" /></ControlButton>
        <ControlButton spec={spec} ariaLabel="Drop" onClick={drop} className="h-10 flex-1"><ChevronDown className="h-4 w-4" /></ControlButton>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* DINO RUN                                                             */
/* ------------------------------------------------------------------ */

function DinoGame({ spec }: { spec: DesignSpec }) {
  const p = spec.palette
  const [running, setRunning] = useState(false)
  const [over, setOver] = useState(false)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [tick, setTick] = useState(0) // forces re-render each frame

  // Physics kept in refs so the RAF loop reads fresh values without re-subscribing.
  const groundY = 0
  const dinoY = useRef(groundY) // height above ground (px)
  const vel = useRef(0)
  const obstacles = useRef<{ x: number; h: number; w: number }[]>([])
  const speed = useRef(3.4)
  const distance = useRef(0)
  const raf = useRef<number | null>(null)
  const last = useRef(0)
  const runningRef = useRef(false)
  const overRef = useRef(false)
  runningRef.current = running
  overRef.current = over

  const FIELD_W = 300
  const FIELD_H = 120
  const DINO_X = 30
  const DINO_SIZE = 22
  const GRAVITY = 0.75
  const JUMP_V = 12.5

  const jump = useCallback(() => {
    if (overRef.current) return
    if (!runningRef.current) {
      setRunning(true)
      return
    }
    if (dinoY.current <= 0.5) vel.current = JUMP_V
  }, [])

  const reset = useCallback(() => {
    dinoY.current = 0
    vel.current = 0
    obstacles.current = []
    speed.current = 3.4
    distance.current = 0
    setScore(0)
    setOver(false)
    setRunning(true)
  }, [])

  useGameKeys((k) => {
    if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') {
      if (overRef.current) reset()
      else jump()
    }
  })

  useEffect(() => {
    if (!running || over) return
    const loop = (t: number) => {
      if (!last.current) last.current = t
      const dt = Math.min(2.5, (t - last.current) / 16.67)
      last.current = t

      // Dino vertical motion.
      vel.current -= GRAVITY * dt
      dinoY.current = Math.max(0, dinoY.current + vel.current * dt)
      if (dinoY.current === 0) vel.current = 0

      // Move + spawn obstacles.
      speed.current += 0.0015 * dt
      distance.current += speed.current * dt
      obstacles.current = obstacles.current
        .map((o) => ({ ...o, x: o.x - speed.current * dt }))
        .filter((o) => o.x + o.w > -5)

      const lastObs = obstacles.current[obstacles.current.length - 1]
      if (!lastObs || lastObs.x < FIELD_W - (120 + Math.random() * 120)) {
        obstacles.current.push({ x: FIELD_W, h: 18 + Math.random() * 20, w: 12 + Math.random() * 10 })
      }

      // Collision test (AABB).
      const dinoTop = FIELD_H - DINO_SIZE - dinoY.current
      const dinoBottom = FIELD_H - dinoY.current
      for (const o of obstacles.current) {
        const oLeft = o.x
        const oRight = o.x + o.w
        const oTop = FIELD_H - o.h
        if (DINO_X + DINO_SIZE > oLeft && DINO_X < oRight && dinoBottom > oTop && dinoTop < FIELD_H) {
          setOver(true)
          setRunning(false)
          setBest((b) => Math.max(b, Math.floor(distance.current / 10)))
          return
        }
      }

      setScore(Math.floor(distance.current / 10))
      setTick((n) => (n + 1) % 1000000)
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      last.current = 0
    }
  }, [running, over])

  // Read refs during render (tick forces this to re-run each frame).
  void tick
  const dinoBottomPx = dinoY.current

  return (
    <div className="flex w-full max-w-[320px] flex-col gap-2.5">
      <ScoreBar spec={spec} items={[{ label: 'Score', value: score }, { label: 'Best', value: best }]} />

      <div
        className="relative w-full cursor-pointer select-none overflow-hidden rounded-xl"
        style={{ aspectRatio: `${FIELD_W} / ${FIELD_H}`, backgroundColor: p.surface, border: `1px solid ${p.border}` }}
        onPointerDown={(e) => {
          e.preventDefault()
          if (over) reset()
          else jump()
        }}
      >
        {/* Scaled play-field: internal px mapped to the responsive box. */}
        <div className="absolute inset-0" style={{ transformOrigin: 'top left' }}>
          <svg viewBox={`0 0 ${FIELD_W} ${FIELD_H}`} className="h-full w-full" preserveAspectRatio="none">
            {/* Ground line */}
            <line x1="0" y1={FIELD_H - 1} x2={FIELD_W} y2={FIELD_H - 1} stroke={p.border} strokeWidth="2" />
            {/* Dino */}
            <rect
              x={DINO_X}
              y={FIELD_H - DINO_SIZE - dinoBottomPx}
              width={DINO_SIZE}
              height={DINO_SIZE}
              rx="4"
              fill={p.accent}
            />
            <rect x={DINO_X + DINO_SIZE - 7} y={FIELD_H - DINO_SIZE - dinoBottomPx + 4} width="3" height="3" fill={p.accentText} />
            {/* Obstacles (cacti) */}
            {obstacles.current.map((o, i) => (
              <rect key={i} x={o.x} y={FIELD_H - o.h} width={o.w} height={o.h} rx="2" fill="#f43f5e" />
            ))}
          </svg>
        </div>

        {!running && !over && (
          <Overlay spec={spec} title="Dino Run" hint="Space / ↑ / tap to jump the cacti. It only gets faster." onAction={reset} actionLabel="Play" />
        )}
        {over && (
          <Overlay spec={spec} title="Crashed" hint={`You ran ${score}m. Tap or Space to run again.`} onAction={reset} actionLabel="Retry" />
        )}
      </div>

      <ControlButton spec={spec} ariaLabel="Jump" onClick={() => (over ? reset() : jump())} className="h-11 w-full">
        <ChevronUp className="mr-1 h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wide">Jump</span>
      </ControlButton>
    </div>
  )
}
