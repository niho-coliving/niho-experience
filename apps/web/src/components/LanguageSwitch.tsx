"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { languageSwitchTarget } from "@/lib/locale-links";

export function LanguageSwitch({ counterparts }: { counterparts: Readonly<Record<string, string>> }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const target = languageSwitchTarget(pathname, search, counterparts);
  if (!target) return null;
  const isEnglish = pathname !== "/ja" && !pathname.startsWith("/ja/");
  return <Link href={target} hrefLang={isEnglish ? "ja" : "en"} className="rounded-full border border-line-strong px-2.5 py-1 text-[0.8125rem] font-extrabold whitespace-nowrap hover:bg-sand">
    {isEnglish ? "日本語" : "English"}
  </Link>;
}
