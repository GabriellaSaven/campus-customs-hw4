import type { Product } from "./types";

/**
 * The catalogue has ~22 raw garment_type strings; we roll them up into a handful of
 * shopper-friendly categories for the nav dropdown and the grouped Products page.
 * Rules are checked in order — first match wins — so specific types (t-shirt) are
 * caught before broader ones (sweatshirt).
 */
export interface Category {
  slug: string;
  label: string;
  test: (garmentType: string) => boolean;
}

export const CATEGORIES: Category[] = [
  // \bt so we match "t-shirt"/"t shirt" but NOT the "tshirt" hiding inside "swea-tshirt".
  { slug: "t-shirts", label: "T-Shirts", test: (t) => /\bt-?\s?shirt|\btee\b/.test(t) },
  { slug: "long-sleeves", label: "Long Sleeves", test: (t) => /long-?sleeve/.test(t) },
  { slug: "hoodies", label: "Hoodies", test: (t) => /hood/.test(t) },
  { slug: "crewnecks", label: "Crewnecks", test: (t) => /crew/.test(t) },
  { slug: "quarter-zips", label: "Quarter-Zips", test: (t) => /quarter|1\/?4|zip/.test(t) && !/full-?zip/.test(t) },
  { slug: "jackets", label: "Jackets", test: (t) => /jacket|bomber|fleece|full-?zip/.test(t) },
  { slug: "sweaters", label: "Sweaters", test: (t) => /sweater|mock/.test(t) },
];

const OTHER: Category = { slug: "other", label: "Other", test: () => true };

export function categoryOf(garmentType: string): Category {
  const t = garmentType.toLowerCase();
  return CATEGORIES.find((c) => c.test(t)) ?? OTHER;
}

/** A few hand-picked "staff pick" stamps (editorial, human touch). */
export const STAFF_PICKS: Record<string, string> = {
  "basic-hoodie-big-yale": "Our favorite",
  "2025-yale-vs-harvard-t-shirt": "Game day pick",
  "boola-boola-t-shirt": "Best for fall",
  "champion-reverse-weave-crewneck": "Staff pick",
};

/** "New Haven picks" for the homepage — a curated moment → a search term. */
export const NEW_HAVEN_PICKS: { title: string; blurb: string; q: string }[] = [
  { title: "For Old Campus", blurb: "Classic crewnecks for first-year quads.", q: "crewneck" },
  { title: "For game day", blurb: "Beat Harvard in navy and white.", q: "harvard game" },
  { title: "For your first New Haven winter", blurb: "Hoodies you'll live in.", q: "hoodie" },
  { title: "For parents visiting", blurb: "Yale Mom & Dad, sorted.", q: "dad" },
];

/** Group products into categories, preserving CATEGORIES order; drops empty groups. */
export function groupByCategory(products: Product[]): { category: Category; items: Product[] }[] {
  const buckets = new Map<string, { category: Category; items: Product[] }>();
  for (const p of products) {
    const cat = categoryOf(p.garment_type);
    if (!buckets.has(cat.slug)) buckets.set(cat.slug, { category: cat, items: [] });
    buckets.get(cat.slug)!.items.push(p);
  }
  const ordered = [...CATEGORIES, OTHER];
  return ordered
    .map((c) => buckets.get(c.slug))
    .filter((g): g is { category: Category; items: Product[] } => !!g && g.items.length > 0);
}
