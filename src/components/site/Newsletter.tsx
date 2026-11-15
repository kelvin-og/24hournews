import { useState, type FormEvent } from "react";

/** Front-end only for now — connect to an email provider later. */
export function Newsletter({ compact = false }: { compact?: boolean }) {
  const [done, setDone] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setDone(true);
  };
  return (
    <div
      className={compact ? "" : "rounded-2xl bg-secondary p-8 text-secondary-foreground sm:p-12"}
    >
      {!compact && (
        <div className="mb-6 max-w-xl">
          <p className="text-xs font-extrabold uppercase tracking-widest text-primary">
            Newsletter
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            The day's essential stories, in your inbox.
          </h2>
        </div>
      )}
      {done ? (
        <p role="status" className="font-semibold text-primary">
          Thanks! Subscriptions open soon — we'll be in touch.
        </p>
      ) : (
        <form onSubmit={submit} className="flex max-w-lg flex-col gap-2 sm:flex-row">
          <label htmlFor={compact ? "nl-footer" : "nl-main"} className="sr-only">
            Email address
          </label>
          <input
            id={compact ? "nl-footer" : "nl-main"}
            type="email"
            required
            placeholder="you@example.com"
            className="h-11 flex-1 rounded-full border border-input bg-background px-5 text-sm text-foreground outline-none focus:border-primary"
          />
          <button className="h-11 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:bg-primary-strong">
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
