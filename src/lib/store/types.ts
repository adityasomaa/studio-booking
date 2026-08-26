/**
 * Data access seam.
 *
 * There is no backend yet. Everything the site knows about bookings goes
 * through this interface, so swapping the browser-local implementation for a
 * real database is one file, not a rewrite of the booking flow.
 */
import type { Block, Booking, BookingStatus } from "@/lib/schedule";

export type StoreSnapshot = {
  bookings: Booking[];
  blocks: Block[];
};

export type NewBooking = Omit<Booking, "id" | "createdAt" | "status" | "seed"> & {
  status?: BookingStatus;
};

export type NewBlock = Omit<Block, "id" | "createdAt">;

export interface BookingStore {
  /** Human-readable name, shown in the admin page so nobody is fooled. */
  readonly name: string;
  /** False when data lives only in memory for this tab. */
  readonly isPersistent: boolean;

  read(): StoreSnapshot;
  createBooking(input: NewBooking): Promise<Booking>;
  setBookingStatus(id: string, status: BookingStatus): Promise<void>;
  createBlock(input: NewBlock): Promise<Block>;
  removeBlock(id: string): Promise<void>;
  /** Puts the demo back to its starting state. */
  reset(): Promise<StoreSnapshot>;
  /** Notifies on every change, including changes made in another tab. */
  subscribe(listener: (snapshot: StoreSnapshot) => void): () => void;
}

export function makeId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return prefix + "_" + random;
}
