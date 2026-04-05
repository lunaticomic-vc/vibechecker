'use client';

import { useState, useRef, useCallback, useEffect, createContext, useContext } from 'react';

type StatusOption = { label: string; value: string };

interface DragState {
  active: boolean;
  favoriteId: number | null;
  favoriteTitle: string;
  currentStatus: string;
  position: { x: number; y: number };
}

interface DragContextType {
  startDrag: (favoriteId: number, title: string, currentStatus: string, x: number, y: number) => void;
}

const DragContext = createContext<DragContextType>({ startDrag: () => {} });

export function useDragStatus() {
  return useContext(DragContext);
}

const ALL_STATUSES: StatusOption[] = [
  { label: 'Todo', value: 'todo' },
  { label: 'In Progress', value: 'watching' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Completed', value: 'completed' },
];

const STATUS_COLORS: Record<string, { text: string; hoverText: string }> = {
  todo: { text: 'text-[#4a6fa5]', hoverText: 'text-[#2d5a8e]' },
  watching: { text: 'text-[#6b9a65]', hoverText: 'text-[#4a7d44]' },
  on_hold: { text: 'text-[#a16207]', hoverText: 'text-[#854d0e]' },
  completed: { text: 'text-[#7c3aed]', hoverText: 'text-[#6d28d9]' },
};

interface Props {
  children: React.ReactNode;
  onStatusChange: (favoriteId: number, newStatus: string) => Promise<void>;
}

export default function StatusDragProvider({ children, onStatusChange }: Props) {
  const [drag, setDrag] = useState<DragState>({
    active: false,
    favoriteId: null,
    favoriteTitle: '',
    currentStatus: '',
    position: { x: 0, y: 0 },
  });
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const zoneRefs = useRef<Record<string, HTMLDivElement>>({});
  const holdTimer = useRef<NodeJS.Timeout | null>(null);

  const startDrag = useCallback((favoriteId: number, title: string, currentStatus: string, x: number, y: number) => {
    setDrag({ active: true, favoriteId, favoriteTitle: title, currentStatus, position: { x, y } });
    setHoveredZone(null);
  }, []);

  const updatePosition = useCallback((x: number, y: number) => {
    if (!drag.active) return;
    setDrag(prev => ({ ...prev, position: { x, y } }));

    // Check which zone we're over
    let found: string | null = null;
    for (const [status, el] of Object.entries(zoneRefs.current)) {
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        found = status;
        break;
      }
    }
    setHoveredZone(found);
  }, [drag.active]);

  const endDrag = useCallback(async () => {
    if (hoveredZone && drag.favoriteId) {
      await onStatusChange(drag.favoriteId, hoveredZone);
    }
    setDrag({ active: false, favoriteId: null, favoriteTitle: '', currentStatus: '', position: { x: 0, y: 0 } });
    setHoveredZone(null);
  }, [hoveredZone, drag.favoriteId, onStatusChange]);

  useEffect(() => {
    if (!drag.active) return;

    function handleMouseMove(e: MouseEvent) { updatePosition(e.clientX, e.clientY); }
    function handleTouchMove(e: TouchEvent) { updatePosition(e.touches[0].clientX, e.touches[0].clientY); }
    function handleUp() { endDrag(); }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [drag.active, updatePosition, endDrag]);

  // Clean up hold timer
  useEffect(() => {
    return () => { if (holdTimer.current) clearTimeout(holdTimer.current); };
  }, []);

  const dropZones = ALL_STATUSES.filter(s => s.value !== drag.currentStatus);

  const registerZone = useCallback((status: string, el: HTMLDivElement | null) => {
    if (el) zoneRefs.current[status] = el;
  }, []);

  return (
    <DragContext.Provider value={{ startDrag }}>
      {children}

      {/* Overlay when dragging */}
      {drag.active && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4">
          {/* Dimmed background */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

          {/* Dragged item indicator */}
          <div
            className="fixed z-[102] px-4 py-2 rounded-xl text-sm text-[#2d2640] font-medium pointer-events-none max-w-[200px] truncate"
            style={{
              left: drag.position.x - 100,
              top: drag.position.y - 20,
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(20px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.5)',
            }}
          >
            {drag.favoriteTitle}
          </div>

          {/* Drop zones */}
          <div className="relative z-[101] flex gap-4 px-4">
            {dropZones.map(zone => {
              const colors = STATUS_COLORS[zone.value];
              const isHovered = hoveredZone === zone.value;
              return (
                <div
                  key={zone.value}
                  ref={el => registerZone(zone.value, el)}
                  className={`w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300`}
                  style={{
                    background: isHovered ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)',
                    backdropFilter: 'blur(20px) saturate(1.8)',
                    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
                    boxShadow: isHovered
                      ? '0 8px 30px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.7)'
                      : '0 2px 10px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)',
                    border: isHovered ? '1px solid rgba(255,255,255,0.7)' : '1px solid rgba(255,255,255,0.4)',
                    transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                  }}
                >
                  <span className={`text-sm font-semibold ${isHovered ? colors.hoverText : colors.text}`}>{zone.label}</span>
                  <span className={`text-[10px] ${colors.text} opacity-50`}>Drop here</span>
                </div>
              );
            })}
          </div>

          {/* Cancel hint */}
          <p className="relative z-[101] text-xs text-white/70 mt-2">Release outside to cancel</p>
        </div>
      )}
    </DragContext.Provider>
  );
}
