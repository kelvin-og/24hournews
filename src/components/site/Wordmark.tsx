import { Link } from "@tanstack/react-router";
import logoUrl from "@/assets/24hournews-logo.png";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link to="/" aria-label="24hournews home" className={`inline-flex items-center ${className}`}>
      {/* h-20 on mobile (bigger, centered), h-14 on desktop */}
      <img
        src={logoUrl}
        alt="24hournews — Truth. Timely. Trusted."
        className="h-20 w-auto mix-blend-multiply dark:mix-blend-screen lg:h-14"
      />
    </Link>
  );
}
