import { type Pending } from "@/lib/unset";

/**
 * Rooms / studios.
 *
 * One venue often has more than one room, each with a different backdrop, and a
 * slot is only really booked when a specific room is taken. The site works
 * correctly with a single entry in this list: the room selector collapses to a
 * fixed value and the schedule reads as one column.
 *
 * PROVISIONAL: the number of rooms, their names and what each one is set up for
 * have not been confirmed. Replace this file with the real list.
 */
export const ROOMS_PROVISIONAL = true;

export type Room = {
  id: string;
  /** Short label shown in the schedule and in the form. */
  name: string;
  /** One neutral line. Null until the studio describes the room. */
  description: Pending<string>;
  /** Backdrop or lighting notes. Null until confirmed. */
  features: string[];
  /** Generated placeholder graphic, see scripts/generate-graphics.mjs. */
  graphic: string;
};

export const ROOMS: Room[] = [
  {
    id: "ruang-1",
    name: "Ruang 1",
    description: null,
    features: [],
    graphic: "/graphics/room-ruang-1.svg",
  },
  {
    id: "ruang-2",
    name: "Ruang 2",
    description: null,
    features: [],
    graphic: "/graphics/room-ruang-2.svg",
  },
];

export function getRoom(id: string): Room | undefined {
  return ROOMS.find((room) => room.id === id);
}

export const DEFAULT_ROOM_ID = ROOMS[0]?.id ?? "";
