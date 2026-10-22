import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { HOST_SURFACE } from "@/components/host/host-ui";
import { isAdminPreview, readAdminSession, requireAdminConsole } from "@/lib/admin/server";

export default async function AdminEntryPage() {
  requireAdminConsole();
  if (!isAdminPreview()) return <AdminShell actorName={null}><div className="mx-auto max-w-2xl px-4 py-12"><section className={`${HOST_SURFACE} p-6`}><h1 className="font-display text-2xl font-medium">管理画面は準備中です</h1><p className="mt-2 text-ink-soft">NIHO側の管理者認証と予約支援APIが配備されるまで、実データの閲覧・操作はできません。</p></section></div></AdminShell>;
  const session = await readAdminSession();
  if (session) redirect("/admin/bookings");
  return <main id="main" className="grid min-h-dvh place-items-center bg-sand/45 px-4 py-10"><section className={`${HOST_SURFACE} w-full max-w-lg p-6 md:p-8`}><p className="text-xs font-extrabold tracking-[0.08em] text-moss">NIHO EXPERIENCE</p><h1 className="mt-2 font-display text-2xl font-medium">予約支援の管理画面</h1><p className="mt-3 text-ink-soft">全ホストの予約を確認し、サポートONで受け付けた予約の支援を行う合成プレビューです。</p><form method="post" action="/admin/auth/mock-login" className="mt-6"><button type="submit" className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-leaf px-6 font-extrabold hover:bg-leaf-hover">合成Adminとして開く</button></form><p className="mt-3 text-xs text-muted">実データ・実決済・外部への連絡は行いません。</p></section></main>;
}

