import type { Metadata } from "next";
import Link from "next/link";
import { hostButtonClass, HOST_CARD, HOST_HEADING } from "@/components/host/host-ui";
import { providerRoleLabel, nihoIdOrNull, selectProvider } from "@/lib/host/providers";
import { HOST_NAV, HOST_REGISTER_PATH, withProvider } from "@/lib/host/routes";
import { loadHostProviders, readHostSession } from "@/lib/host/server";

export const metadata: Metadata = { title: "ホーム" };

type SearchParams = Record<string, string | string[] | undefined>;

const COMING = [
  { title: "体験", body: "体験ページの文章・写真・料金・集合場所を編集し、掲載を申請します。" },
  { title: "予約", body: "届いた予約を確かめ、承認・取消・ゲストへの連絡をします。" },
  { title: "売上", body: "売上と返金、受取口座の状態を確かめます。" },
];

export default async function HostHomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const [load, session] = await Promise.all([loadHostProviders(), readHostSession()]);
  // The console layout shows sign-in, refresh and error states.
  if (load.status !== "ok" || !session) return null;
  // Kept as phrases so a narrow screen breaks between them, not inside the name.
  const greeting = session.displayName ? <><span className="inline-block">{session.displayName} さん、</span><span className="inline-block">こんにちは</span></> : "こんにちは";

  if (load.providers.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className={`${HOST_HEADING} text-2xl sm:text-3xl`}>{greeting}</h1>
        <section aria-labelledby="register-heading" className={HOST_CARD}>
          <h2 id="register-heading" className={`${HOST_HEADING} text-xl`}>まず提供者として登録しましょう</h2>
          <p className="mt-2 text-ink-soft">体験を掲載するには、個人または事業者として提供者の登録が必要です。登録の内容は NIHO が確認します。</p>
          <p className="mt-5">
            <Link href={HOST_REGISTER_PATH} className={hostButtonClass("primary")}>提供者として登録</Link>
          </p>
        </section>
      </div>
    );
  }

  const requested = typeof query.providerId === "string" ? query.providerId : null;
  const { provider, requestedMissing } = selectProvider(load.providers, nihoIdOrNull(requested));
  if (!provider) return null;
  const role = providerRoleLabel(provider.memberRole);
  const notFound = requested !== null && (requestedMissing || !nihoIdOrNull(requested));

  return (
    <div className="space-y-6">
      <h1 className={`${HOST_HEADING} text-2xl sm:text-3xl`}>{greeting}</h1>
      {notFound ? (
        <p role="alert" className="rounded-2xl border border-warn/20 bg-warn-pale px-4 py-3 text-warn">
          指定された提供者を開けませんでした。権限が無いか、URL が正しくありません。{provider.displayName}を表示しています。
        </p>
      ) : null}
      <section aria-labelledby="provider-heading" className={HOST_CARD}>
        <p className="text-[0.875rem] text-muted">表示中の提供者</p>
        <h2 id="provider-heading" className={`${HOST_HEADING} mt-1 text-xl`}>{provider.displayName}</h2>
        {role ? <p className="mt-1 text-ink-soft">あなたの役割：{role}</p> : null}
      </section>
      <section aria-labelledby="coming-heading">
        <h2 id="coming-heading" className={`${HOST_HEADING} text-lg`}>これから使えるようになること</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {COMING.map((item) => {
            const nav = HOST_NAV.find((entry) => entry.label === item.title);
            return (
              <li key={item.title} className={HOST_CARD}>
                <h3 className={`${HOST_HEADING} text-base`}>
                  {nav ? <Link href={withProvider(nav.href, provider.id)} className="underline decoration-leaf decoration-2 underline-offset-4">{item.title}</Link> : item.title}
                </h3>
                <p className="mt-1 text-[0.9375rem] text-ink-soft">{item.body}</p>
                <p className="mt-2 text-[0.8125rem] text-muted">準備中</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
