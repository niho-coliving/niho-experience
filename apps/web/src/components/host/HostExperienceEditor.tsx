"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { draftPageEnglish } from "@/host/actions";
import { EDITOR_LIMITS, experienceContent, listingRequirements, pauseListing, sameContent, submitListing, withdrawListing, writtenTitle } from "@/host/editor";
import {
  applyEnglishDraft,
  changeInTab,
  confirmEnglish,
  contentInTab,
  editsToReplace,
  PAGE_ENGLISH_FAILED_TEXT,
  pageEnglishState,
  publicEnglishBehind,
  textHasWords,
  writeInEnglish,
  writeInJapanese,
  type EditorTab,
} from "@/host/page-english";
import type { HostExperience, HostExperienceContent, HostListing, HostWritingLanguage } from "@/host/types";
import { DISABLED } from "./editor-parts";
import { HostEditorContent } from "./HostEditorContent";
import { ChangedMark, EDITOR_TAB_PANEL_ID, EditorLanguageTabs, editorTabId, EnglishStatePanel } from "./HostEditorEnglish";
import { HostEditorRail } from "./HostEditorRail";
import { HostIcon } from "./HostIcon";
import { HostSubHeader } from "./HostSubHeader";
import { consoleButtonClass } from "./host-ui";
import { HostPageBody } from "./ui";

const SAVE_DELAY_MS = 500;
const SAVED_NOTICE_MS = 2500;

type LeaveDestination =
  | { kind: "link"; anchor: HTMLAnchorElement }
  | { kind: "history"; delta: number };

interface LeaveGuard {
  /** A link or browser history entry was requested with unsaved changes. */
  asking: boolean;
  stay: () => void;
  leave: () => void;
}

interface HostHistoryGuardState {
  readonly dirty: boolean;
  readonly leaving: boolean;
  readonly current: { href: string; state: unknown; index: number | null };
  onHistoryLeave: (delta: number) => void;
}

declare global {
  interface Window {
    __nihoHostHistoryGuard?: HostHistoryGuardState;
  }
}

function currentNavigationIndex(): number | null {
  const navigation = (window as Window & {
    navigation?: { currentEntry?: { index: number } | null };
  }).navigation;
  const index = navigation?.currentEntry?.index;
  return typeof index === "number" && index >= 0 ? index : null;
}

/**
 * With unsaved changes, leaving asks first. A reload, a closed tab or a typed address get
 * the browser's own prompt (beforeunload). Links and browser back/forward are stopped and
 * asked about on the page, never with a browser dialog.
 */
function useLeaveGuard(dirty: boolean): LeaveGuard {
  const [destination, setDestination] = useState<LeaveDestination | null>(null);
  const dirtyRef = useRef(dirty);
  const leaving = useRef(false);
  const historyEntry = useRef<{ href: string; state: unknown; index: number | null }>({ href: "", state: null, index: null });
  useLayoutEffect(() => {
    dirtyRef.current = dirty;
    // The App Router can finish updating the URL after the editor mounts. Refresh the
    // guarded history entry whenever the editor's dirty state changes.
    historyEntry.current = { href: window.location.href, state: window.history.state, index: currentNavigationIndex() };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current || leaving.current) return;
      event.preventDefault();
      // Older browsers ask only when returnValue is set.
      event.returnValue = "";
    };
    const onClick = (event: MouseEvent) => {
      if (!dirtyRef.current || leaving.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      const to = new URL(anchor.href, window.location.href);
      if (to.pathname === window.location.pathname && to.search === window.location.search) return;
      event.preventDefault();
      event.stopPropagation();
      setDestination({ kind: "link", anchor });
    };
    const historyGuard: HostHistoryGuardState = {
      get dirty() { return dirtyRef.current; },
      get leaving() { return leaving.current; },
      get current() { return historyEntry.current; },
      onHistoryLeave: (delta) => setDestination({ kind: "history", delta }),
    };
    window.__nihoHostHistoryGuard = historyGuard;
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("click", onClick, true);
      if (window.__nihoHostHistoryGuard === historyGuard) delete window.__nihoHostHistoryGuard;
    };
  }, [dirty]);
  return {
    asking: destination !== null,
    stay: () => setDestination(null),
    leave: () => {
      if (!destination) return;
      leaving.current = true;
      setDestination(null);
      if (destination.kind === "link") {
        // The same link leads on as it would have: console links move inside it, others load their page.
        if (destination.anchor.isConnected) destination.anchor.click();
        else window.location.assign(destination.anchor.href);
      } else {
        // Resume the original traversal after the early guard has restored the editor entry.
        window.history.go(destination.delta);
      }
    },
  };
}

