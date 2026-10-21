import type { Metadata } from "next";
import { ComingSoon } from "@/components/host/ComingSoon";
import { HostRegisterForm } from "@/components/host/HostRegisterForm";
import { HostPageBody, PageHead } from "@/components/host/ui";
import { MOCK_REGISTRATION_CONSENT } from "@/host/mock/provider";
import { isHostMock } from "@/lib/host/server";

export const metadata: Metadata = { title: "提供者の登録" };

/**
 * Provider registration (#88). The form runs in the preview only (mock mode): its
 * 登録する stands in for NIHO's registration API, which the follow-up to #88 connects.
 */
export default async function HostRegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!isHostMock()) {
    const { providerId } = await searchParams;
    return <ComingSoon title="提供者の登録" body="提供者（個人または事業者）の登録・同意・受取口座の設定は、ここから行えるようになります。" providerId={providerId} />;
  }
  return (
    <HostPageBody>
      <PageHead title="提供者の登録" />
      <p className="mb-3.5 text-ink-soft">体験サイトに表示する提供者の情報です。登録のあと、体験ページを作れます。</p>
      <HostRegisterForm consent={MOCK_REGISTRATION_CONSENT} />
    </HostPageBody>
  );
}
