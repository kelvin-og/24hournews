import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/site/StaticPage";
import { pageMeta } from "@/components/site/seo";

export const Route = createFileRoute("/privacy-policy")({
  head: () =>
    pageMeta(
      "Privacy Policy",
      "How 24HOURNEWS collects, uses and protects your information.",
      "/privacy-policy",
    ),
  component: () => (
    <StaticPage title="Privacy Policy">
      <p className="text-sm text-muted-foreground">
        Placeholder — the official privacy policy will be published here.
      </p>
      <p>
        This page will explain what personal information 24HOURNEWS collects, how it is used, and
        the choices readers have.
      </p>
    </StaticPage>
  ),
});
