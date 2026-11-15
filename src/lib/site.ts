// Central site configuration. Swap branding, links and categories here.
export const SITE = {
  name: "24HOURNEWS",
  domain: "24hournews.com.gh",
  url: "https://24hournews.com.gh",
  tagline: "Independent news from Ghana and beyond, around the clock.",
  description:
    "24HOURNEWS is a digital news publication covering Ghana and the world: general news, education, entertainment, business, sports, politics and health.",
  // PLACEHOLDER social links — replace with official profile URLs when available.
  social: {
    facebook: "#facebook-placeholder",
    tiktok: "#tiktok-placeholder",
    instagram: "#instagram-placeholder",
  },
  contactEmail: "PLACEHOLDER@24hournews.com.gh",
};

export const CATEGORIES = [
  {
    slug: "general-news",
    name: "General News",
    description: "Stories from every desk, in one feed.",
  },
  {
    slug: "education",
    name: "Education",
    description: "Schools, universities, learning and policy.",
  },
  {
    slug: "entertainment",
    name: "Entertainment",
    description: "Music, film, culture and the arts.",
  },
  { slug: "business", name: "Business", description: "Markets, companies, money and the economy." },
  {
    slug: "sports",
    name: "Sports",
    description: "Football, athletics and every game that matters.",
  },
  { slug: "politics", name: "Politics", description: "Government, elections and public affairs." },
  { slug: "health", name: "Health", description: "Medicine, wellbeing and public health." },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
/** Categories articles can belong to (General News aggregates them). */
export type ArticleCategory = Exclude<CategorySlug, "general-news">;

export const getCategory = (slug: string) => CATEGORIES.find((c) => c.slug === slug);
