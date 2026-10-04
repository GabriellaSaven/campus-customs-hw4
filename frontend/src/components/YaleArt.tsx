/**
 * Yale-flavored SVG art, drawn in code (no image files). Handsome Dan (chat mascot),
 * a recognizable downtown New Haven map (the Nine Square Plan) for the site
 * background, a Yale shield, and a Gothic arch accent.
 */

/** Handsome Dan — Yale's bulldog mascot, as a friendly flat illustration. */
export function HandsomeDan({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12 16c-4 2-6 8-4 13l10-4-6-9z" fill="#8a6d3b" />
      <path d="M52 16c4 2 6 8 4 13l-10-4 6-9z" fill="#8a6d3b" />
      <rect x="12" y="14" width="40" height="36" rx="16" fill="#b4895a" />
      <path d="M32 20c6 0 9 4 9 4v10c0 7-4 12-9 12s-9-5-9-12V24s3-4 9-4z" fill="#f4ede1" />
      <circle cx="25" cy="30" r="3.2" fill="#1b1b1b" />
      <circle cx="39" cy="30" r="3.2" fill="#1b1b1b" />
      <ellipse cx="32" cy="37" rx="4.2" ry="3.2" fill="#1b1b1b" />
      <path d="M32 40v4m-5 1c2 1.5 8 1.5 10 0" stroke="#5a4326" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M18 48c4 3 24 3 28 0l-2 6c-8 3-16 3-24 0l-2-6z" fill="#00356b" />
      <circle cx="32" cy="52" r="2" fill="#c8a95b" />
    </svg>
  );
}

/**
 * Downtown New Haven — the historic "Nine Square Plan": a 3×3 grid of blocks with the
 * New Haven Green at the center, labeled with the real bounding/internal streets.
 * Used as a faint, identifiable page background.
 */
export function NewHavenMap({ className }: { className?: string }) {
  // 3×3 grid geometry
  const x = [120, 300, 480, 660]; // vertical street x-positions (4 lines → 3 columns)
  const y = [110, 250, 390, 530]; // horizontal street y-positions
  const vStreets = ["York St", "College St", "Temple St", "Church St"];
  const hStreets = ["Grove St", "Elm St", "Chapel St", "George St"];

  return (
    <svg
      className={className}
      viewBox="0 0 780 640"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      {/* blocks */}
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <rect
            key={`${r}-${c}`}
            x={x[c] + 10}
            y={y[r] + 10}
            width={x[c + 1] - x[c] - 20}
            height={y[r + 1] - y[r] - 20}
            strokeWidth="2"
            rx="4"
          />
        )),
      )}

      {/* The Green (center square) */}
      <rect
        x={x[1] + 10}
        y={y[1] + 10}
        width={x[2] - x[1] - 20}
        height={y[2] - y[1] - 20}
        fill="currentColor"
        fillOpacity="0.5"
        strokeWidth="2"
        rx="4"
      />
      <text
        x={(x[1] + x[2]) / 2}
        y={(y[1] + y[2]) / 2}
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="20"
        fill="currentColor"
        stroke="none"
      >
        The Green
      </text>

      {/* street labels */}
      <g fontFamily="Georgia, serif" fontSize="18" fill="currentColor" stroke="none">
        {hStreets.map((name, i) => (
          <text key={name} x="8" y={y[i] + 4}>
            {name}
          </text>
        ))}
        {vStreets.map((name, i) => (
          <text
            key={name}
            x={x[i]}
            y="28"
            textAnchor="middle"
            transform={`rotate(-20 ${x[i]} 28)`}
          >
            {name}
          </text>
        ))}
        <text x="640" y="620" fontSize="34" fontStyle="italic" opacity="0.9">
          New Haven, CT
        </text>
      </g>
    </svg>
  );
}

/** Yale shield with a "Y". */
export function YaleShield({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 6h40v28c0 10-8 16-20 22C12 50 4 44 4 34V6z"
        fill="#00356b"
        stroke="#b08d57"
        strokeWidth="2"
      />
      <text
        x="24"
        y="34"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="24"
        fontWeight="700"
        fill="#fff"
      >
        Y
      </text>
    </svg>
  );
}

