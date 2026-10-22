import { applyAdminOperation, type AdminOperation } from "./bookings";
import { mockAdminBooking, MOCK_ADMIN_BOOKINGS, MOCK_ADMIN_NOW } from "./mock";
import type { AdminActor, AdminBooking } from "./types";

const MAX_SESSIONS = 128;
const MAX_COMPLETED_PER_SESSION = 256;

interface CompletedOperation {
  bookingId: string;
  fingerprint: string;
  booking: AdminBooking;
  message: string;
}

interface PreviewSessionState {
  bookings: Map<string, AdminBooking>;
  completed: Map<string, CompletedOperation>;
  expiresAt: number;
  touchedAt: number;
}

function fingerprint(operation: AdminOperation): string {
  if (operation.action !== "cancel") return JSON.stringify([operation.action, operation.reason.trim()]);
  const { refund, reason, message } = operation.cancellation;
  return JSON.stringify([operation.action, operation.reason.trim(), refund, reason, message.trim()]);
}

/** Bounded, process-local state behind the synthetic Admin preview. */
export class AdminPreviewStateStore {
  private readonly sessions = new Map<string, PreviewSessionState>();

  private prune(now: number) {
    for (const [id, state] of this.sessions) if (state.expiresAt <= now) this.sessions.delete(id);
    if (this.sessions.size <= MAX_SESSIONS) return;
    const oldest = [...this.sessions.entries()].sort((a, b) => a[1].touchedAt - b[1].touchedAt).slice(0, this.sessions.size - MAX_SESSIONS);
    for (const [id] of oldest) this.sessions.delete(id);
  }

  private stateFor(sessionId: string, expiresAt: number, now: number): PreviewSessionState {
    this.prune(now);
    let state = this.sessions.get(sessionId);
    if (!state) {
      if (this.sessions.size >= MAX_SESSIONS) {
        const oldest = [...this.sessions.entries()].sort((a, b) => a[1].touchedAt - b[1].touchedAt)[0];
        if (oldest) this.sessions.delete(oldest[0]);
      }
      state = { bookings: new Map(), completed: new Map(), expiresAt, touchedAt: now };
      this.sessions.set(sessionId, state);
    } else {
      state.expiresAt = Math.min(state.expiresAt, expiresAt);
      state.touchedAt = now;
    }
    return state;
  }

  bookings(sessionId: string, expiresAt: number, now = Date.now()): readonly AdminBooking[] {
    const state = this.stateFor(sessionId, expiresAt, now);
    return MOCK_ADMIN_BOOKINGS.map((booking) => state.bookings.get(booking.id) ?? booking);
  }

  run(sessionId: string, expiresAt: number, bookingId: string, idempotencyKey: string, operation: AdminOperation, actor: AdminActor, now = Date.now()) {
    const state = this.stateFor(sessionId, expiresAt, now);
    const operationFingerprint = fingerprint(operation);
    const prior = state.completed.get(idempotencyKey);
    if (prior) {
      if (prior.bookingId !== bookingId || prior.fingerprint !== operationFingerprint) return { ok: false as const, status: 409, message: "同じ操作キーが別の内容に使われました。画面を読み直してください。" };
      return { ok: true as const, booking: prior.booking, message: prior.message, repeated: true };
    }
    const booking = state.bookings.get(bookingId) ?? mockAdminBooking(bookingId);
    if (!booking) return { ok: false as const, status: 404, message: "予約が見つかりません。" };
    const result = applyAdminOperation(booking, operation, actor, MOCK_ADMIN_NOW);
    if (!result.ok) return { ok: false as const, status: result.code === "support_off" ? 403 : 409, message: result.message };
    state.bookings.set(bookingId, result.booking);
    state.completed.set(idempotencyKey, { bookingId, fingerprint: operationFingerprint, booking: result.booking, message: result.message });
    if (state.completed.size > MAX_COMPLETED_PER_SESSION) state.completed.delete(state.completed.keys().next().value!);
    return { ok: true as const, booking: result.booking, message: result.message, repeated: false };
  }
}
