/**
 * A single, explicit representation for "the studio owner has not given us this
 * value yet". Nothing in this codebase invents an address, a price, a phone
 * number or a policy: unknown values are `null` and render as a visible
 * "belum diisi" state instead of a plausible-looking guess.
 */
export type Unset = null;

/** A value the owner still has to supply. */
export type Pending<T> = T | Unset;

export function isSet<T>(value: Pending<T>): value is T {
  return value !== null && value !== undefined && value !== "";
}

export function isUnset<T>(value: Pending<T>): value is Unset {
  return !isSet(value);
}

/** Standard label for an empty field, used everywhere so it reads the same. */
export const UNSET_LABEL = "Belum diisi";

/**
 * Marks a value that exists only so the booking demo can run end to end.
 * Anything wearing this flag is displayed with a "contoh" note in the UI and is
 * listed in README.md under "Data yang masih contoh".
 */
export type Provisional<T> = { value: T; provisional: true };

export function provisional<T>(value: T): Provisional<T> {
  return { value, provisional: true };
}
