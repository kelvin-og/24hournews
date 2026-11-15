import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/site/StaticPage";
import { pageMeta } from "@/components/site/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    pageMeta(
      "About Us",
      "About 24HOURNEWS, a digital news publication for Ghana and the world.",
      "/about",
    ),
  component: () => (
    <StaticPage title="About Us">
      <p>
        24HOURNEWS is a digital news publication bringing readers in Ghana and around the world
        clear, trustworthy reporting across general news, education, entertainment, business,
        sports, politics and health.
      </p>
      <h2>Our mission</h2>
      <p>
        To inform, explain and connect — with accuracy, fairness and independence at the heart of
        every story.
      </p>
      <p className="text-sm text-muted-foreground">
        Placeholder text — replace with the official About Us copy.
      </p>
    </StaticPage>
  ),
});
