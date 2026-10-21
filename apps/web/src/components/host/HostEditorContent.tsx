"use client";

import Link from "next/link";
import { useEffect, useId, useRef, type ChangeEvent } from "react";
import { EDITOR_LIMITS, makeCover } from "@/host/editor";
import type { HostExperienceContent, HostExperienceMeeting, HostExperiencePhoto, HostTimelineStep } from "@/host/types";
import { AddRowButton, DISABLED, EditorPanel, FIELD_LABEL, LIST_INPUT, LIST_INPUT_SUB, LIST_INPUT_TIME, RemoveButton, SUB_HEADING, TextList, useFocusAfterRender } from "./editor-parts";
import { INPUT, TEXTAREA } from "./fields";
import { consoleButtonClass } from "./host-ui";
import { HostIcon } from "./HostIcon";
import { InitialAvatar } from "./ui";

type Update = (patch: Partial<HostExperienceContent>) => void;

/**
 * Photos picked in this browser, shown from object URLs until uploading arrives with
 * #87. The URLs are released when the editor closes.
 */
function useLocalPhotos(): (file: File) => HostExperiencePhoto {
  const created = useRef<{ urls: string[]; count: number }>({ urls: [], count: 0 });
  useEffect(() => {
    const local = created.current;
    return () => {
      for (const url of local.urls) URL.revokeObjectURL(url);
    };
  }, []);
  return (file) => {
    const url = URL.createObjectURL(file);
    created.current.urls.push(url);
    created.current.count += 1;
    return { id: `local-${created.current.count}`, url, alt: "" };
  };
}

function imagesOf(event: ChangeEvent<HTMLInputElement>): File[] {
  const files = Array.from(event.currentTarget.files ?? []).filter((file) => file.type.startsWith("image/"));
  // Picking the same file again should still add it.
  event.currentTarget.value = "";
  return files;
}

