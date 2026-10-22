import type { Metadata } from "next";
import { AdminBookings } from "@/components/admin/AdminBookings";
import { HOST_SURFACE } from "@/components/host/host-ui";
import { MOCK_ADMIN_HOSTS, MOCK_ADMIN_TODAY } from "@/admin/mock";
import { adminPreviewBookings } from "@/admin/preview-store";
import { isAdminPreview, readAdminSession } from "@/lib/admin/server";

export const metadata: Metadata = { title: "予約支援" };

export default async function AdminBookingsPage() {
  if (!isAdminPreview()) return <div className="mx-auto max-w-2xl px-4 py-12"><section className={`${HOST_SURFACE} p-6`}><h1 className="font-display text-2xl font-medium">予約支援は準備中です</h1><p className="mt-2 text-ink-soft">管理者権限を検証できるAPIが未配備のため、この環境では予約を表示・操作しません。</p></section></div>;
  const session = await readAdminSession();
  if (!session) return null;
  return <AdminBookings initialBookings={adminPreviewBookings(session.id, session.expiresAt)} hosts={MOCK_ADMIN_HOSTS} today={MOCK_ADMIN_TODAY} />;
}
