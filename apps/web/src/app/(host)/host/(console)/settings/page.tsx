import type { Metadata } from "next";
import { ComingSoon } from "@/components/host/ComingSoon";

export const metadata: Metadata = { title: "設定" };

export default async function HostSettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { providerId } = await searchParams;
  return <ComingSoon title="設定" body="提供者の情報や販売者の表示の設定は、ここから行えるようになります。" providerId={providerId} />;
}
