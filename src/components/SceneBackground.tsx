'use client';

// Deterministic star field — computed with Math.sin so server-rendered
// HTML matches client hydration exactly (no mismatch warnings).
const STARS = Array.from({ length: 32 }, (_, i) => {
  const rand = (k: number) => (Math.sin(i * 9301 + k * 49297) + 1) / 2;
  return {
    x: 1 + rand(1) * 98,              // 1%..99% width
    y: 1 + rand(2) * 48,              // 1%..49% height (upper sky)
    size: 1 + Math.round(rand(3) * 18) / 10, // 1..2.8 px
    delay: rand(4) * 4,
    duration: 2.5 + rand(5) * 2.8,
  };
});

// Constellations — hand-placed named star groups drawn as SVG groups
// over the sky. Coordinates are in percent of the full scene area.
// Each constellation has an array of {x, y} stars in logical draw order
// and an array of [fromIdx, toIdx] line segments that connect them.
interface Constellation {
  name: string;
  // Bounding box in percent — used to position the <svg> group
  box: { left: number; top: number; width: number; height: number };
  stars: { x: number; y: number; r: number }[]; // x,y inside 0..100 of its own viewBox
  lines: [number, number][];
}

const CONSTELLATIONS: Constellation[] = [
  {
    // Big Dipper (Ursa Major) — upper left quadrant
    name: 'Big Dipper',
    box: { left: 3, top: 6, width: 22, height: 14 },
    // Classic 7-star ladle: 4-star bowl + 3-star handle
    stars: [
      { x: 10, y: 70, r: 2.4 }, // Dubhe (bowl top-left)
      { x: 28, y: 55, r: 2.0 }, // Merak (bowl bottom-left)
      { x: 42, y: 60, r: 1.8 }, // Phecda (bowl bottom-right)
      { x: 38, y: 82, r: 1.6 }, // Megrez (bowl top-right, handle base)
      { x: 56, y: 78, r: 2.2 }, // Alioth (handle 1)
      { x: 74, y: 66, r: 1.8 }, // Mizar (handle 2)
      { x: 92, y: 48, r: 2.4 }, // Alkaid (handle tip)
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]],
  },
  {
    // Orion — top center, slightly larger
    name: 'Orion',
    box: { left: 38, top: 5, width: 24, height: 26 },
    stars: [
      { x: 18, y: 12, r: 2.6 }, // Betelgeuse (shoulder)
      { x: 82, y: 20, r: 2.4 }, // Bellatrix (shoulder)
      { x: 36, y: 50, r: 1.6 }, // Belt 1 — Alnitak
      { x: 50, y: 52, r: 1.6 }, // Belt 2 — Alnilam
      { x: 64, y: 54, r: 1.6 }, // Belt 3 — Mintaka
      { x: 16, y: 88, r: 2.2 }, // Saiph (foot)
      { x: 84, y: 92, r: 2.8 }, // Rigel (foot)
      { x: 46, y: 72, r: 1.2 }, // Sword 1
      { x: 48, y: 80, r: 1.0 }, // Sword 2
    ],
    lines: [
      // Shoulders to belt
      [0, 2], [1, 4],
      // Belt
      [2, 3], [3, 4],
      // Belt to feet
      [2, 5], [4, 6],
      // Shoulders across
      [0, 1],
      // Sword hanging from belt
      [3, 7], [7, 8],
    ],
  },
  {
    // Cassiopeia — upper right, classic W shape
    name: 'Cassiopeia',
    box: { left: 74, top: 8, width: 18, height: 10 },
    stars: [
      { x: 6, y: 72, r: 2.2 },
      { x: 26, y: 32, r: 2.0 },
      { x: 50, y: 60, r: 2.4 },
      { x: 74, y: 28, r: 2.0 },
      { x: 94, y: 66, r: 2.2 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
];

/**
 * Night-seaside backdrop: twinkling stars, a large lighthouse on the left,
 * and a large centered dock extending over the sea pool. Sits above the
 * Particles canvas (sea dots) and below page content / cat.
 *
 * Geometry stays in sync with Particles.tsx sea bounds (25%-75% x,
 * 58%-82% y) and GuestCat.tsx cat position (bottom-[42vh] left-1/2).
 */
export default function SceneBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[1] overflow-hidden"
      aria-hidden="true"
    >
      {/* Twinkling stars across the upper sky */}
      {STARS.map((s, i) => (
        <span
          key={i}
          className="sb-star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      {/* Constellations — named star groups with connecting lines */}
      {CONSTELLATIONS.map((c, ci) => (
        <div
          key={c.name}
          className="sb-constellation absolute"
          style={{
            left: `${c.box.left}%`,
            top: `${c.box.top}%`,
            width: `${c.box.width}%`,
            height: `${c.box.height}%`,
            // Each constellation drifts on its own schedule so they never sync
            animationDelay: `${(ci * 2.7).toFixed(2)}s`,
            animationDuration: `${18 + ci * 4}s`,
          }}
        >
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Connecting lines — delicate, breathing softly */}
            <g className="sb-constellation-lines">
              {c.lines.map(([a, b], i) => {
                const s1 = c.stars[a];
                const s2 = c.stars[b];
                return (
                  <line
                    key={i}
                    x1={s1.x}
                    y1={s1.y}
                    x2={s2.x}
                    y2={s2.y}
                    stroke="rgba(230,220,255,0.22)"
                    strokeWidth="0.22"
                    strokeLinecap="round"
                  />
                );
              })}
            </g>
            {/* Named stars — soft halo + tight core, staggered twinkle */}
            {c.stars.map((s, si) => {
              const delay = ((ci * 1.7 + si * 0.9) % 4).toFixed(2);
              const dur = (3 + ((ci + si) % 3) * 0.7).toFixed(2);
              return (
                <g key={si}>
                  {/* Outer halo — tight, barely-there glow */}
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={s.r * 1.9}
                    fill="rgba(210,195,255,0.1)"
                    className="sb-constellation-halo"
                    style={{
                      animationDelay: `${delay}s`,
                      animationDuration: `${dur}s`,
                    }}
                  />
                  {/* Core star — small and delicate */}
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={s.r * 0.62}
                    fill="rgba(252,249,255,0.9)"
                    className="sb-constellation-star"
                    style={{
                      animationDelay: `${delay}s`,
                      animationDuration: `${dur}s`,
                    }}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      ))}

      {/* LIGHTHOUSE — anchored to the far right edge of the scene */}
      <div
        className="absolute"
        style={{
          right: '0',
          top: '14vh',
          width: 'min(16vw, 210px)',
          height: 'min(44vh, 480px)',
          minWidth: '70px',
          minHeight: '260px',
        }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 120 320"
          preserveAspectRatio="xMidYMax meet"
        >
          {/* Rocky base at the water line */}
          <ellipse cx="60" cy="316" rx="58" ry="6" fill="rgba(140,128,170,0.32)" />
          <path
            d="M6 316 Q22 300 40 308 Q56 292 72 304 Q88 290 104 302 Q116 306 118 316 Z"
            fill="rgba(175,162,200,0.5)"
            stroke="rgba(140,128,170,0.7)"
            strokeWidth="1.2"
          />

          {/* Tapered main tower body */}
          <path
            d="M38 306 L30 146 L90 146 L82 306 Z"
            fill="rgba(250,247,255,0.88)"
            stroke="rgba(155,142,185,0.78)"
            strokeWidth="1.8"
          />

          {/* Soft lilac horizontal stripes */}
          <rect x="32" y="172" width="56" height="12" fill="rgba(196,170,220,0.62)" />
          <rect x="33" y="210" width="54" height="12" fill="rgba(196,170,220,0.62)" />
          <rect x="34" y="248" width="52" height="12" fill="rgba(196,170,220,0.62)" />
          <rect x="35" y="286" width="50" height="10" fill="rgba(196,170,220,0.62)" />

          {/* Small portholes down the tower */}
          <circle cx="60" cy="200" r="3.2" fill="rgba(255,242,218,0.85)" stroke="rgba(155,142,185,0.6)" strokeWidth="0.6" />
          <circle cx="60" cy="238" r="3.2" fill="rgba(255,242,218,0.85)" stroke="rgba(155,142,185,0.6)" strokeWidth="0.6" />
          <circle cx="60" cy="276" r="3.2" fill="rgba(255,242,218,0.85)" stroke="rgba(155,142,185,0.6)" strokeWidth="0.6" />

          {/* Gallery — ring platform around the lantern */}
          <rect x="22" y="136" width="76" height="10" rx="1" fill="rgba(250,247,255,0.9)" stroke="rgba(155,142,185,0.78)" strokeWidth="1.2" />
          <line x1="22" y1="141" x2="98" y2="141" stroke="rgba(155,142,185,0.5)" strokeWidth="0.5" />
          {/* Railing posts */}
          <line x1="30" y1="130" x2="30" y2="138" stroke="rgba(155,142,185,0.62)" strokeWidth="0.8" />
          <line x1="45" y1="130" x2="45" y2="138" stroke="rgba(155,142,185,0.62)" strokeWidth="0.8" />
          <line x1="60" y1="130" x2="60" y2="138" stroke="rgba(155,142,185,0.62)" strokeWidth="0.8" />
          <line x1="75" y1="130" x2="75" y2="138" stroke="rgba(155,142,185,0.62)" strokeWidth="0.8" />
          <line x1="90" y1="130" x2="90" y2="138" stroke="rgba(155,142,185,0.62)" strokeWidth="0.8" />

          {/* Lantern room */}
          <rect x="38" y="94" width="44" height="38" fill="rgba(240,232,255,0.6)" stroke="rgba(155,142,185,0.78)" strokeWidth="1.2" />
          {/* Window mullions */}
          <line x1="52" y1="94" x2="52" y2="132" stroke="rgba(155,142,185,0.5)" strokeWidth="0.6" />
          <line x1="68" y1="94" x2="68" y2="132" stroke="rgba(155,142,185,0.5)" strokeWidth="0.6" />
          <line x1="38" y1="113" x2="82" y2="113" stroke="rgba(155,142,185,0.5)" strokeWidth="0.6" />

          {/* Warm lantern glow — breathing */}
          <circle cx="60" cy="113" r="12" fill="rgba(255,242,218,0.85)">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="r" values="11;14;11" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="60" cy="113" r="5" fill="rgba(255,250,230,0.95)" />

          {/* Dome */}
          <path
            d="M36 94 Q60 66 84 94 Z"
            fill="rgba(220,198,240,0.85)"
            stroke="rgba(155,142,185,0.78)"
            strokeWidth="1.2"
          />

          {/* Spire + top ornament */}
          <line x1="60" y1="66" x2="60" y2="48" stroke="rgba(155,142,185,0.85)" strokeWidth="1.2" />
          <circle cx="60" cy="46" r="1.8" fill="rgba(255,242,218,0.9)" />
          {/* Small pennant */}
          <path d="M60 48 L72 52 L60 56 Z" fill="rgba(196,170,220,0.65)" />

          {/* Slow sweeping light beam */}
          <g>
            <path d="M60 113 L250 62 L250 164 Z" fill="rgba(255,245,215,0.09)">
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="-12 60 113;12 60 113;-12 60 113"
                dur="11s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        </svg>
      </div>

      {/* DOCK — anchored to the far left of the scene */}
      <div
        className="absolute"
        style={{
          left: '0',
          top: '58vh',
          width: 'min(48vw, 560px)',
          height: 'min(22vh, 180px)',
          minWidth: '220px',
          minHeight: '110px',
        }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 720 180"
          preserveAspectRatio="none"
        >
          {/* Pilings — 7 posts sinking into the water */}
          {[48, 158, 268, 378, 488, 598, 690].map(x => (
            <rect key={x} x={x - 4} y="22" width="8" height="142" fill="rgba(145,132,170,0.7)" />
          ))}

          {/* Cross bracing between pilings */}
          {[[48, 158], [158, 268], [268, 378], [378, 488], [488, 598], [598, 690]].map(([a, b], i) => (
            <g key={i}>
              <line x1={a + 4} y1="58" x2={b - 4} y2="140" stroke="rgba(130,115,155,0.42)" strokeWidth="2" />
              <line x1={a + 4} y1="140" x2={b - 4} y2="58" stroke="rgba(130,115,155,0.42)" strokeWidth="2" />
            </g>
          ))}

          {/* Reflections at the very bottom of each piling */}
          {[48, 158, 268, 378, 488, 598, 690].map((x, i) => (
            <rect
              key={`r${i}`}
              x={x - 20}
              y={168 + (i % 2) * 2}
              width="40"
              height="2"
              fill="rgba(120,105,150,0.32)"
            />
          ))}

          {/* Deck plank surface */}
          <rect x="0" y="12" width="720" height="16" fill="rgba(220,206,238,0.85)" />
          <rect x="0" y="12" width="720" height="2.5" fill="rgba(130,115,155,0.65)" />
          <rect x="0" y="25.5" width="720" height="2.5" fill="rgba(130,115,155,0.5)" />

          {/* Plank seam marks */}
          {[90, 180, 270, 360, 450, 540, 630].map(x => (
            <rect key={`s${x}`} x={x} y="12" width="1.2" height="16" fill="rgba(130,115,155,0.55)" />
          ))}
        </svg>

        {/* Dock lamps at both ends — kept outside the stretched SVG so they stay round */}
        <div className="absolute" style={{ right: '1.5%', top: '-2px' }}>
          <div className="w-[1.5px] h-[14px] mx-auto bg-[#8273a0]/75" />
          <div className="sb-dock-lamp absolute left-1/2 -top-[4px] -translate-x-1/2" />
        </div>
        <div className="absolute" style={{ left: '1.5%', top: '-2px' }}>
          <div className="w-[1.5px] h-[14px] mx-auto bg-[#8273a0]/75" />
          <div className="sb-dock-lamp absolute left-1/2 -top-[4px] -translate-x-1/2" />
        </div>
      </div>

      <style jsx>{`
        .sb-star {
          position: absolute;
          border-radius: 9999px;
          /* Bright near-white so stars glow against the dark #1a1025 night sky */
          background: rgba(252, 249, 255, 0.95);
          box-shadow: 0 0 4px rgba(245, 240, 255, 0.9), 0 0 8px rgba(196, 181, 253, 0.5);
          animation-name: sb-twinkle;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          will-change: opacity, transform;
        }
        @keyframes sb-twinkle {
          0%, 100% { opacity: 0.28; transform: scale(0.8); }
          50%      { opacity: 1;    transform: scale(1.2); }
        }
        /* Whole constellations drift very slightly on their own schedule */
        .sb-constellation {
          animation-name: sb-constellation-drift;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        @keyframes sb-constellation-drift {
          0%, 100% { transform: translate(0, 0); }
          25%      { transform: translate(0.7px, -0.4px); }
          50%      { transform: translate(-0.4px, 0.6px); }
          75%      { transform: translate(0.5px, 0.3px); }
        }
        /* Core stars — elegant scale + opacity twinkle */
        :global(.sb-constellation-star) {
          animation-name: sb-star-elegant;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          transform-box: fill-box;
          transform-origin: center;
          filter: drop-shadow(0 0 1.5px rgba(255, 250, 255, 0.55));
        }
        @keyframes sb-star-elegant {
          0%, 100% { opacity: 0.55; transform: scale(0.9); }
          50%      { opacity: 1;    transform: scale(1.1); }
        }
        /* Halos bloom slightly out of phase with their cores */
        :global(.sb-constellation-halo) {
          animation-name: sb-halo-bloom;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        @keyframes sb-halo-bloom {
          0%, 100% { opacity: 0.08; transform: scale(0.85); }
          50%      { opacity: 0.28; transform: scale(1.18); }
        }
        /* Connecting lines breathe gently */
        :global(.sb-constellation-lines) {
          animation: sb-lines-soft 6s ease-in-out infinite;
        }
        @keyframes sb-lines-soft {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 0.7; }
        }
        .sb-dock-lamp {
          width: 9px;
          height: 9px;
          border-radius: 9999px;
          background: rgba(255, 242, 218, 0.95);
          box-shadow: 0 0 8px rgba(255, 232, 190, 0.85), 0 0 14px rgba(255, 215, 150, 0.45);
          animation: sb-lamp-pulse 3s ease-in-out infinite;
        }
        @keyframes sb-lamp-pulse {
          0%, 100% { opacity: 0.75; }
          50%      { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sb-star { animation: none; opacity: 0.8; }
          .sb-dock-lamp { animation: none; }
          :global(.sb-constellation-star),
          :global(.sb-constellation-lines) { animation: none; }
        }
      `}</style>
    </div>
  );
}
