import { redirect } from "next/navigation";
import { HostHeader } from "@/components/host/HostHeader";
import { HostRefreshGate, HostSessionKeeper } from "@/components/host/HostSessionKeeper";
import { hostButtonClass, HOST_HEADING, HOST_PAGE } from "@/components/host/host-ui";
import { toProviderChoice } from "@/lib/host/providers";
import { HOST_HOME_PATH, HOST_INTRO_PATH, HOST_LOGIN_PATH, HOST_LOGOUT_PATH } from "@/lib/host/routes";
import { loadHostProviders, readHostSession, requireHostConsole, type ProvidersLoad } from "@/lib/host/server";

function ProvidersProblem({ status }: { status: Exclude<ProvidersLoad["status"], "ok" | "refresh" | "signed-out"> }) {
  if (status === "rejected") {
    return (
      <div role="alert" className="space-y-4">
        <h1 className={`${HOST_HEADING} text-2xl`}>もう一度ログインしてください</h1>
        <p className="text-ink-soft">NIHO との接続が終了しています。ほかの端末でログアウトした場合などに起こります。</p>
        <div className="flex flex-wrap gap-3">
          <a href={HOST_LOGIN_PATH} className={hostButtonClass("primary")}>NIHO でログイン</a>
          <form method="post" action={HOST_LOGOUT_PATH}>
            <button type="submit" className={hostButtonClass("secondary")}>ログアウト</button>
          </form>
        </div>
      </div>
    );
  }
  return (
    <div role="alert" className="space-y-4">
      <h1 className={`${HOST_HEADING} text-2xl`}>提供者の情報を読み込めませんでした</h1>
      <p className="text-ink-soft">NIHO に接続できませんでした。時間をおいてもう一度お試しください。</p>
      <a href={HOST_HOME_PATH} className={hostButtonClass("secondary")}>もう一度読み込む</a>
    </div>
  );
}

/**
 * The signed-in frame. Rendering never refreshes the session: an expired ID
 * token hands over to the browser (HostRefreshGate), which refreshes through the
 * cross-tab lock and reloads.
 */
export default async function HostConsoleLayout({ children }: { children: React.ReactNode }) {
  requireHostConsole();
  const session = await readHostSession();
  if (!session) redirect(HOST_INTRO_PATH);
  const load = await loadHostProviders();

  if (load.status === "refresh" || load.status === "signed-out") {
    return (
      <main id="main" className={HOST_PAGE}>
        <HostRefreshGate />
      </main>
    );
  }

  const account = { displayName: session.displayName, iconUrl: session.iconUrl };
  return (
    <>
      <HostSessionKeeper idTokenExpiresAt={session.idTokenExpiresAt} />
      {/* The switcher is a client component: it gets the id, name and role, not NIHO's internal ids. */}
      <HostHeader account={account} providers={load.status === "ok" ? load.providers.map(toProviderChoice) : []} />
      <main id="main" className={`${HOST_PAGE} flex-1`}>
        {load.status === "ok" ? children : <ProvidersProblem status={load.status} />}
      </main>
    </>
  );
}