/** 写真: four to a row (three on phones); the first is the cover. */
function PhotosPanel({ photos, onChange, toPhoto }: { photos: readonly HostExperiencePhoto[]; onChange: (photos: HostExperiencePhoto[]) => void; toPhoto: (file: File) => HostExperiencePhoto }) {
  const baseId = useId();
  const input = useRef<HTMLInputElement>(null);
  const focusLater = useFocusAfterRender();
  const room = EDITOR_LIMITS.photos - photos.length;
  const pick = () => input.current?.click();
  const add = (event: ChangeEvent<HTMLInputElement>) => {
    const files = imagesOf(event).slice(0, Math.max(room, 0));
    if (files.length) onChange([...photos, ...files.map(toPhoto)]);
  };
  const removeId = (photo: HostExperiencePhoto) => `${baseId}-remove-${photo.id}`;
  const remove = (index: number) => {
    const next = photos.filter((_, other) => other !== index);
    const neighbour = next[Math.min(index, next.length - 1)];
    focusLater(neighbour ? removeId(neighbour) : `${baseId}-add`);
    onChange(next);
  };
  const cover = (index: number) => {
    const photo = photos[index];
    if (photo) focusLater(removeId(photo));
    onChange(makeCover(photos, index));
  };
  const addButton = (
    <button id={`${baseId}-add`} type="button" onClick={pick} disabled={room <= 0} className={consoleButtonClass("secondary", "sm", DISABLED)}>
      <HostIcon name="plus" className="size-3.5" />
      写真を追加
    </button>
  );
  return (
    <EditorPanel id="editor-photos" title="写真" actions={photos.length ? addButton : null}>
      {photos.length ? (
        <ul className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-2.5">
          {photos.map((photo, index) => (
            <li key={photo.id} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-sand">
              {/* Public sample paths and blob: previews of picked files, shown as they are. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.alt} className="size-full object-cover" />
              {index === 0 ? (
                <span className="absolute top-1 left-1 rounded-full bg-canvas/95 px-2 py-0.5 text-xs leading-normal font-extrabold md:top-2 md:left-2">表紙</span>
              ) : (
                // With a mouse it shows on hover or focus, so eight photos do not carry seven buttons; touch screens always show it.
                <button
                  type="button"
                  aria-label={`表紙にする（写真 ${index + 1}）`}
                  onClick={() => cover(index)}
                  className="absolute bottom-1 left-1 inline-flex h-6 items-center rounded-full bg-canvas/95 px-2 text-xs font-extrabold hover:bg-canvas md:bottom-2 md:left-2 pointer-fine:opacity-0 pointer-fine:group-focus-within:opacity-100 pointer-fine:group-hover:opacity-100"
                >
                  表紙にする
                </button>
              )}
              <button
                id={removeId(photo)}
                type="button"
                aria-label={`写真 ${index + 1} を外す`}
                onClick={() => remove(index)}
                className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-canvas/95 text-ink hover:bg-canvas md:top-2 md:right-2 md:size-[26px]"
              >
                <HostIcon name="close" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <button id={`${baseId}-add`} type="button" onClick={pick} className="flex h-[120px] w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong bg-sand font-extrabold text-ink-soft hover:text-ink">
          <HostIcon name="plus" className="size-4" />
          写真を追加
        </button>
      )}
      {room <= 0 ? <p className="mt-2 text-xs text-muted">写真は{EDITOR_LIMITS.photos}枚までです</p> : null}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={add} />
    </EditorPanel>
  );
}

/** 当日の流れ: a time, a title and a line per step. */
function TimelinePanel({ steps, onChange }: { steps: readonly HostTimelineStep[]; onChange: (steps: HostTimelineStep[]) => void }) {
  const baseId = useId();
  const focusLater = useFocusAfterRender();
  const { items, title: titleLength, text: textLength } = EDITOR_LIMITS.timeline;
  const full = steps.length >= items;
  const add = () => {
    focusLater(`${baseId}-${steps.length}-title`);
    onChange([...steps, { time: "", title: "", text: "" }]);
  };
  const remove = (index: number) => {
    const left = steps.length - 1;
    focusLater(left > 0 ? `${baseId}-${Math.min(index, left - 1)}-time` : `${baseId}-add`);
    onChange(steps.filter((_, other) => other !== index));
  };
  const change = (index: number, patch: Partial<HostTimelineStep>) => onChange(steps.map((step, other) => (other === index ? { ...step, ...patch } : step)));
  return (
    <EditorPanel
      id="editor-timeline"
      title="当日の流れ"
      actions={
        steps.length && !full ? (
          <button id={`${baseId}-add`} type="button" onClick={add} className={consoleButtonClass("secondary", "sm")}>
            <HostIcon name="plus" className="size-3.5" />
            段を足す
          </button>
        ) : null
      }
    >
      {steps.length ? (
        <ol>
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-2 border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0">
              <input
                id={`${baseId}-${index}-time`}
                aria-label={`当日の流れ ${index + 1} の時刻`}
                value={step.time}
                inputMode="numeric"
                placeholder="18:00"
                maxLength={5}
                pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                title="18:00 のように 24 時間で入力します"
                onChange={(event) => change(index, { time: event.currentTarget.value })}
                className={LIST_INPUT_TIME}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <input
                  id={`${baseId}-${index}-title`}
                  aria-label={`当日の流れ ${index + 1} の題`}
                  value={step.title}
                  maxLength={titleLength}
                  placeholder="題"
                  onChange={(event) => change(index, { title: event.currentTarget.value })}
                  className={LIST_INPUT}
                />
                <input
                  aria-label={`当日の流れ ${index + 1} の一言`}
                  value={step.text}
                  maxLength={textLength}
                  placeholder="一言"
                  onChange={(event) => change(index, { text: event.currentTarget.value })}
                  className={LIST_INPUT_SUB}
                />
              </div>
              <RemoveButton label={`当日の流れ ${index + 1} を削除`} onClick={() => remove(index)} />
            </li>
          ))}
        </ol>
      ) : (
        <AddRowButton id={`${baseId}-add`} label="段を足す" onClick={add} />
      )}
      {full ? <p className="mt-2 text-xs text-muted">段は{items}つまでです</p> : null}
    </EditorPanel>
  );
}

/** 集合場所: what the public page says, what booked guests receive, and the building's photo. */
function MeetingPanel({ meeting, onChange, toPhoto }: { meeting: HostExperienceMeeting; onChange: (meeting: HostExperienceMeeting) => void; toPhoto: (file: File) => HostExperiencePhoto }) {
  const input = useRef<HTMLInputElement>(null);
  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = imagesOf(event);
    if (file) onChange({ ...meeting, exteriorPhotoUrl: toPhoto(file).url });
  };
  return (
    <EditorPanel id="editor-meeting" title="集合場所">
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="editor-meeting-area" className={FIELD_LABEL}>
            公開する集合エリア
          </label>
          <input id="editor-meeting-area" value={meeting.area} maxLength={EDITOR_LIMITS.meetingArea} placeholder="例: Near Kamakura Station, 5-minute walk" onChange={(event) => onChange({ ...meeting, area: event.currentTarget.value })} className={INPUT} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="editor-meeting-entrance" className={FIELD_LABEL}>
            入口の案内（予約確定後）
          </label>
          <textarea id="editor-meeting-entrance" rows={3} value={meeting.entrance} maxLength={EDITOR_LIMITS.entrance} onChange={(event) => onChange({ ...meeting, entrance: event.currentTarget.value })} className={TEXTAREA} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span id="editor-meeting-exterior" className={FIELD_LABEL}>
            外観写真
          </span>
          <div role="group" aria-labelledby="editor-meeting-exterior" className="flex flex-wrap items-center gap-3">
            {meeting.exteriorPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- a public sample path or a blob: preview
              <img src={meeting.exteriorPhotoUrl} alt="" className="h-20 w-[120px] rounded-[10px] bg-sand object-cover" />
            ) : null}
            <button type="button" aria-label={meeting.exteriorPhotoUrl ? "外観写真を変更" : undefined} onClick={() => input.current?.click()} className={consoleButtonClass("secondary", "sm")}>
              {meeting.exteriorPhotoUrl ? (
                "変更"
              ) : (
                <>
                  <HostIcon name="plus" className="size-3.5" />
                  写真を選ぶ
                </>
              )}
            </button>
            <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
          </div>
        </div>
      </div>
    </EditorPanel>
  );
}

/**
 * The left column (mock v2 `.content`): one panel per section, in the order the public
 * page shows them. Everything here is kept by 保存.
 */
export function HostEditorContent({ content, update, host, settingsHref }: { content: HostExperienceContent; update: Update; host: { name: string; bio: string }; settingsHref: string }) {
  const toPhoto = useLocalPhotos();
  const { list, highlights, knowBeforeYouGo } = EDITOR_LIMITS;
  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      <PhotosPanel photos={content.photos} onChange={(photos) => update({ photos })} toPhoto={toPhoto} />

      <EditorPanel id="editor-lead" title="ひとこと紹介">
        <textarea aria-labelledby="editor-lead" rows={3} value={content.lead} maxLength={EDITOR_LIMITS.lead} onChange={(event) => update({ lead: event.currentTarget.value })} className={TEXTAREA} />
      </EditorPanel>

      <EditorPanel id="editor-day-language" title="当日の言語">
        <input aria-labelledby="editor-day-language" value={content.dayLanguage} maxLength={EDITOR_LIMITS.dayLanguage} placeholder="例: English and Japanese" onChange={(event) => update({ dayLanguage: event.currentTarget.value })} className={`${INPUT} md:max-w-[240px]`} />
      </EditorPanel>

      <EditorPanel id="editor-highlights" title="見どころ">
        <TextList label="見どころ" values={content.highlights} max={highlights.items} maxLength={highlights.length} onChange={(values) => update({ highlights: values })} />
      </EditorPanel>

      <EditorPanel id="editor-description" title="詳しい説明">
        <textarea aria-labelledby="editor-description" rows={5} value={content.description} maxLength={EDITOR_LIMITS.description} onChange={(event) => update({ description: event.currentTarget.value })} className={TEXTAREA} />
      </EditorPanel>

      <EditorPanel id="editor-included" title="含まれるもの・含まれないもの">
        {/* Two columns once the panel is wide enough (PC), one on phones. */}
        <div className="@container">
          <div className="grid gap-4 @lg:grid-cols-2 @lg:gap-5">
            <div className="min-w-0">
              <h3 className={SUB_HEADING}>含まれるもの</h3>
              <TextList label="含まれるもの" values={content.included} max={list.items} maxLength={list.length} onChange={(values) => update({ included: values })} />
            </div>
            <div className="min-w-0">
              <h3 className={SUB_HEADING}>含まれないもの</h3>
              <TextList label="含まれないもの" values={content.notIncluded} max={list.items} maxLength={list.length} onChange={(values) => update({ notIncluded: values })} />
            </div>
          </div>
        </div>
      </EditorPanel>

      <EditorPanel id="editor-not-suitable" title="向かない人">
        <TextList label="向かない人" values={content.notSuitableFor} max={list.items} maxLength={list.length} onChange={(values) => update({ notSuitableFor: values })} />
      </EditorPanel>

      <TimelinePanel steps={content.timeline} onChange={(timeline) => update({ timeline })} />

      <MeetingPanel meeting={content.meeting} onChange={(meeting) => update({ meeting })} toPhoto={toPhoto} />

      <EditorPanel id="editor-know" title="注意事項">
        <TextList label="注意事項" values={content.knowBeforeYouGo} max={knowBeforeYouGo.items} maxLength={knowBeforeYouGo.length} onChange={(values) => update({ knowBeforeYouGo: values })} />
      </EditorPanel>

      {/* The host's name and introduction live in 設定 › 提供者情報, shared by every experience. */}
      <EditorPanel id="editor-host" title="迎える人">
        <div className="flex flex-wrap items-start gap-3">
          <InitialAvatar name={host.name} className="size-11 text-base" />
          <div className="min-w-0 flex-1 basis-40">
            <p className="font-extrabold [overflow-wrap:anywhere]">{host.name}</p>
            <p className="mt-0.5 text-[0.8125rem] text-ink-soft [overflow-wrap:anywhere]">{host.bio || "紹介はまだありません。"}</p>
          </div>
          <Link href={settingsHref} className="inline-flex min-h-6 items-center gap-0.5 text-[0.78125rem] font-extrabold text-ink-soft hover:text-ink">
            紹介を編集
            <HostIcon name="chevronRight" className="size-3.5" />
          </Link>
        </div>
      </EditorPanel>
    </div>
  );
}
