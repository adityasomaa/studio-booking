"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { BookingStatus } from "@/lib/schedule";
import { STORE_MODE, bookingStore } from "@/lib/store";
import type { NewBlock, NewBooking, StoreSnapshot } from "@/lib/store/types";

type StoreContextValue = {
  ready: boolean;
  storeName: string;
  storeMode: typeof STORE_MODE;
  isPersistent: boolean;
  bookings: StoreSnapshot["bookings"];
  blocks: StoreSnapshot["blocks"];
  createBooking: (input: NewBooking) => Promise<void>;
  setBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  createBlock: (input: NewBlock) => Promise<void>;
  removeBlock: (id: string) => Promise<void>;
  resetDemo: () => Promise<void>;
};

const EMPTY: StoreSnapshot = { bookings: [], blocks: [] };

const StoreContext = createContext<StoreContextValue>({
  ready: false,
  storeName: "",
  storeMode: STORE_MODE,
  isPersistent: false,
  bookings: [],
  blocks: [],
  createBooking: async () => {},
  setBookingStatus: async () => {},
  createBlock: async () => {},
  removeBlock: async () => {},
  resetDemo: async () => {},
});

/**
 * Bridges React to the data layer in src/lib/store.
 *
 * Everything starts empty on the server so the markup matches on hydration; the
 * real snapshot arrives in the first effect. `ready` tells the UI when to stop
 * showing skeletons.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<StoreSnapshot>(EMPTY);
  const [ready, setReady] = useState(false);
  const [meta, setMeta] = useState({ name: "", isPersistent: false });

  useEffect(() => {
    const store = bookingStore();
    setSnapshot(store.read());
    setMeta({ name: store.name, isPersistent: store.isPersistent });
    setReady(true);
    return store.subscribe((next) => {
      setSnapshot(next);
      setMeta({ name: store.name, isPersistent: store.isPersistent });
    });
  }, []);

  const createBooking = useCallback(async (input: NewBooking) => {
    await bookingStore().createBooking(input);
  }, []);

  const setBookingStatus = useCallback(async (id: string, status: BookingStatus) => {
    await bookingStore().setBookingStatus(id, status);
  }, []);

  const createBlock = useCallback(async (input: NewBlock) => {
    await bookingStore().createBlock(input);
  }, []);

  const removeBlock = useCallback(async (id: string) => {
    await bookingStore().removeBlock(id);
  }, []);

  const resetDemo = useCallback(async () => {
    await bookingStore().reset();
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      ready,
      storeName: meta.name,
      storeMode: STORE_MODE,
      isPersistent: meta.isPersistent,
      bookings: snapshot.bookings,
      blocks: snapshot.blocks,
      createBooking,
      setBookingStatus,
      createBlock,
      removeBlock,
      resetDemo,
    }),
    [
      ready,
      meta,
      snapshot,
      createBooking,
      setBookingStatus,
      createBlock,
      removeBlock,
      resetDemo,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useBookingStore(): StoreContextValue {
  return useContext(StoreContext);
}
