(() => {
  if (window.__nihoHostHistoryGuardInstalled) return;
  window.__nihoHostHistoryGuardInstalled = true;

  let restoringTraversal = null;

  function currentEntryIndex() {
    const index = window.navigation?.currentEntry?.index;
    return Number.isInteger(index) && index >= 0 ? index : null;
  }

  // Run before the App Router's popstate listener; it can unmount the editor before a
  // listener registered by the editor itself gets a chance to run.
  window.addEventListener("popstate", (event) => {
    const targetIndex = currentEntryIndex();

    if (restoringTraversal) {
      const restore = restoringTraversal;
      restoringTraversal = null;
      if (targetIndex === restore.currentIndex && window.location.href === restore.currentHref && restore.guard.dirty) {
        event.stopImmediatePropagation();
        restore.guard.onHistoryLeave(restore.delta);
        return;
      }
    }

    const guard = window.__nihoHostHistoryGuard;
    if (!guard?.dirty || guard.leaving || !guard.current || typeof guard.onHistoryLeave !== "function") return;

    const targetHref = window.location.href;
    const current = guard.current;
    const currentUrl = new URL(current.href);
    const targetUrl = new URL(targetHref);
    // A hash-only history entry stays in this editor.
    if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) return;

    event.stopImmediatePropagation();

    if (guard.current.index !== null && targetIndex !== null && guard.current.index !== targetIndex) {
      // Restore the entry that owns the dirty editor without inserting or deleting history
      // entries. The next popstate is ours to consume; discard later replays this delta.
      restoringTraversal = {
        guard,
        currentIndex: guard.current.index,
        currentHref: guard.current.href,
        delta: targetIndex - guard.current.index,
      };
      window.history.go(guard.current.index - targetIndex);
      return;
    }

    // Older browsers without the Navigation API retain the legacy fallback.
    window.history.pushState(current.state, "", current.href);
    guard.onHistoryLeave(-1);
  }, true);
})();
