import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { CATEGORIES } from "@/lib/site";
import { Wordmark } from "./Wordmark";

const navCls =
  "whitespace-nowrap border-b-2 border-transparent py-3 text-sm font-semibold text-foreground transition-colors hover:text-primary";
const activeCls = { className: "border-primary text-primary" };

export function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchOpen) input.current?.focus();
  }, [searchOpen]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: { q } });
    setSearchOpen(false);
    setOpen(false);
  };

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        {/* Mobile: hamburger pinned left — takes up fixed width so logo can center */}
        <div className="w-10 shrink-0 lg:hidden">
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Logo — centered on mobile, left-aligned on desktop */}
        <div className="flex flex-1 items-center justify-center gap-4 lg:flex-none lg:justify-start">
          <Wordmark />
          <span className="hidden text-xs text-muted-foreground md:inline" suppressHydrationWarning>
            {today}
          </span>
        </div>

        <div className="flex w-10 shrink-0 items-center justify-end gap-2 lg:w-auto">
          <form
            onSubmit={submit}
            role="search"
            className={`flex items-center overflow-hidden rounded-full border transition-all duration-300 ${searchOpen ? "w-48 border-input sm:w-64" : "w-10 border-transparent"}`}
          >
            <button
              type={searchOpen ? "submit" : "button"}
              aria-label="Search"
              onClick={() => !searchOpen && setSearchOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center text-foreground hover:text-primary"
            >
              <Search className="h-5 w-5" />
            </button>
            <label htmlFor="site-search" className="sr-only">
              Search articles
            </label>
            <input
              id="site-search"
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onBlur={() => !q && setSearchOpen(false)}
              onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
              placeholder="Search news…"
              tabIndex={searchOpen ? 0 : -1}
              className="h-10 w-full bg-transparent pr-4 text-sm outline-none"
            />
          </form>
        </div>
      </div>
      <nav aria-label="Main" className="hidden border-t border-border lg:block">
        <ul className="mx-auto flex max-w-7xl gap-7 px-4">
          <li>
            <Link to="/" className={navCls} activeProps={activeCls} activeOptions={{ exact: true }}>
              Home
            </Link>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link
                to="/$category"
                params={{ category: c.slug }}
                className={navCls}
                activeProps={activeCls}
              >
                {c.name}
              </Link>
            </li>
          ))}
          <li className="ml-auto">
            <Link to="/about" className={navCls} activeProps={activeCls}>
              About
            </Link>
          </li>
          <li>
            <Link to="/contact" className={navCls} activeProps={activeCls}>
              Contact
            </Link>
          </li>
        </ul>
      </nav>
      {open && (
        <nav aria-label="Mobile" className="border-t border-border lg:hidden">
          <ul className="flex flex-col px-4 py-2">
            <li>
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className={`${navCls} block`}
                activeProps={activeCls}
                activeOptions={{ exact: true }}
              >
                Home
              </Link>
            </li>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  to="/$category"
                  params={{ category: c.slug }}
                  onClick={() => setOpen(false)}
                  className={`${navCls} block`}
                  activeProps={activeCls}
                >
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/about"
                onClick={() => setOpen(false)}
                className={`${navCls} block`}
                activeProps={activeCls}
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                onClick={() => setOpen(false)}
                className={`${navCls} block`}
                activeProps={activeCls}
              >
                Contact Us
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
