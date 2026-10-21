import type { Metadata } from "next";
import { FieldRow, FieldSection } from "@/components/host/fields";
import { HostIcon } from "@/components/host/HostIcon";
import { HostRegisterPrompt } from "@/components/host/HostRegisterPrompt";
import { HostSettingsForm } from "@/components/host/HostSettingsForm";
import { consoleButtonClass } from "@/components/host/host-ui";
import { AccountAvatar, HostPageBody, PageHead } from "@/components/host/ui";
import { hostPageContext, loadHostConsoleData } from "@/host/data";
import { config } from "@/lib/config";
import { HOST_LOGOUT_PATH } from "@/lib/host/routes";
import { isHostMock } from "@/lib/host/server";

export const metadata: Metadata = { title: "設定" };

type SearchParams = Record<string, string | string[] | undefined>;

/** 設定 (mock v2): provider, payout account, default meeting point, notifications and the NIHO account. */
export default async function HostSettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const context = await hostPageContext(await searchParams);
  if (!context) return null;
  const { session, provider } = context;
  if (!provider) return <HostRegisterPrompt title="設定" />;
  const { settings } = await loadHostConsoleData(provider);
  const account = { displayName: session.displayName, iconUrl: session.iconUrl };

  const accountPanel = (
    <FieldSection id="settings-account" title="アカウント">
      <FieldRow label="NIHO アカウント" labelId="settings-account-label">
        <div role="group" aria-labelledby="settings-account-label" className="flex min-h-10 flex-wrap items-center gap-2.5">
          <AccountAvatar account={account} className="size-6 text-[0.75rem]" />
          <span>{account.displayName || "NIHO アカウント"}</span>
          <a href={config.nihoWebOrigin} className={consoleButtonClass("secondary", "sm")}>
            <HostIcon name="external" className="size-3.5" />
            NIHO アプリ
          </a>
        </div>
      </FieldRow>
      <div className="border-t border-line pt-3 md:pl-[184px]">
        <form method="post" action={HOST_LOGOUT_PATH}>
          <button type="submit" className={consoleButtonClass("ghost", "sm")}>
            ログアウト
          </button>
        </form>
      </div>
    </FieldSection>
  );

  return (
    <HostPageBody>
      <PageHead title="設定" />
      {/* Keyed by provider: switching providers starts from that provider's values. */}
      <HostSettingsForm key={provider.id} settings={settings} preview={isHostMock()} account={accountPanel} />
    </HostPageBody>
  );
}
