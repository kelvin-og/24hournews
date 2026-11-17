import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/site/StaticPage";
import { pageMeta } from "@/components/site/seo";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageMeta(
      "Terms and Conditions",
      "Terms and conditions for using the 24hournews website.",
      "/terms",
    ),
  component: () => (
    <StaticPage title="Terms and Conditions">
      <p className="text-sm text-muted-foreground">
        Placeholder — the official terms and conditions will be published here.
      </p>
      <p>These terms will govern your use of 24hournews.com.gh and its content.</p>
    </StaticPage>
  ),
});
