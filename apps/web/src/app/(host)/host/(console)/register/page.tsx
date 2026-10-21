import type { Metadata } from "next";
import { ComingSoon } from "@/components/host/ComingSoon";

export const metadata: Metadata = { title: "提供者として登録" };

export default async function HostRegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { providerId } = await searchParams;
  return <ComingSoon title="提供者として登録" body="提供者（個人または事業者）の登録・同意・受取口座の設定は、ここから行えるようになります。" providerId={providerId} />;
}
