import type { Metadata } from "next";
import { ComingSoon } from "@/components/host/ComingSoon";

export const metadata: Metadata = { title: "売上" };

export default async function HostSalesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { providerId } = await searchParams;
  return <ComingSoon title="売上" body="売上・返金・受取口座の確認は、ここから行えるようになります。" providerId={providerId} />;
}
