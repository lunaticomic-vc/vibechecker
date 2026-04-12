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
  // ─── TOP BAND (y ~2-16) ─────────────────────────────────────────────────
  {
    name: 'Big Dipper',
    box: { left: 2, top: 4, width: 22, height: 11 },
    stars: [
      { x: 10, y: 70, r: 2.4 }, // Dubhe
      { x: 28, y: 55, r: 2.0 }, // Merak
      { x: 42, y: 60, r: 1.8 }, // Phecda
      { x: 38, y: 82, r: 1.6 }, // Megrez
      { x: 56, y: 78, r: 2.2 }, // Alioth
      { x: 74, y: 66, r: 1.8 }, // Mizar
      { x: 92, y: 48, r: 2.4 }, // Alkaid
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]],
  },
  {
    name: 'Ursa Minor',
    box: { left: 27, top: 2, width: 18, height: 13 },
    // Little Dipper — tighter version of the Big Dipper with Polaris at the tip
    stars: [
      { x: 18, y: 75, r: 1.4 },
      { x: 34, y: 60, r: 1.2 },
      { x: 46, y: 72, r: 1.2 },
      { x: 38, y: 85, r: 1.2 },
      { x: 56, y: 65, r: 1.4 },
      { x: 72, y: 50, r: 1.4 },
      { x: 90, y: 28, r: 2.2 }, // Polaris
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [5, 6]],
  },
  {
    name: 'Cassiopeia',
    box: { left: 48, top: 3, width: 18, height: 9 },
    stars: [
      { x: 6, y: 72, r: 2.0 },
      { x: 26, y: 32, r: 1.8 },
      { x: 50, y: 60, r: 2.4 },
      { x: 74, y: 28, r: 1.8 },
      { x: 94, y: 66, r: 2.0 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    name: 'Cepheus',
    box: { left: 70, top: 2, width: 14, height: 14 },
    // House shape (pentagon)
    stars: [
      { x: 50, y: 10, r: 2.0 },
      { x: 18, y: 38, r: 1.6 },
      { x: 82, y: 38, r: 1.6 },
      { x: 22, y: 85, r: 1.8 },
      { x: 78, y: 85, r: 1.8 },
    ],
    lines: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4]],
  },
  {
    name: 'Lyra',
    box: { left: 86, top: 4, width: 12, height: 12 },
    // Parallelogram anchored by bright Vega
    stars: [
      { x: 50, y: 8, r: 2.4 }, // Vega
      { x: 32, y: 28, r: 1.4 },
      { x: 66, y: 30, r: 1.4 },
      { x: 22, y: 62, r: 1.2 },
      { x: 52, y: 68, r: 1.4 },
      { x: 72, y: 55, r: 1.2 },
    ],
    lines: [[0, 1], [0, 2], [1, 3], [2, 5], [3, 4], [4, 5]],
  },

  // ─── MIDDLE BAND (y ~18-34) ─────────────────────────────────────────────
  {
    name: 'Cygnus',
    box: { left: 4, top: 18, width: 20, height: 16 },
    // Northern Cross
    stars: [
      { x: 50, y: 8, r: 2.4 },  // Deneb
      { x: 50, y: 40, r: 1.6 },
      { x: 50, y: 75, r: 2.0 }, // Albireo
      { x: 18, y: 40, r: 1.6 },
      { x: 82, y: 42, r: 1.6 },
    ],
    lines: [[0, 1], [1, 2], [3, 1], [1, 4]],
  },
  {
    name: 'Orion',
    box: { left: 28, top: 17, width: 20, height: 18 },
    stars: [
      { x: 18, y: 12, r: 2.4 }, // Betelgeuse
      { x: 82, y: 20, r: 2.2 }, // Bellatrix
      { x: 36, y: 50, r: 1.5 }, // Belt 1
      { x: 50, y: 52, r: 1.5 }, // Belt 2
      { x: 64, y: 54, r: 1.5 }, // Belt 3
      { x: 16, y: 88, r: 2.0 }, // Saiph
      { x: 84, y: 92, r: 2.6 }, // Rigel
      { x: 46, y: 72, r: 1.1 }, // Sword 1
      { x: 48, y: 82, r: 1.0 }, // Sword 2
    ],
    lines: [
      [0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6],
      [0, 1], [3, 7], [7, 8],
    ],
  },
  {
    name: 'Leo',
    box: { left: 52, top: 18, width: 24, height: 14 },
    // Sickle + triangle body
    stars: [
      { x: 12, y: 45, r: 2.2 }, // Regulus
      { x: 18, y: 22, r: 1.4 },
      { x: 30, y: 10, r: 1.4 },
      { x: 44, y: 18, r: 1.4 },
      { x: 48, y: 38, r: 1.6 },
      { x: 78, y: 52, r: 1.8 }, // Denebola
      { x: 86, y: 76, r: 1.4 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [4, 5], [5, 6]],
  },
  {
    name: 'Pegasus',
    box: { left: 80, top: 20, width: 18, height: 14 },
    // The Great Square
    stars: [
      { x: 12, y: 15, r: 2.0 },
      { x: 80, y: 12, r: 2.2 },
      { x: 85, y: 70, r: 2.0 },
      { x: 10, y: 68, r: 2.0 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0]],
  },

  // ─── LOWER BAND (y ~36-50, just above the dock) ─────────────────────────
  {
    name: 'Corona Borealis',
    box: { left: 3, top: 38, width: 14, height: 10 },
    // Arc of stars forming a crown
    stars: [
      { x: 10, y: 65, r: 1.2 },
      { x: 28, y: 35, r: 1.4 },
      { x: 50, y: 18, r: 2.0 }, // Alphecca
      { x: 72, y: 32, r: 1.4 },
      { x: 90, y: 55, r: 1.2 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    name: 'Gemini',
    box: { left: 22, top: 36, width: 18, height: 14 },
    // Twin stick figures (Castor + Pollux)
    stars: [
      { x: 25, y: 10, r: 2.0 }, // Castor
      { x: 65, y: 12, r: 2.2 }, // Pollux
      { x: 28, y: 32, r: 1.2 },
      { x: 62, y: 32, r: 1.2 },
      { x: 20, y: 58, r: 1.2 },
      { x: 35, y: 62, r: 1.2 },
      { x: 58, y: 60, r: 1.2 },
      { x: 72, y: 64, r: 1.2 },
    ],
    lines: [[0, 1], [0, 2], [2, 4], [2, 5], [1, 3], [3, 6], [3, 7]],
  },
  {
    name: 'Taurus',
    box: { left: 46, top: 36, width: 22, height: 14 },
    // V of the Hyades anchored by Aldebaran, horns on either side
    stars: [
      { x: 8, y: 20, r: 1.4 },  // left horn tip
      { x: 25, y: 30, r: 1.6 },
      { x: 42, y: 50, r: 2.4 }, // Aldebaran
      { x: 58, y: 60, r: 1.6 },
      { x: 75, y: 48, r: 1.6 },
      { x: 90, y: 30, r: 1.4 }, // right horn tip
      { x: 55, y: 82, r: 1.4 }, // nose
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [3, 6]],
  },
  {
    name: 'Scorpius',
    box: { left: 72, top: 38, width: 26, height: 12 },
    // Curvy J — head to bright Antares to the stinger
    stars: [
      { x: 4, y: 20, r: 1.4 },
      { x: 12, y: 36, r: 1.4 },
      { x: 22, y: 50, r: 2.4 }, // Antares
      { x: 36, y: 56, r: 1.4 },
      { x: 50, y: 60, r: 1.4 },
      { x: 62, y: 68, r: 1.4 },
      { x: 74, y: 78, r: 1.4 },
      { x: 82, y: 86, r: 1.4 },
      { x: 92, y: 74, r: 1.6 }, // stinger
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]],
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

      {/* DOCK — anchored to the far left of the scene */}
      <div
        className="absolute"
        style={{
          left: '0',
          top: '50vh',
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
