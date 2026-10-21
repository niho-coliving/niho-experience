import Link from "next/link";
import type { HostProviderChoice } from "@/lib/host/providers";
import { HOST_HOME_PATH, HOST_LOGOUT_PATH } from "@/lib/host/routes";
import { HostNav, ProviderSwitcher } from "./HostNav";

export interface HostAccount {
  displayName: string;
  iconUrl: string | null;
}

function Avatar({ account }: { account: HostAccount }) {
  if (account.iconUrl) {
    // A remote NIHO profile photo; next/image would need every NIHO image host configured at build time.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={account.iconUrl} alt="" className="size-9 shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" />;
  }
  const initial = Array.from(account.displayName.trim())[0] ?? "?";
  return <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-leaf-pale font-bold text-moss">{initial}</span>;
}

function AccountMenu({ account }: { account: HostAccount }) {
  const name = account.displayName || "NIHO アカウント";
  return (
    <details className="relative">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-full py-1 pr-1 pl-1 sm:pr-3 [&::-webkit-details-marker]:hidden">
        <Avatar account={account} />
        <span className="max-w-40 truncate font-bold max-sm:sr-only">{name}</span>
        <span className="sr-only">のアカウント</span>
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-canvas p-4 shadow-[var(--shadow-card)]">
        <p className="font-bold break-words">{name}</p>
        <p className="mt-1 text-[0.875rem] text-muted">NIHO アカウントでログインしています</p>
        <form method="post" action={HOST_LOGOUT_PATH} className="mt-4">
          <button type="submit" className="flex min-h-12 w-full items-center justify-center rounded-full border-[1.5px] border-ink font-bold hover:bg-sand">
            ログアウト
          </button>
        </form>
      </div>
    </details>
  );
}

/** Logo, provider switch, account and the five console sections. */
export function HostHeader({ account, providers }: { account: HostAccount; providers: readonly HostProviderChoice[] }) {
  return (
    <header className="border-b border-line bg-canvas">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-3 sm:px-6">
        <Link href={HOST_HOME_PATH} className="mr-auto flex min-h-12 items-center gap-2 rounded-md">
          <span className="font-display text-[1.25rem] leading-none">NIHO Experience</span>
          <span className="text-[0.875rem] font-bold text-moss">ホスト</span>
        </Link>
        <div className="order-last w-full sm:order-none sm:w-auto sm:max-w-80">
          <ProviderSwitcher providers={providers} />
        </div>
        <AccountMenu account={account} />
      </div>
      <HostNav />
    </header>
  );
}
