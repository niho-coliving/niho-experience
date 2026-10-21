import type { HostSale } from "../types";

// Invented ledger lines for the preview month (October 2026).
export const MOCK_SALES_MONTH = { year: 2026, month: 10 } as const;

export const MOCK_KITCHEN_SALES: readonly HostSale[] = [
  { id: "sl-18c", date: "2026-10-18", kind: "sale", title: "Kamakura Community Dinner · Oliver Brown", detail: "体験サイト · Dinner 2名", amountYen: 60000 },
  { id: "sl-18b", date: "2026-10-18", kind: "sale", title: "Kamakura Community Dinner · Emma Larsson", detail: "体験サイト · Dinner 2名", amountYen: 60000 },
  { id: "sl-18a", date: "2026-10-18", kind: "sale", title: "Kamakura Community Dinner · Noah Williams", detail: "体験サイト · Dinner 1名", amountYen: 30000 },
  { id: "sl-12", date: "2026-10-12", kind: "refund", title: "返金 · Hannah Kim", detail: "体験サイト · 取消", amountYen: -60000 },
  { id: "sl-10", date: "2026-10-10", kind: "payout", title: "口座入金", detail: "Stripe · 10月1日〜9日分", amountYen: 171000 },
  { id: "sl-05", date: "2026-10-05", kind: "sale", title: "Kamakura Community Dinner · Hannah Kim", detail: "体験サイト · Dinner 2名", amountYen: 60000 },
  { id: "sl-04", date: "2026-10-04", kind: "sale", title: "Kamakura Community Dinner · Liam Walker", detail: "NIHO · Dinner 1名", amountYen: 30000 },
  { id: "sl-02", date: "2026-10-02", kind: "sale", title: "Kamakura Community Dinner · Aiko Tanaka", detail: "NIHO · tea time 2名", amountYen: 30000 },
];
