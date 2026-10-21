import { HOST_MOCK_LOGIN_PATH } from "@/lib/host/routes";
import { FieldRow, FieldSection, INPUT, KindSegment, NARROW, TEXTAREA } from "./fields";
import { consoleButtonClass } from "./host-ui";

/**
 * Provider registration (#88): kind, listing name, introduction, seller page and consent.
 *
 * Mock preview only: 登録する signs in again as the synthetic host who has providers
 * (GET /host/auth/mock-login), which stands in for a finished registration. The text
 * fields have no `name`, so nothing typed leaves the browser. The follow-up to #88
 * posts the registration (with the consent version) to NIHO's provider API instead.
 */
export function HostRegisterForm({ consent }: { consent: string }) {
  return (
    <form method="get" action={HOST_MOCK_LOGIN_PATH} className="flex flex-col gap-3.5">
      <FieldSection id="register-provider" title="提供者情報">
        <FieldRow label="種別" labelId="register-kind-label">
          <KindSegment name="kind" labelId="register-kind-label" defaultValue="INDIVIDUAL" />
        </FieldRow>
        <FieldRow label="掲載名" htmlFor="register-display-name">
          <input id="register-display-name" required maxLength={120} autoComplete="organization" aria-describedby="register-display-name-help" className={`${INPUT} ${NARROW}`} />
          <p id="register-display-name-help" className="mt-1 text-xs text-muted">
            体験ページに「提供者」として表示する名前です。
          </p>
        </FieldRow>
        <FieldRow label="紹介" htmlFor="register-bio">
          <textarea id="register-bio" rows={4} maxLength={4000} className={TEXTAREA} />
        </FieldRow>
        <FieldRow label="特商法表示 URL" htmlFor="register-seller-url">
          <input id="register-seller-url" type="url" inputMode="url" placeholder="https://" aria-describedby="register-seller-url-help" className={`${INPUT} ${NARROW}`} />
          <p id="register-seller-url-help" className="mt-1 text-xs text-muted">
            掲載の審査までに https のページを用意してください。
          </p>
        </FieldRow>
      </FieldSection>
      <label className="flex items-start gap-3 rounded-2xl bg-sand p-4 text-[0.84375rem] leading-relaxed text-ink-soft md:px-5">
        <input type="checkbox" required className="mt-0.5 size-5 shrink-0 accent-moss" />
        <span>{consent}</span>
      </label>
      <div>
        <button type="submit" className={consoleButtonClass("primary", "lg", "w-full md:w-auto")}>
          登録する
        </button>
      </div>
    </form>
  );
}
