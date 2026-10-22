import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminRefreshGate, AdminSessionEndGate, AdminSessionKeeper } from "@/components/admin/AdminSessionKeeper";
import { HOST_SURFACE } from "@/components/host/host-ui";
import { ADMIN_ENTRY_PATH } from "@/lib/admin/routes";
import { isAdminHttp, isAdminPreview, loadAdminHttpSession, readAdminSession, requireAdminConsole } from "@/lib/admin/server";

export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  requireAdminConsole();
  if (isAdminPreview()) {
    const session = await readAdminSession();
    if (!session) redirect(ADMIN_ENTRY_PATH);
    return <AdminShell actorName={session.actorName}>{children}</AdminShell>;
  }
  if (!isAdminHttp()) redirect(ADMIN_ENTRY_PATH);
  const load = await loadAdminHttpSession();
  if (load.status === "signed-out") redirect(ADMIN_ENTRY_PATH);
  if (load.status === "refresh") {
    return <AdminShell actorName={null}><div className="mx-auto max-w-2xl px-4 py-12"><section className={`${HOST_SURFACE} p-6`}><AdminRefreshGate /></section></div></AdminShell>;
  }
  if (load.status === "rejected") {
    return <AdminShell actorName={null}><div className="mx-auto max-w-2xl px-4 py-12"><section className={`${HOST_SURFACE} p-6`}><AdminSessionEndGate /></section></div></AdminShell>;
  }
  if (load.status === "error") {
    return <AdminShell actorName={null}><div className="mx-auto max-w-2xl px-4 py-12"><section role="alert" className={`${HOST_SURFACE} p-6`}><h1 className="font-display text-2xl font-medium">管理者情報を確認できませんでした</h1><p className="mt-2 text-ink-soft">通信の状態を確かめて、もう一度お試しください。</p><a href={ADMIN_ENTRY_PATH} className="mt-5 inline-flex min-h-11 items-center rounded-full border border-line-strong px-5 font-extrabold hover:bg-sand">もう一度試す</a></section></div></AdminShell>;
  }
  return <><AdminSessionKeeper idTokenExpiresAt={load.session.idTokenExpiresAt} connectionExpiresAt={load.session.connectionExpiresAt} /><AdminShell actorName={load.verified.actor.displayName ?? "NIHO 管理者"}>{children}</AdminShell></>;
}

