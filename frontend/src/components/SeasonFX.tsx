import { currentSeason } from "../season";

/**
 * Subtle animated weather that matches the date: drifting leaves in fall, snow in
 * winter, petals in spring, sun sparkle in summer, caps at commencement, footballs
 * for The Game. Fixed, non-interactive, low opacity so it never blocks the shop.
 */
const EMOJI: Record<string, string[]> = {
  fall: ["🍂", "🍁", "🍃"],
  winter: ["❄️", "❄︎", "•"],
  spring: ["🌸", "🌼", "🌷"],
  summer: ["☀️", "🕊️", "⛵"],
  commencement: ["🎓", "🎉"],
  game: ["🏈", "🐶", "Y"],
};

export default function SeasonFX() {
  const season = currentSeason();
  const set = EMOJI[season.key] ?? EMOJI.fall;
  const count = 14;

  const bits = Array.from({ length: count }, (_, i) => {
    // Spread evenly across the full width, with a little deterministic jitter.
    const left = ((i + 0.5) * (100 / count) + ((i * 37) % 11) - 5).toFixed(1);
    const delay = (i * 1.7) % 10;
    const duration = 8 + ((i * 3) % 7);
    const size = 15 + (i % 4) * 7;
    const drift = i % 2 === 0 ? "60px" : "-60px"; // some drift left, some right
    const glyph = set[i % set.length];
    return (
      <span
        key={i}
        className="fx-bit"
        style={
          {
            left: `${left}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            fontSize: `${size}px`,
            "--drift": drift,
          } as React.CSSProperties
        }
      >
        {glyph}
      </span>
    );
  });

  return (
    <div className="season-fx" aria-hidden="true">
      {bits}
    </div>
  );
}
