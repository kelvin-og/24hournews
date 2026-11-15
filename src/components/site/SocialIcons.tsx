import { SITE } from "@/lib/site";

const icons = {
  facebook: (
    <path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8Z" />
  ),
  instagram: (
    <>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" />
    </>
  ),
  tiktok: (
    <path d="M16.5 3c.4 2.3 1.9 3.8 4.2 4v3.2c-1.6 0-3-.5-4.2-1.3v6.4a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v3.3a2.5 2.5 0 1 0 1.6 2.3V3h3.2Z" />
  ),
};

export function SocialIcons() {
  return (
    <ul className="flex gap-3">
      {(Object.keys(icons) as (keyof typeof icons)[]).map((k) => (
        <li key={k}>
          <a
            href={SITE.social[k]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${k.charAt(0).toUpperCase() + k.slice(1)} (link coming soon)`}
            title="Placeholder link — official profile coming soon"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              {icons[k]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