/**
 * Hidden SVG defs: a pointed-arch clip path (objectBoundingBox units so it scales to
 * any element). Apply with CSS `clip-path: url(#gothic-arch)` to turn an image box into
 * a Gothic cathedral-window shape. Render once near the app root.
 */
export function GothicDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
      <defs>
        <clipPath id="gothic-arch" clipPathUnits="objectBoundingBox">
          <path d="M0,1 L0,0.42 C0,0.15 0.5,0.15 0.5,0 C0.5,0.15 1,0.15 1,0.42 L1,1 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

/** A row of pointed arches — a collegiate "arcade" divider (stone + gold). */
export function GothicArcade({ className }: { className?: string }) {
  const bays = [0, 1, 2, 3, 4, 5, 6, 7];
  const w = 120;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${bays.length * w} 90`}
      preserveAspectRatio="xMidYMax meet"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {bays.map((b) => {
        const x = b * w;
        return (
          <g key={b}>
            {/* columns */}
            <line x1={x + 10} y1="90" x2={x + 10} y2="42" />
            <line x1={x + w - 10} y1="90" x2={x + w - 10} y2="42" />
            {/* pointed arch */}
            <path
              d={`M${x + 10} 42 C${x + 10} 14 ${x + w / 2} 14 ${x + w / 2} 2 C${x + w / 2} 14 ${x + w - 10} 14 ${x + w - 10} 42`}
            />
            {/* quatrefoil dot */}
            <circle cx={x + w / 2} cy="28" r="4" />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * A collegiate-gothic stained-glass window with stone tracery — the centerpiece of the
 * hero. Lancet lights, a rose with trefoils, leaded panes in Yale navy, gold and stone.
 */
export function GothicWindow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 300 460"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pane-navy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c4b8a" />
          <stop offset="1" stopColor="#0e2a4f" />
        </linearGradient>
        <linearGradient id="pane-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d8b25a" />
          <stop offset="1" stopColor="#a9833f" />
        </linearGradient>
      </defs>
      {/* stone surround */}
      <path
        d="M14 456 L14 150 Q14 34 150 14 Q286 34 286 150 L286 456 Z"
        fill="#c9bb9c"
        stroke="#6b5f49"
        strokeWidth="6"
      />
      {/* inner opening */}
      <path
        d="M30 452 L30 152 Q30 50 150 32 Q270 50 270 152 L270 452 Z"
        fill="#efe7d4"
      />
      {/* three lancets */}
      {[
        { x: 42, fill: "url(#pane-navy)" },
        { x: 116, fill: "url(#pane-gold)" },
        { x: 190, fill: "url(#pane-navy)" },
      ].map((l) => (
        <path
          key={l.x}
          d={`M${l.x} 450 L${l.x} 250 Q${l.x} 196 ${l.x + 34} 188 Q${l.x + 68} 196 ${l.x + 68} 250 L${l.x + 68} 450 Z`}
          fill={l.fill}
          stroke="#6b5f49"
          strokeWidth="4"
        />
      ))}
      {/* leaded mullions within lancets */}
      {[42, 116, 190].map((x) => (
        <g key={x} stroke="#6b5f49" strokeWidth="2" opacity="0.7">
          <line x1={x + 34} y1="200" x2={x + 34} y2="450" />
          <line x1={x} y1="320" x2={x + 68} y2="320" />
          <line x1={x} y1="390" x2={x + 68} y2="390" />
        </g>
      ))}
      {/* rose window with trefoil */}
      <circle cx="150" cy="120" r="46" fill="#efe7d4" stroke="#6b5f49" strokeWidth="5" />
      <circle cx="150" cy="120" r="30" fill="url(#pane-gold)" stroke="#6b5f49" strokeWidth="3" />
      {[0, 120, 240].map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          <circle
            key={a}
            cx={150 + 18 * Math.cos(rad)}
            cy={120 + 18 * Math.sin(rad)}
            r="10"
            fill="#1c4b8a"
            stroke="#6b5f49"
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}

/** A silhouette skyline of collegiate-gothic towers, pinnacles and rooflines. */
export function GothicSkyline({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 160"
      preserveAspectRatio="xMidYMax slice"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      aria-hidden="true"
    >
      {/* ground line of buildings */}
      <rect x="0" y="120" width="1200" height="40" />
      {/* low halls */}
      <rect x="40" y="96" width="160" height="64" />
      <rect x="250" y="104" width="120" height="56" />
      <rect x="820" y="100" width="150" height="60" />
      <rect x="1010" y="92" width="150" height="68" />
      {/* a big central tower (Harkness-like) */}
      <rect x="520" y="30" width="90" height="130" />
      <path d="M520 30 L535 8 L550 30 Z M560 30 L575 2 L590 30 Z M595 30 L610 30 L610 30 Z" />
      {[520, 536, 552, 568, 584, 600].map((x) => (
        <rect key={x} x={x} y="22" width="8" height="12" />
      ))}
      {/* side towers */}
      <rect x="410" y="64" width="54" height="96" />
      {[410, 424, 438, 452].map((x) => (
        <rect key={x} x={x} y="56" width="7" height="12" />
      ))}
      <rect x="690" y="58" width="60" height="102" />
      {[690, 704, 718, 732].map((x) => (
        <rect key={x} x={x} y="50" width="7" height="12" />
      ))}
      {/* pinnacles */}
      <path d="M360 120 L372 70 L384 120 Z" />
      <path d="M786 120 L798 66 L810 120 Z" />
      <path d="M250 104 L262 72 L274 104 Z" />
    </svg>
  );
}

/**
 * Climbing ivy that creeps the full height of the page. Built as a seamless vertical
 * SVG <pattern> (the vine enters the tile top-center and leaves bottom-center, so tiles
 * connect) filling a full-height fixed strip at the page edge.
 */
export function Ivy({ className }: { className?: string }) {
  const ivyLeaf = (x: number, y: number, s: number, rot: number) =>
    `M${x} ${y} c ${4 * s} ${-2 * s} ${6 * s} ${-6 * s} ${0} ${-10 * s} ` +
    `c ${-6 * s} ${4 * s} ${-4 * s} ${8 * s} ${0} ${10 * s} z|${rot}`;
  const leaves = [
    [26, 24, 1.1, -35],
    [52, 44, 1.0, 30],
    [24, 70, 0.9, -20],
    [54, 96, 1.1, 40],
    [28, 120, 1.0, -30],
    [50, 150, 0.9, 25],
  ] as const;
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern id="ivy-tile" width="72" height="170" patternUnits="userSpaceOnUse">
          {/* seamless vine: top-center (36,0) → bottom-center (36,170) */}
          <path
            d="M36 0 C60 30 14 55 36 85 C58 115 14 140 36 170"
            fill="none"
            stroke="#3f5c39"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {leaves.map(([x, y, s, rot], i) => {
            const [d] = ivyLeaf(x, y, s, rot).split("|");
            return (
              <path
                key={i}
                d={d}
                fill={i % 2 ? "#5c7a4e" : "#4a6b3c"}
                transform={`rotate(${rot} ${x} ${y})`}
              />
            );
          })}
          {/* small tendrils */}
          <circle cx="36" cy="42" r="2.2" fill="#6b8a54" />
          <circle cx="36" cy="128" r="2.2" fill="#6b8a54" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ivy-tile)" />
    </svg>
  );
}

/** Flat silhouette of a collegiate-gothic tower (Harkness-like). */
export function GothicTower({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 400"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="30" y="120" width="60" height="280" />
      {/* crenellations */}
      {[30, 44, 58, 72].map((x) => (
        <rect key={x} x={x} y="108" width="8" height="16" />
      ))}
      {/* corner pinnacles */}
      <path d="M24 120 L30 70 L36 120 Z" />
      <path d="M84 120 L90 70 L96 120 Z" />
      {/* lancet windows */}
      {[150, 210, 270].map((y) => (
        <path key={y} d={`M52 ${y + 34} L52 ${y} Q60 ${y - 12} 68 ${y} L68 ${y + 34} Z`} fill="#071526" />
      ))}
    </svg>
  );
}

/** A slim Gothic (pointed) arch outline — architectural accent above sections. */
export function GothicArch({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 60"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M10 58 L10 34 Q10 10 60 4 Q110 10 110 34 L110 58" />
      <path d="M26 58 L26 38 Q26 22 60 18 Q94 22 94 38 L94 58" opacity="0.6" />
    </svg>
  );
}