const LEAVE_BUTTON = "inline-flex h-[38px] shrink-0 items-center justify-center rounded-full border border-line-strong bg-canvas px-4 text-[0.84375rem] leading-none font-extrabold whitespace-nowrap text-danger hover:bg-danger-pale";

/** 保存していない変更があります, asked in a modal dialog on the page (the offer dialog's make). 編集を続ける is the default. */
function LeaveDialog({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  const baseId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const stay = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    stay.current?.focus();
  }, []);
  return (
    // Esc, like 編集を続ける, closes it and keeps the edits.
    <dialog
      ref={dialog}
      aria-labelledby={`${baseId}-title`}
      aria-describedby={`${baseId}-body`}
      onClose={onStay}
      className="m-auto w-[calc(100%-2rem)] max-w-[400px] rounded-2xl border-0 bg-canvas p-0 text-[0.875rem] leading-[1.6] text-ink shadow-[0_20px_60px_rgb(0_0_0/0.2)] backdrop:bg-ink/40"
    >
      <div className="px-4 pt-4 pb-3 md:px-5 md:pt-5">
        <h2 id={`${baseId}-title`} className="font-sans text-[0.9375rem] leading-normal font-extrabold tracking-normal">
          保存していない変更があります
        </h2>
        <p id={`${baseId}-body`} className="mt-1 text-ink-soft">
          保存せずに移動すると、この画面での変更は失われます。
        </p>
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-line px-4 py-3 md:px-5">
        <button
          type="button"
          onClick={() => {
            // Closed first: the page under a modal dialog cannot be clicked.
            dialog.current?.close();
            onLeave();
          }}
          className={LEAVE_BUTTON}
        >
          保存せずに移動
        </button>
        <button ref={stay} type="button" onClick={() => dialog.current?.close()} className={consoleButtonClass("primary")}>
          編集を続ける
        </button>
      </div>
    </dialog>
  );
}

