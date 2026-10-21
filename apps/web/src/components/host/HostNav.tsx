"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { nihoIdOrNull, providerRoleLabel, selectProvider, type HostProvider } from "@/lib/host/providers";
import { HOST_NAV, withProvider } from "@/lib/host/routes";

/** The chosen provider lives in `?providerId=`; every console link carries it. */
function useProviderId(): string | null {
  return nihoIdOrNull(useSearchParams().get("providerId"));
}

export function HostNav() {
  const pathname = usePathname();
  const providerId = useProviderId();
  return (
    <nav aria-label="ホストのメニュー" className="mx-auto w-full max-w-5xl px-2 sm:px-4">
      <ul className="grid grid-cols-5">
        {HOST_NAV.map((item) => {
          const current = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={withProvider(item.href, providerId)}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-12 items-center justify-center border-b-[3px] px-1 text-[0.9375rem] font-bold ${current ? "border-leaf text-ink" : "border-transparent text-ink-soft hover:text-ink"}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function ProviderSwitcher({ providers }: { providers: readonly HostProvider[] }) {
  const pathname = usePathname();
  const providerId = useProviderId();
  const menu = useRef<HTMLDetailsElement>(null);
  const { provider: current } = selectProvider(providers, providerId);
  if (!current) return null;

  const label = (
    <span className="flex min-w-0 flex-col items-start leading-tight">
      <span className="text-[0.8125rem] text-muted">提供者</span>
      <span className="max-w-full truncate font-bold">{current.displayName}</span>
    </span>
  );
  if (providers.length === 1) return <div className="min-w-0">{label}</div>;

  return (
    <details ref={menu} className="relative min-w-0">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-xl border border-line-strong px-3 py-1.5 [&::-webkit-details-marker]:hidden">
        {label}
        <span className="sr-only">（切り替える）</span>
        <svg aria-hidden="true" viewBox="0 0 16 16" className="ml-auto size-4 shrink-0 text-ink-soft"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </summary>
      {/* Phones: the list opens in place and pushes the menu down; wider screens: a dropdown. */}
      <ul className="mt-2 w-full rounded-2xl border border-line bg-canvas p-2 sm:absolute sm:left-0 sm:z-20 sm:min-w-64 sm:shadow-[var(--shadow-card)]">
        {providers.map((provider) => {
          const selected = provider.id === current.id;
          const role = providerRoleLabel(provider.role);
          return (
            <li key={provider.id}>
              <Link
                href={withProvider(pathname, provider.id)}
                aria-current={selected ? "true" : undefined}
                onClick={() => menu.current?.removeAttribute("open")}
                className={`flex min-h-12 flex-col justify-center rounded-xl px-3 py-2 ${selected ? "bg-leaf-pale" : "hover:bg-sand"}`}
              >
                <span className="font-bold">{provider.displayName}</span>
                {role ? <span className="text-[0.8125rem] text-muted">{role}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
