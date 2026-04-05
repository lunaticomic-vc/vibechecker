'use client';

import { motion, LayoutGroup } from 'framer-motion';

interface GlassTabsProps<T extends string> {
  tabs: T[];
  active: T;
  onChange: (tab: T) => void;
  layoutId?: string;
}

export default function GlassTabs<T extends string>({ tabs, active, onChange, layoutId = 'glass-tab' }: GlassTabsProps<T>) {
  return (
    <LayoutGroup id={layoutId}>
      <div className="relative flex gap-0.5 bg-[#e9e4f5]/30 backdrop-blur-md rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className="relative px-4 py-2 text-xs font-medium rounded-lg z-10"
            style={{ color: active === tab ? '#7c3aed' : '#7c7291' }}
          >
            {active === tab && (
              <motion.div
                layoutId="indicator"
                className="absolute inset-0 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.35) 100%)',
                  backdropFilter: 'blur(20px) saturate(1.8)',
                  WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
                  boxShadow: '0 2px 8px rgba(124,58,237,0.06), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  zIndex: -1,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 350,
                  damping: 28,
                  mass: 0.8,
                }}
              />
            )}
            {tab}
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}
