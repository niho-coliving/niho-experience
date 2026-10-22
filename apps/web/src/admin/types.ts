import type { HostBooking } from "@/host/types";
import type { BookingSupportSnapshot } from "@/support/types";

export interface AdminHost {
  id: string;
  name: string;
  supportEnabled: boolean;
}

export interface AdminAuditEvent {
  at: string;
  actorId: string;
  actorName: string;
  action: "assigned" | "approved" | "declined" | "contacted" | "cancelled";
  detail: string;
}

export interface AdminBooking extends HostBooking {
  bookingNumber: string;
  hostId: string;
  hostName: string;
  experienceTitle: string;
  support: BookingSupportSnapshot;
  needsAttention: boolean;
  attentionReason: string;
  consultation: string;
  assignee: string | null;
  adminNotes: string;
  hostContact: string;
  guestContact: string;
  adminHistory: readonly AdminAuditEvent[];
}

export interface AdminActor {
  id: string;
  name: string;
}

export type AdminBookingAction = "approve" | "decline" | "contact" | "cancel";

