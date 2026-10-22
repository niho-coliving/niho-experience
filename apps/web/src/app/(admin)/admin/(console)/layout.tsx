import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdminPreview, readAdminSession, requireAdminConsole } from "@/lib/admin/server";

export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  requireAdminConsole();
  if (!isAdminPreview()) return <AdminShell actorName={null}>{children}</AdminShell>;
  const session = await readAdminSession();
  if (!session) redirect("/admin");
  return <AdminShell actorName={session.actorName}>{children}</AdminShell>;
}

