import { Link } from "@tanstack/react-router";
import { CATEGORIES, SITE } from "@/lib/site";
import { Wordmark } from "./Wordmark";
import { SocialIcons } from "./SocialIcons";
import { Newsletter } from "./Newsletter";

const linkCls = "text-sm text-muted-foreground transition-colors hover:text-primary";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-muted">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Wordmark />
          <p className="text-sm text-muted-foreground">{SITE.description}</p>
        </div>
        <div>
          <h2 className="mb-4 font-sans text-xs font-extrabold uppercase tracking-widest">
            Sections
          </h2>
          <ul className="grid grid-cols-2 gap-2">
            <li>
              <Link to="/" className={linkCls}>
                Home
              </Link>
            </li>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link to="/$category" params={{ category: c.slug }} className={linkCls}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-4 font-sans text-xs font-extrabold uppercase tracking-widest">
            Company
          </h2>
          <ul className="space-y-2">
            <li>
              <Link to="/about" className={linkCls}>
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className={linkCls}>
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/privacy-policy" className={linkCls}>
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className={linkCls}>
                Terms and Conditions
              </Link>
            </li>
            <li>
              <Link to="/cookie-policy" className={linkCls}>
                Cookie Policy
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 font-sans text-xs font-extrabold uppercase tracking-widest">
              Newsletter
            </h2>
            <Newsletter compact />
          </div>
          <div>
            <h2 className="mb-4 font-sans text-xs font-extrabold uppercase tracking-widest">
              Follow Us
            </h2>
            <SocialIcons />
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center max-w-7xl">
          <p>
            © {new Date().getFullYear()} {SITE.domain}. All rights reserved. Stories shown are
            demonstration content.
          </p>
          <Link
            to="/admin"
            className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            Staff Newsroom →
          </Link>
        </div>
      </div>
    </footer>
  );
}