/** プレビュー: the public page in a new tab once it is on the site (掲載中・審査待ち). A draft has nothing to show yet. */
function PreviewButton({ href, size }: { href: string | null; size: "sm" | "md" }) {
  if (!href) {
    return (
      <button type="button" disabled className={consoleButtonClass("secondary", size, DISABLED)}>
        保存後にプレビュー
      </button>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener" className={consoleButtonClass("secondary", size)}>
      プレビュー<span className="sr-only">（新しいタブで開く）</span>
    </a>
  );
}

/** 保存, only while something changed: a leaf pill floating at the bottom right on PC, a full-width band at the bottom on phones. */
function SaveBar({ dirty, saving, saved, onSave }: { dirty: boolean; saving: boolean; saved: boolean; onSave: () => void }) {
  const button = dirty || saving;
  const shown = button || saved;
  return (
    <div
      className={`sticky bottom-0 z-20 mt-4 md:pointer-events-none md:bottom-4 md:flex md:items-center md:justify-end md:gap-3 ${
        shown ? "-mx-4 -mb-6 border-t border-line bg-canvas/95 px-4 pt-2.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] backdrop-blur-sm md:mx-0 md:mb-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none" : ""
      }`}
    >
      <p role="status" className="text-center text-[0.78125rem] font-extrabold text-moss md:text-right">
        {saved ? (
          <span className={`inline-flex items-center gap-1 md:rounded-full md:bg-canvas md:px-3 md:py-1.5 md:shadow-[0_4px_16px_rgb(0_0_0/0.1)] ${button ? "pb-2 md:pb-1.5" : ""}`}>
            <HostIcon name="check" className="size-3.5" />
            保存しました
          </span>
        ) : null}
      </p>
      {button ? (
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="block h-12 w-full rounded-xl bg-leaf text-[0.9375rem] font-extrabold text-ink hover:bg-leaf-hover disabled:opacity-60 md:pointer-events-auto md:h-11 md:w-auto md:rounded-full md:px-6 md:shadow-[0_8px_24px_rgb(0_0_0/0.14)]"
        >
          {saving ? "保存中…" : "保存"}
        </button>
      ) : null}
    </div>
  );
}

export interface HostExperienceEditorProps {
  experience: HostExperience;
  /** The provider the page is NIHO's for (英語の下書きを作る's server action). */
  providerId: string;
  /** 迎える人: the provider's name and introduction (設定 › 提供者情報). */
  host: { name: string; bio: string };
  /** The day 掲載を申請 is dated (YYYY-MM-DD, JST). */
  today: string;
  /** The traveler site's origin (SITE_URL), for the page's public address. */
  siteUrl: string;
  backHref: string;
  settingsHref: string;
}

/**
 * 体験の編集 (#89, mock v2 `screenEditor`). The page text in the public order on the
 * left, 掲載 / 申込の設定 / ページ on the right (first on phones), and one 保存.
 *
 * A page written in Japanese (#110, the journey mock's H5) has two tabs over both columns:
 * 日本語で書く (the default) and 英語（公開）, with the English's state and NIHO's draft on top.
 * The header's title is the title in the language the page is written in.
 *
 * Mock mode only for now: 保存 keeps the page in this screen, photos stay in the browser
 * as object URLs, and 申請・停止・取り下げ change the state shown here. Going back to
 * the list starts again from the synthetic data (the preview note says nothing is kept).
 */
export function HostExperienceEditor({ experience, providerId, host, today, siteUrl, backHref, settingsHref }: HostExperienceEditorProps) {
  const [content, setContent] = useState<HostExperienceContent>(() => experienceContent(experience));
  const [saved, setSaved] = useState<HostExperienceContent>(content);
  const [listing, setListing] = useState<HostListing>(() => ({ status: experience.status, liveSince: experience.liveSince, requestedOn: experience.requestedOn }));
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ at: number } | null>(null);
  const [chosenTab, setTab] = useState<EditorTab>("ja");
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const dirty = useMemo(() => !sameContent(content, saved), [content, saved]);
  const requirements = useMemo(() => listingRequirements(content), [content]);
  const english = useMemo(() => pageEnglishState(content), [content]);
  const tab: EditorTab = english ? chosenTab : "en";
  const view = useMemo(() => contentInTab(content, tab), [content, tab]);
  const leaveGuard = useLeaveGuard(dirty);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), SAVED_NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const updateIn = useCallback((on: EditorTab, patch: Partial<HostExperienceContent>) => setContent((current) => changeInTab(current, on, patch)), []);
  const update = useCallback((patch: Partial<HostExperienceContent>) => updateIn(tab, patch), [tab, updateIn]);
  /** The header's title is always in the language the page is written in. */
  const updateTitle = (title: string) => updateIn(content.writingLanguage === "ja" ? "ja" : "en", { title });

  /** 英語の下書きを作る / 作り直す: NIHO's English of the Japanese as it is now. While NIHO drafts, the English is locked and the Japanese stays editable; nothing written is lost when it fails. */
  const draftEnglish = async (): Promise<boolean> => {
    const sent = content.japanese;
    if (!sent || drafting) return false;
    setDrafting(true);
    setDraftError("");
    try {
      const result = await draftPageEnglish({ providerId, experienceId: experience.id, japanese: sent });
      if (!result.ok) {
        setDraftError(result.message);
        return false;
      }
      setContent((current) => applyEnglishDraft(current, sent, result.english));
      return true;
    } catch {
      setDraftError(PAGE_ENGLISH_FAILED_TEXT);
      return false;
    } finally {
      setDrafting(false);
    }
  };

  const changeLanguage = (language: HostWritingLanguage) => {
    setDraftError("");
    if (language === "ja") {
      setContent(writeInJapanese);
      setTab("ja");
    } else {
      setContent(writeInEnglish);
    }
  };

  const save = async () => {
    const invalid = root.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>("input:invalid, textarea:invalid");
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    const kept = content;
    setSaving(true);
    setNotice(null);
    // Mock mode: nothing leaves the browser. TODO(#87): send the page with the
    // x-niho-page-updated-at it was read at; when NIHO answers that it changed since
    // (someone else saved), keep these edits, say so and offer to reload, never overwrite.
    await new Promise((resolve) => window.setTimeout(resolve, SAVE_DELAY_MS));
    setSaved(kept);
    setSaving(false);
    setNotice({ at: Date.now() });
  };

  const title = writtenTitle(content).trim() || content.title.trim() || "無題の体験";
  const changed = english && tab === "en" ? new Set(english.changed) : undefined;
  // English is locked while NIHO drafts it (the Japanese tab stays open to edit).
  const locked = drafting && tab === "en";
  const publicPath = `/experiences/${encodeURIComponent(experience.slug)}`;
  const previewHref = listing.status === "live" || listing.status === "review" ? publicPath : null;

  return (
    <div ref={root}>
      <HostSubHeader backHref={backHref} backLabel="体験" title={title} action={<PreviewButton href={previewHref} size="sm" />} />
      <HostPageBody>
        <h1 className="sr-only">{title}</h1>
        {/* PC: ‹, the title and プレビュー in one row. Phones: the title on its own; ‹ and プレビュー are in the header above. */}
        <div className="mb-3 flex items-center gap-3 md:mb-[18px]">
          <Link href={backHref} aria-label="体験へ戻る" className="grid size-10 shrink-0 place-items-center rounded-full bg-sand hover:bg-line max-md:hidden">
            <HostIcon name="chevronLeft" className="size-[18px]" />
          </Link>
          <input
            aria-label="題名"
            value={writtenTitle(content)}
            maxLength={EDITOR_LIMITS.title}
            placeholder="題名"
            onChange={(event) => updateTitle(event.currentTarget.value)}
            className="-ml-2 min-w-0 flex-1 rounded-[10px] border border-transparent bg-transparent px-2 py-1 text-[1.0625rem] leading-[1.3] font-extrabold text-ink placeholder:text-muted hover:bg-sand focus:border-line-strong focus:bg-canvas md:ml-0 md:px-2.5 md:py-1.5 md:text-[1.375rem]"
          />
          <div className="shrink-0 max-md:hidden">
            <PreviewButton href={previewHref} size="md" />
          </div>
        </div>
        {english ? <EditorLanguageTabs tab={tab} onTab={setTab} english={english} /> : null}
        {/* The same elements whatever the page is written in, so switching keeps the photos picked in this browser. */}
        <div id={english ? EDITOR_TAB_PANEL_ID : undefined} role={english ? "tabpanel" : undefined} aria-labelledby={english ? editorTabId(tab) : undefined} className="@container">
          {english && tab === "en" ? (
            <EnglishStatePanel
              english={english}
              drafting={drafting}
              error={draftError}
              canDraft={content.japanese !== null && textHasWords(content.japanese)}
              replaceCount={editsToReplace(content).length}
              onDraft={draftEnglish}
              onConfirm={() => {
                setDraftError("");
                setContent(confirmEnglish);
              }}
            />
          ) : null}
          {/* Two columns once the page is wide enough for the 320px rail; one column (rail first) below. */}
          <fieldset disabled={locked} aria-busy={locked || undefined} className={`m-0 min-w-0 border-0 p-0 ${locked ? "opacity-60" : ""}`}>
            <div className="flex flex-col gap-3.5 @3xl:grid @3xl:grid-cols-[minmax(0,1fr)_320px] @3xl:items-start @3xl:gap-5">
              <HostEditorContent content={view} update={update} host={host} settingsHref={settingsHref} lang={tab} englishTitle={english !== null && tab === "en"} changed={changed} />
              <HostEditorRail
                className="order-first @3xl:sticky @3xl:top-4 @3xl:order-none"
                listing={listing}
                requirements={requirements}
                dirty={dirty}
                consent={consent}
                onConsent={setConsent}
                actions={{
                  onSubmit: () => {
                    setListing((current) => submitListing(current, today));
                    setConsent(false);
                  },
                  onPause: () => setListing(pauseListing),
                  onWithdraw: () => setListing(withdrawListing),
                }}
                publicPath={publicPath}
                publicUrl={listing.status === "live" ? `${siteUrl}${publicPath}` : null}
                offers={view.offers}
                onOffers={(offers) => update({ offers })}
                lang={tab}
                offersMarker={changed?.has("offers") ? <ChangedMark /> : null}
                englishBehind={publicEnglishBehind(content, listing.status)}
                language={content.writingLanguage}
                onLanguage={changeLanguage}
                today={today}
              />
            </div>
          </fieldset>
        </div>
        <SaveBar dirty={dirty} saving={saving} saved={notice !== null} onSave={save} />
      </HostPageBody>
      {leaveGuard.asking ? <LeaveDialog onStay={leaveGuard.stay} onLeave={leaveGuard.leave} /> : null}
    </div>
  );
}
