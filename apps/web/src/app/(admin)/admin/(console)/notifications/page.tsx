import type { Metadata } from "next";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { HOST_SURFACE } from "@/components/host/host-ui";
import { isAdminHttp, isAdminPreview, loadAdminHttpSession } from "@/lib/admin/server";

export const metadata: Metadata = { title: "通知" };

export default async function AdminNotificationsPage() {
  if (isAdminHttp()) {
    const load = await loadAdminHttpSession();
    if (load.status !== "ok") return null;
    const expires = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", dateStyle: "medium", timeStyle: "short" }).format(load.verified.connection.expiresAt);
    return <div className="mx-auto max-w-2xl px-4 py-12"><section className={`${HOST_SURFACE} p-6`}><p className="text-xs font-extrabold tracking-[0.08em] text-moss">NIHO 接続済み</p><h1 className="mt-2 font-display text-2xl font-medium">通知APIは準備中です</h1><dl className="mt-5 grid gap-3 rounded-xl bg-sand/55 p-4 sm:grid-cols-2"><div><dt className="text-xs font-extrabold text-muted">確認済み管理者</dt><dd className="mt-1 font-bold">{load.verified.actor.displayName ?? "NIHO 管理者"}</dd></div><div><dt className="text-xs font-extrabold text-muted">接続期限</dt><dd className="mt-1 font-bold">{expires} JST</dd></div></dl><p className="mt-5 text-ink-soft">管理者認証だけが接続されています。通知本文、未読件数、既読操作はまだ読み込みません。</p></section></div>;
  }
  if (!isAdminPreview()) return null;
  return <AdminNotifications />;
}
