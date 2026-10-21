import { config } from "@/lib/config";
import { hostButtonClass, HOST_HEADING } from "@/components/host/host-ui";
import { HOST_HOME_PATH, HOST_INTRO_PATH } from "@/lib/host/routes";

export default function HostNotFound() {
  // Plain links: /host is the traveler site's root, and the console may be switched off.
  const href = config.hostConsoleEnabled ? HOST_HOME_PATH : HOST_INTRO_PATH;
  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className={`${HOST_HEADING} text-2xl`}>ページが見つかりません</h1>
      <p className="mt-3 text-ink-soft">URL が正しいかお確かめください。</p>
      <p className="mt-8">
        <a href={href} className={hostButtonClass("primary")}>{config.hostConsoleEnabled ? "ホストのホームへ" : "体験の提供について"}</a>
      </p>
    </main>
  );
}
