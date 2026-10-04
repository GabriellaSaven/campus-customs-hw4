/**
 * A tiny seasonal/campus-moment helper so the site feels alive and timely.
 * Picks a vibe from today's date (special moments override the base season).
 */
export interface Season {
  key: string;
  icon: string;
  line: string;
}

export function currentSeason(date = new Date()): Season {
  const m = date.getMonth() + 1; // 1–12
  const d = date.getDate();

  // Special campus moments first
  if (m === 11 && d >= 15 && d <= 23) {
    return { key: "game", icon: "🏈", line: "It's almost The Game — beat Harvard in style." };
  }
  if (m === 5 && d >= 15) {
    return { key: "commencement", icon: "🎓", line: "Commencement season — caps off to the grads." };
  }

  // Base seasons
  if (m === 12 || m <= 2) {
    return { key: "winter", icon: "❄️", line: "Your first (or fifteenth) New Haven winter — bundle up." };
  }
  if (m >= 3 && m <= 5) {
    return { key: "spring", icon: "🌸", line: "Spring on Cross Campus — lighter layers ahead." };
  }
  if (m >= 6 && m <= 8) {
    return { key: "summer", icon: "☀️", line: "Summer in New Haven — sun, seagulls, and shoreline blue." };
  }
  return { key: "fall", icon: "🍂", line: "Crisp New Haven fall — sweater weather on Science Hill." };
}
