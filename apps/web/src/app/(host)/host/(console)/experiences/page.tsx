import type { Metadata } from "next";
import { ComingSoon } from "@/components/host/ComingSoon";

export const metadata: Metadata = { title: "体験" };

export default async function HostExperiencesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { providerId } = await searchParams;
  return <ComingSoon title="体験" body="体験ページの編集・写真・料金・集合場所・掲載の申請は、ここから行えるようになります。" providerId={providerId} />;
}
