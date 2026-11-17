import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StaticPage } from "@/components/site/StaticPage";
import { pageMeta } from "@/components/site/seo";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () =>
    pageMeta(
      "Contact Us",
      "Get in touch with the 24hournews newsroom with tips, feedback or enquiries.",
      "/contact",
    ),
  component: Contact,
});

const field =
  "h-12 w-full rounded-lg border border-input px-4 text-base outline-none focus:border-primary";

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <StaticPage title="Contact Us">
      <p>
        Have a story tip, correction or enquiry? Send us a message. Email:{" "}
        <span className="font-semibold">{SITE.contactEmail}</span>{" "}
        <span className="text-sm text-muted-foreground">(placeholder address)</span>
      </p>
      {sent ? (
        <p role="status" className="rounded-lg bg-accent p-4 font-semibold text-accent-foreground">
          Thank you — your message form will be connected soon.
        </p>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <div>
            <label htmlFor="c-name" className="mb-1 block text-sm font-bold">
              Name
            </label>
            <input id="c-name" required className={field} />
          </div>
          <div>
            <label htmlFor="c-email" className="mb-1 block text-sm font-bold">
              Email
            </label>
            <input id="c-email" type="email" required className={field} />
          </div>
          <div>
            <label htmlFor="c-msg" className="mb-1 block text-sm font-bold">
              Message
            </label>
            <textarea id="c-msg" required rows={5} className={`${field} h-auto py-3`} />
          </div>
          <button className="h-12 rounded-full bg-primary px-8 font-bold text-primary-foreground hover:bg-primary-strong">
            Send message
          </button>
        </form>
      )}
    </StaticPage>
  );
}
