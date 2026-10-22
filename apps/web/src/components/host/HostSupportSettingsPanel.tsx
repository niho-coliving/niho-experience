"use client";

import { useRef, useState } from "react";
import type { HostProviderRole } from "@/lib/host/providers";
import { hostSupportSettingPreview } from "@/support/mock";
import { SUPPORT_FEE_PERCENT } from "@/support/types";
import { FieldRow, FieldSection } from "./fields";
import { HostConfirmDialog } from "./HostConfirmDialog";
import { consoleButtonClass } from "./host-ui";

export function HostSupportSettingsPanel({ providerId, role, preview }: { providerId: string; role: HostProviderRole | null; preview: boolean }) {
  const current = hostSupportSettingPreview(providerId, role);
  const owner = role === "OWNER";
  const [saved, setSaved] = useState(current.enabled);
  const [choice, setChoice] = useState(current.enabled);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState("");
  const stay = useRef<HTMLButtonElement>(null);
  const unavailable = !preview;

  const commit = () => {
    setSaved(choice);
    setNotice("サポート設定を更新しました。この画面の合成プレビューにだけ反映されます。既存予約の条件は変わりません。");
    setConfirming(false);
  };

  if (unavailable) return <div className="mb-3.5"><FieldSection id="settings-support" title="NIHOサポート" status={{ label: "準備中", tone: "draft" }}><p className="text-[0.8125rem] text-ink-soft">現在の利用設定はまだ表示できません。設定の確認・変更は準備が整ってから利用できます。</p></FieldSection></div>;

  return <div className="mb-3.5">
    <FieldSection id="settings-support" title="NIHOサポート" status={unavailable ? { label: "準備中", tone: "draft" } : null}>
      <FieldRow label="利用設定" labelId="settings-support-choice">
        <div role="radiogroup" aria-labelledby="settings-support-choice" className="flex flex-wrap gap-2">
          {[false, true].map((enabled) => <label key={String(enabled)} className={`relative inline-flex min-h-10 items-center rounded-full border px-4 font-extrabold ${choice === enabled ? "border-ink bg-sand" : "border-line-strong bg-canvas"}`}><input type="radio" name="support-setting" checked={choice === enabled} disabled={!owner || unavailable} onChange={() => { setChoice(enabled); setNotice(""); }} className="absolute inset-0 size-full cursor-pointer appearance-none rounded-full disabled:cursor-not-allowed"/><span>サポート{enabled ? "ON" : "OFF"} · 手数料 {enabled ? SUPPORT_FEE_PERCENT.on : SUPPORT_FEE_PERCENT.off}%</span></label>)}
        </div>
        {!owner ? <p className="mt-1.5 text-xs text-muted">この設定はオーナーが変更できます。</p> : null}
      </FieldRow>
      <FieldRow label="支援範囲" labelId="settings-support-scope"><div id="settings-support-scope" className="space-y-1 text-[0.8125rem] text-ink-soft"><p>ONにすると、予約を事務局の通常の支援対象として共有し、状態に応じた予約操作を許可します。</p><p>通訳紹介、料理補助、地元の方への声かけ、返金連絡の代行など、具体的な内容はホストと事務局で相談して決めます。</p></div></FieldRow>
      <FieldRow label="費用" labelId="settings-support-cost"><div id="settings-support-cost" className="space-y-1 text-[0.8125rem] text-ink-soft"><p>サポートOFFは手数料10%、ONは合計15%です。</p><p>支援担当者の人件費は含まれません。条件を相談し、ホストから担当者へ別途直接支払います。</p></div></FieldRow>
      <FieldRow label="適用" labelId="settings-support-timing"><p id="settings-support-timing" className="text-[0.8125rem] text-ink-soft">変更後に受け付ける予約から適用します。既存予約の手数料・支援条件には遡って適用しません。</p></FieldRow>
      <div className="border-t border-line pt-3 md:pl-[184px]"><button type="button" disabled={!owner || unavailable || choice === saved} onClick={() => setConfirming(true)} className={consoleButtonClass("secondary", "md", "disabled:cursor-not-allowed disabled:opacity-50")}>サポート設定を保存</button>{notice ? <p role="status" className="mt-2 text-[0.78125rem] font-bold text-moss">{notice}</p> : null}</div>
    </FieldSection>
    {confirming ? <HostConfirmDialog title={`サポートを${choice ? "ON" : "OFF"}に変更しますか？`} description={`今後受け付ける予約の手数料は${choice ? SUPPORT_FEE_PERCENT.on : SUPPORT_FEE_PERCENT.off}%になります。既存予約の手数料と支援条件は変わりません。`} focusRef={stay} stayRef={stay} confirm={<button type="submit" className={consoleButtonClass("primary")}>変更を保存</button>} onConfirm={commit} onClose={() => setConfirming(false)}><label className="mt-4 flex items-start gap-2 rounded-xl bg-sand p-3 text-[0.8125rem] font-bold"><input required type="checkbox" className="mt-1 size-4 shrink-0"/>既存予約へ遡って変更されないことを確認しました</label></HostConfirmDialog> : null}
  </div>;
}

