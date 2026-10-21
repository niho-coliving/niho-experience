import Link from "next/link";
import { HOST_REGISTER_PATH } from "@/lib/host/routes";
import { consoleButtonClass, HOST_HEADING, HOST_SURFACE } from "./host-ui";
import { HostPageBody, PageHead } from "./ui";

/** A NIHO account with no provider yet: every console page leads to registration. */
export function HostRegisterPrompt({ title }: { title: string }) {
  return (
    <HostPageBody>
      <PageHead title={title} />
      <section aria-labelledby="register-heading" className={`${HOST_SURFACE} p-5 md:p-6`}>
        <h2 id="register-heading" className={`${HOST_HEADING} text-lg leading-snug`}>
          まず提供者として登録しましょう
        </h2>
        <p className="mt-2 text-ink-soft">体験を掲載するには、個人または事業者として提供者の登録が必要です。登録の内容は NIHO が確認します。</p>
        <p className="mt-5">
          <Link href={HOST_REGISTER_PATH} className={consoleButtonClass("primary", "lg")}>
            提供者として登録
          </Link>
        </p>
      </section>
    </HostPageBody>
  );
}
