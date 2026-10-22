"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { localeHref, useSiteLocale } from "./SiteLocale";

export function LocalizedLink({ href, ...props }: ComponentProps<typeof Link>) {
  const { locale } = useSiteLocale();
  return <Link href={typeof href === "string" ? localeHref(href, locale) : href} {...props} />;
}
