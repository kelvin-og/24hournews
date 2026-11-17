/**
 * DEMONSTRATION CONTENT ONLY.
 * These are fictional placeholder stories for visual demonstration. They are not real news.
 * Replace by pointing src/lib/news/api.ts at a real database or CMS.
 */
import type { Article, ContentBlock } from "./types";
import type { ArticleCategory } from "@/lib/site";
import general from "@/assets/news-general.jpg";
import education from "@/assets/news-education.jpg";
import entertainment from "@/assets/news-entertainment.jpg";
import business from "@/assets/news-business.jpg";
import sports from "@/assets/news-sports.jpg";
import politics from "@/assets/news-politics.jpg";
import health from "@/assets/news-health.jpg";

const images: Record<ArticleCategory, { src: string; alt: string }> = {
  education: { src: education, alt: "Students writing in notebooks in a sunlit classroom" },
  entertainment: { src: entertainment, alt: "Crowd at a concert under orange stage lights" },
  business: { src: business, alt: "Professionals walking past glass office towers" },
  sports: { src: sports, alt: "Footballer striking the ball during an evening match" },
  politics: { src: politics, alt: "Empty parliamentary chamber with microphones at each seat" },
  health: { src: health, alt: "Nurse measuring a patient's blood pressure in a clinic" },
};
void general;

type Seed = [ArticleCategory, string, string, string];

const seeds: Seed[] = [
  [
    "education",
    "Sample story: Regional schools pilot a new digital learning programme",
    "A demonstration article showing how an education feature would look on 24hournews.",
    "Ama Mensah (Demo)",
  ],
  [
    "education",
    "Sample story: University libraries extend opening hours for exam season",
    "Placeholder content illustrating a short education news report.",
    "Kofi Asante (Demo)",
  ],
  [
    "education",
    "Sample story: Teachers share approaches to reading in early grades",
    "Placeholder feature demonstrating long-form education coverage.",
    "Efua Owusu (Demo)",
  ],
  [
    "entertainment",
    "Sample story: Weekend music festival draws crowds to the capital",
    "Demonstration article for the entertainment desk layout.",
    "Yaw Boateng (Demo)",
  ],
  [
    "entertainment",
    "Sample story: Local filmmakers prepare for a screening season",
    "Placeholder entertainment story used to preview article cards.",
    "Akosua Darko (Demo)",
  ],
  [
    "entertainment",
    "Sample story: A look inside a community theatre rehearsal",
    "Placeholder feature for showcasing culture coverage.",
    "Kwame Ofori (Demo)",
  ],
  [
    "business",
    "Sample story: Small businesses adapt to mobile payment growth",
    "Demonstration business article illustrating market coverage.",
    "Abena Kusi (Demo)",
  ],
  [
    "business",
    "Sample story: What a typical market week looks like for traders",
    "Placeholder business feature for layout preview.",
    "Nana Adjei (Demo)",
  ],
  [
    "business",
    "Sample story: Startups gather for an innovation showcase",
    "Placeholder business report demonstrating card design.",
    "Esi Appiah (Demo)",
  ],
  [
    "sports",
    "Sample story: Club football season opens with a packed stadium",
    "Demonstration sports article for the 24hournews layout.",
    "Kojo Amoah (Demo)",
  ],
  [
    "sports",
    "Sample story: Young athletes train for regional championships",
    "Placeholder sports feature for previewing cards.",
    "Adwoa Nyarko (Demo)",
  ],
  [
    "sports",
    "Sample story: Coaches discuss grassroots development",
    "Placeholder sports analysis demonstrating long-form layout.",
    "Fiifi Quaye (Demo)",
  ],
  [
    "politics",
    "Sample story: Parliament schedules debate on a proposed bill",
    "Demonstration politics article. Not a real event.",
    "Akua Sarpong (Demo)",
  ],
  [
    "politics",
    "Sample story: Explaining how local assembly elections work",
    "Placeholder explainer showing politics coverage.",
    "Kwesi Annan (Demo)",
  ],
  [
    "politics",
    "Sample story: Citizens attend a town hall on public services",
    "Placeholder politics report for layout preview.",
    "Maame Tetteh (Demo)",
  ],
  [
    "health",
    "Sample story: Community clinics run free blood pressure checks",
    "Demonstration health article for the 24hournews layout.",
    "Dr. Yaa Badu (Demo)",
  ],
  [
    "health",
    "Sample story: Simple habits for staying hydrated in the heat",
    "Placeholder wellbeing feature for previewing cards.",
    "Kobby Acheampong (Demo)",
  ],
  [
    "health",
    "Sample story: How health workers prepare for flu season",
    "Placeholder public-health report demonstrating layout.",
    "Afia Frimpong (Demo)",
  ],
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/^sample story:\s*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function body(category: string): ContentBlock[] {
  return [
    {
      type: "paragraph",
      text: `This is demonstration content created to preview the ${category} article layout on 24hournews. It does not describe real events, people or organisations, and will be replaced with genuine reporting once the publishing system is connected.`,
    },
    {
      type: "paragraph",
      text: "A real article would open here with the key facts of the story: who, what, where and when. Paragraphs are kept at a comfortable measure with generous line spacing so long reads remain easy on phones and large screens alike.",
    },
    { type: "heading", text: "How the layout handles subheadings" },
    {
      type: "paragraph",
      text: "Subheadings break longer pieces into scannable sections. The article body preserves every paragraph, heading, quotation and caption supplied by the newsroom without truncation.",
    },
    {
      type: "quote",
      text: "Pull quotes highlight a memorable line from the story and give readers a moment to pause.",
      cite: "Example attribution",
    },
    {
      type: "paragraph",
      text: "Further context, background and analysis would follow, along with any embedded media supplied with the story. Related articles from the same desk appear below for readers who want to keep exploring.",
    },
    {
      type: "paragraph",
      text: "When the content management system is introduced, editors will be able to publish, update and feature stories, and this page will display them automatically.",
    },
  ];
}

const base = new Date("2026-11-10T08:00:00Z").getTime();

export const SAMPLE_ARTICLES: Article[] = seeds.map(
  ([category, headline, description, author], i) => {
    const img = images[category];
    return {
      id: `demo-${i + 1}`,
      headline,
      slug: slugify(headline),
      category,
      subtitle: description,
      description,
      content: body(category),
      featuredImage: img.src,
      imageAlt: img.alt,
      imageCaption: "Illustrative image for demonstration purposes.",
      author,
      publishedAt: new Date(base - i * 3.5 * 3600_000).toISOString(),
      updatedAt:
        i % 4 === 0 ? new Date(base - i * 3.5 * 3600_000 + 2 * 3600_000).toISOString() : undefined,
      readingTime: 3 + (i % 5),
      featured: i % 3 === 0,
      breaking: i < 5 && i % 2 === 0,
      isDemo: true,
    };
  },
);
