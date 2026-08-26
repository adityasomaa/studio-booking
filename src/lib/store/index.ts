/**
 * Picks the data layer. Change STORE_MODE to "remote" once the backend in
 * src/lib/store/remote.ts is filled in.
 */
import { localBookingStore } from "@/lib/store/local";
import { remoteBookingStore } from "@/lib/store/remote";
import type { BookingStore } from "@/lib/store/types";

export const STORE_MODE: "local" | "remote" = "local";

export function bookingStore(): BookingStore {
  return STORE_MODE === "remote" ? remoteBookingStore() : localBookingStore();
}

export * from "@/lib/store/types";
