/** Session timing shared by the server and the browser (#86). */

/** Refresh once less than this remains on the ID token. */
export const REFRESH_WINDOW_MS = 5 * 60 * 1000;
/** Never call NIHO with an ID token that has less than this left. */
export const ID_TOKEN_MIN_REMAINING_MS = 60 * 1000;
