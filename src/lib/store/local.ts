/**
 * Browser-local implementation of BookingStore.
 *
 * This is the honest state of the project: bookings live in the visitor's own
 * browser so the whole flow can be demonstrated end to end. Two people on two
 * devices do not see each other's bookings. src/lib/store/remote.ts is the
 * empty shape a real database drops into.
 *
 * When the "preferences" cookie category is refused, nothing is written to
 * localStorage and the snapshot lives in memory for the life of the tab.
 */
import { currentConsent, subscribeConsent } from "@/lib/consent";
import type { Block, Booking, BookingStatus } from "@/lib/schedule";
import { buildSeed } from "@/lib/store/seed";
import {
  type BookingStore,
  type NewBlock,
  type NewBooking,
  type StoreSnapshot,
  makeId,
} from "@/lib/store/types";

const STORAGE_KEY = "studio-booking:v1";

function clone(snapshot: StoreSnapshot): StoreSnapshot {
  return {
    bookings: snapshot.bookings.map((b) => ({ ...b })),
    blocks: snapshot.blocks.map((b) => ({ ...b })),
  };
}

function canPersist(): boolean {
  if (typeof window === "undefined") return false;
  if (!currentConsent().preferences) return false;
  try {
    window.localStorage.setItem("__probe__", "1");
    window.localStorage.removeItem("__probe__");
    return true;
  } catch {
    return false;
  }
}

function parse(raw: string | null): StoreSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoreSnapshot>;
    if (!Array.isArray(parsed.bookings) || !Array.isArray(parsed.blocks)) return null;
    return { bookings: parsed.bookings as Booking[], blocks: parsed.blocks as Block[] };
  } catch {
    return null;
  }
}

class LocalBookingStore implements BookingStore {
  readonly name = "Penyimpanan lokal peramban";

  private snapshot: StoreSnapshot;
  private listeners = new Set<(snapshot: StoreSnapshot) => void>();

  constructor() {
    this.snapshot = buildSeed(new Date());
    if (typeof window !== "undefined") {
      const stored = canPersist() ? parse(window.localStorage.getItem(STORAGE_KEY)) : null;
      if (stored) this.snapshot = stored;

      window.addEventListener("storage", (event) => {
        if (event.key !== STORAGE_KEY) return;
        const next = parse(event.newValue);
        if (next) {
          this.snapshot = next;
          this.emit();
        }
      });

      subscribeConsent((consent) => {
        if (!consent.preferences) {
          try {
            window.localStorage.removeItem(STORAGE_KEY);
          } catch {
            /* storage unavailable, nothing to clear */
          }
        } else {
          this.persist();
        }
        // Tell the UI, so the admin page can report where data is living now.
        this.emit();
      });
    }
  }

  get isPersistent(): boolean {
    return canPersist();
  }

  read(): StoreSnapshot {
    return clone(this.snapshot);
  }

  private persist(): void {
    if (!canPersist()) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot));
    } catch {
      /* quota or private mode: the demo keeps working in memory */
    }
  }

  private emit(): void {
    const value = clone(this.snapshot);
    this.listeners.forEach((listener) => listener(value));
  }

  private commit(): void {
    this.persist();
    this.emit();
  }

  async createBooking(input: NewBooking): Promise<Booking> {
    const booking: Booking = {
      ...input,
      status: input.status ?? "pending",
      id: makeId("bk"),
      createdAt: Date.now(),
    };
    this.snapshot.bookings = [...this.snapshot.bookings, booking];
    this.commit();
    return booking;
  }

  async setBookingStatus(id: string, status: BookingStatus): Promise<void> {
    this.snapshot.bookings = this.snapshot.bookings.map((booking) =>
      booking.id === id ? { ...booking, status } : booking,
    );
    this.commit();
  }

  async createBlock(input: NewBlock): Promise<Block> {
    const block: Block = { ...input, id: makeId("blk"), createdAt: Date.now() };
    this.snapshot.blocks = [...this.snapshot.blocks, block];
    this.commit();
    return block;
  }

  async removeBlock(id: string): Promise<void> {
    this.snapshot.blocks = this.snapshot.blocks.filter((block) => block.id !== id);
    this.commit();
  }

  async reset(): Promise<StoreSnapshot> {
    this.snapshot = buildSeed(new Date());
    this.commit();
    return this.read();
  }

  subscribe(listener: (snapshot: StoreSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

let instance: LocalBookingStore | null = null;

export function localBookingStore(): BookingStore {
  if (!instance) instance = new LocalBookingStore();
  return instance;
}
