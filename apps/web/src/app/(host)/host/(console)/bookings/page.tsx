import type { Metadata } from "next";
import { ComingSoon } from "@/components/host/ComingSoon";

export const metadata: Metadata = { title: "予約" };

export default async function HostBookingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { providerId } = await searchParams;
  return <ComingSoon title="予約" body="予約の確認・承認・取消・ゲストへの連絡は、ここから行えるようになります。" providerId={providerId} />;
}
