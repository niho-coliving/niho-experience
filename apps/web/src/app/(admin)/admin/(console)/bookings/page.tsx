import type { Metadata } from "next";
import { AdminBookings } from "@/components/admin/AdminBookings";
import { HOST_SURFACE } from "@/components/host/host-ui";
import { MOCK_ADMIN_HOSTS, MOCK_ADMIN_TODAY } from "@/admin/mock";
import { adminPreviewBookings } from "@/admin/preview-store";
import { isAdminHttp, isAdminPreview, loadAdminHttpSession, readAdminSession } from "@/lib/admin/server";

export const metadata: Metadata = { title: "予約支援" };

export default async function AdminBookingsPage() {
  if (isAdminHttp()) {
    const load = await loadAdminHttpSession();
    if (load.status !== "ok") return null;
    const expires = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", dateStyle: "medium", timeStyle: "short" }).format(load.verified.connection.expiresAt);
    return <div className="mx-auto max-w-2xl px-4 py-12"><section className={`${HOST_SURFACE} p-6`}><p className="text-xs font-extrabold tracking-[0.08em] text-moss">NIHO 接続済み</p><h1 className="mt-2 font-display text-2xl font-medium">予約支援APIは準備中です</h1><dl className="mt-5 grid gap-3 rounded-xl bg-sand/55 p-4 sm:grid-cols-2"><div><dt className="text-xs font-extrabold text-muted">確認済み管理者</dt><dd className="mt-1 font-bold">{load.verified.actor.displayName ?? "NIHO 管理者"}</dd></div><div><dt className="text-xs font-extrabold text-muted">接続期限</dt><dd className="mt-1 font-bold">{expires} JST</dd></div></dl><p className="mt-5 text-ink-soft">管理者認証だけが接続されています。予約一覧、代行操作、料金、通知、ホスト設定はまだ読み込みません。</p></section></div>;
  }
  if (!isAdminPreview()) return null;
  const session = await readAdminSession();
  if (!session) return null;
  return <AdminBookings initialBookings={adminPreviewBookings(session.id, session.expiresAt)} hosts={MOCK_ADMIN_HOSTS} today={MOCK_ADMIN_TODAY} />;
}
