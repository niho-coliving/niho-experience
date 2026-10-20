"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Header link that marks the page it leads to (a pale surface and aria-current). */
export function NavLink({ href, className = "", children }: { href: string; className?: string; children: ReactNode }) {
  const current = usePathname() === href;
  return (
    <Link href={href} aria-current={current ? "page" : undefined} className={`${className} ${current ? "bg-sand" : ""}`}>
      {children}
    </Link>
  );
}
