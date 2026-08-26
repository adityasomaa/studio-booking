/**
 * Empty frame for a real backend.
 *
 * Nothing here is wired up. It exists so that connecting a database is a matter
 * of filling in these methods and flipping STORE_MODE in src/lib/store/index.ts,
 * without touching the booking form, the calendar or the conflict engine.
 *
 * Expected server contract, if you keep the shape below:
 *
 *   GET    /api/bookings              -> { bookings: Booking[], blocks: Block[] }
 *   POST   /api/bookings              -> Booking            (re-validates the slot)
 *   PATCH  /api/bookings/:id          -> { status }
 *   POST   /api/blocks                -> Block
 *   DELETE /api/blocks/:id            -> 204
 *
 * The server must run validateBooking() from src/lib/validation.ts against its
 * own copy of the data. The browser's opinion about availability is only ever a
 * hint.
 */
import type { BookingStatus } from "@/lib/schedule";
import type {
  BookingStore,
  NewBlock,
  NewBooking,
  StoreSnapshot,
} from "@/lib/store/types";

const NOT_WIRED = "Penyimpanan server belum tersambung. Lihat src/lib/store/remote.ts.";

class RemoteBookingStore implements BookingStore {
  readonly name = "Server (belum tersambung)";
  readonly isPersistent = true;

  read(): StoreSnapshot {
    return { bookings: [], blocks: [] };
  }

  async createBooking(_input: NewBooking): Promise<never> {
    throw new Error(NOT_WIRED);
  }

  async setBookingStatus(_id: string, _status: BookingStatus): Promise<never> {
    throw new Error(NOT_WIRED);
  }

  async createBlock(_input: NewBlock): Promise<never> {
    throw new Error(NOT_WIRED);
  }

  async removeBlock(_id: string): Promise<never> {
    throw new Error(NOT_WIRED);
  }

  async reset(): Promise<never> {
    throw new Error(NOT_WIRED);
  }

  subscribe(_listener: (snapshot: StoreSnapshot) => void): () => void {
    return () => {};
  }
}

export function remoteBookingStore(): BookingStore {
  return new RemoteBookingStore();
}
