import { useRef, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

const POS_KEY = 'ems-assistant-bubble';
const SIZE = 56;
const MARGIN = 16;
const DRAG_THRESHOLD = 6;

interface Pos {
  side: 'left' | 'right';
  y: number; // px from top
}

function loadPos(): Pos {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Pos;
      if ((p.side === 'left' || p.side === 'right') && typeof p.y === 'number') return p;
    }
  } catch {
    /* default below */
  }
  return { side: 'right', y: window.innerHeight - SIZE - 88 };
}

function clampY(y: number): number {
  return Math.min(Math.max(y, MARGIN), window.innerHeight - SIZE - MARGIN);
}

// Draggable launcher: snaps to the left/right edge, remembers its spot.
// Tapping it toggles the panel; later it doubles as the press-to-talk button
// for the voice feature. Opening costs zero API/LLM calls.
export function AssistantBubble({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [pos, setPos] = useState<Pos>(loadPos);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const start = useRef({ x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    moved.current = false;
    start.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (!moved.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    moved.current = true;
    setDrag({ x: e.clientX - SIZE / 2, y: e.clientY - SIZE / 2 });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (!moved.current) {
      setDrag(null);
      onToggle();
      return;
    }
    const next: Pos = {
      side: e.clientX < window.innerWidth / 2 ? 'left' : 'right',
      y: clampY(e.clientY - SIZE / 2),
    };
    setPos(next);
    setDrag(null);
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(next));
    } catch {
      /* position just won't persist */
    }
  };

  const style: React.CSSProperties = drag
    ? { left: drag.x, top: drag.y }
    : {
        top: clampY(pos.y),
        ...(pos.side === 'left' ? { left: MARGIN } : { right: MARGIN }),
      };

  return (
    <button
      aria-label={open ? 'Close assistant' : 'Open assistant'}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={style}
      className={cn(
        'fixed z-40 h-14 w-14 rounded-full shadow-elevated flex items-center justify-center',
        'bg-brand-600 text-white hover:bg-brand-700 active:scale-95 touch-none select-none',
        drag ? 'transition-none cursor-grabbing' : 'transition-all duration-200',
      )}
    >
      {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
    </button>
  );
}
