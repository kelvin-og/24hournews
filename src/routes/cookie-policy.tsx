import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/site/StaticPage";
import { pageMeta } from "@/components/site/seo";

export const Route = createFileRoute("/cookie-policy")({
  head: () =>
    pageMeta(
      "Cookie Policy",
      "How 24hournews uses cookies and similar technologies.",
      "/cookie-policy",
    ),
  component: () => (
    <StaticPage title="Cookie Policy">
      <p className="text-sm text-muted-foreground">
        Placeholder — the official cookie policy will be published here.
      </p>
      <p>This page will describe the cookies used on 24hournews.com.gh and how to manage them.</p>
    </StaticPage>
  ),
});
