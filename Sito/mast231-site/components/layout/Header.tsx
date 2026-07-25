"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/illustrations/Logo";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/chi-siamo", label: "Chi siamo" },
  { href: "/servizi", label: "Servizi" },
  { href: "/blog", label: "Blog" },
  { href: "/contatti", label: "Contatti" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-cream">
      <div className="mx-auto flex max-w-[1140px] items-center justify-between px-10 py-[22px]">
        <Link href="/" className="flex items-center gap-3.5 font-serif text-4xl text-charcoal">
          <Logo className="h-14 w-14" />
          Mast 231
        </Link>
        <nav className="flex gap-7">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`border-b-2 py-1.5 font-sans text-base tracking-[0.6px] uppercase transition-colors hover:text-coral ${
                  isActive ? "border-coral text-coral" : "border-transparent text-charcoal"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
