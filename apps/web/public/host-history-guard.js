(() => {
  if (window.__nihoHostHistoryGuardInstalled) return;
  window.__nihoHostHistoryGuardInstalled = true;

  // Run before the App Router's popstate listener; it can unmount the editor before a
  // listener registered by the editor itself gets a chance to run.
  window.addEventListener("popstate", (event) => {
    const guard = window.__nihoHostHistoryGuard;
    if (!guard?.dirty || guard.leaving || !guard.current || typeof guard.onHistoryLeave !== "function") return;

    const targetHref = window.location.href;
    const current = guard.current;
    const currentUrl = new URL(current.href);
    const targetUrl = new URL(targetHref);
    // A hash-only history entry stays in this editor.
    if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) return;

    event.stopImmediatePropagation();
    window.history.pushState(current.state, "", current.href);
    guard.onHistoryLeave(targetHref);
  }, true);
})();
