import { type Pending } from "@/lib/unset";

/* -------------------------------------------------------------------------- */
/*  CONTACT                                                                    */
/*                                                                             */
/*  Nothing here is guessed. A public search for the studio was not possible    */
/*  because the studio has not been identified by name yet, so every field is   */
/*  null and the UI says so out loud. See README.md > "Riset kontak".           */
/* -------------------------------------------------------------------------- */

export const CONTACT = {
  /**
   * International format, digits only, no leading "+". Example shape:
   * "628123456789". Leave null until the owner confirms the number that is
   * actually published as the business contact.
   *
   * Can also be supplied at build time via NEXT_PUBLIC_WHATSAPP_NUMBER.
   */
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || null) as Pending<string>,

  /** Full street address, for the footer and for LocalBusiness structured data. */
  address: null as Pending<{
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  }>,

  /** Google Maps share link. */
  mapsUrl: null as Pending<string>,

  /** e.g. "https://instagram.com/..." */
  instagramUrl: null as Pending<string>,

  /** Public email, if the studio uses one. */
  email: null as Pending<string>,
} as const;

/* -------------------------------------------------------------------------- */
/*  TIME                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * IANA timezone of the studio, e.g. "Asia/Jakarta". While this is null the site
 * uses the visitor's own device clock, which is correct for local visitors and
 * off by the offset for anyone browsing from elsewhere.
 */
export const TIMEZONE: Pending<string> = null;

/**
 * Opening hours per weekday, 0 = Sunday .. 6 = Saturday. `null` means closed.
 * Times are "HH:MM" in the studio's local time.
 *
 * PROVISIONAL. These are placeholder hours so slot generation can be
 * demonstrated. They have not been confirmed by the studio owner.
 */
export const OPENING_HOURS_PROVISIONAL = true;

export const OPENING_HOURS: Record<number, { open: string; close: string } | null> = {
  0: { open: "10:00", close: "18:00" },
  1: { open: "10:00", close: "20:00" },
  2: { open: "10:00", close: "20:00" },
  3: { open: "10:00", close: "20:00" },
  4: { open: "10:00", close: "20:00" },
  5: { open: "10:00", close: "21:00" },
  6: { open: "09:00", close: "21:00" },
};

/* -------------------------------------------------------------------------- */
/*  BOOKING RULES                                                              */
/* -------------------------------------------------------------------------- */

export const BOOKING_RULES = {
  /**
   * Clean gap between two sessions in the same room, in minutes. Used both when
   * laying out the slot grid and when deciding whether a candidate slot
   * collides with an existing booking.
   */
  bufferMinutes: 15,

  /**
   * A slot cannot be booked if it starts sooner than this many hours from now.
   */
  minLeadTimeHours: 3,

  /** How far ahead the calendar lets people look. */
  maxAdvanceDays: 60,

  /** Upper bound accepted by the server for the "jumlah orang" field. */
  absoluteMaxPeople: 30,

  /** These three numbers are operational choices, not facts about the studio. */
  provisional: true,
} as const;

/* -------------------------------------------------------------------------- */
/*  POLICY                                                                     */
/*                                                                             */
/*  Cancellation and deposit terms are the most common source of disputes.      */
/*  They are deliberately empty. Do not fill these in with a guess.             */
/* -------------------------------------------------------------------------- */

export const POLICY = {
  /** e.g. "Pembatalan minimal 24 jam sebelum sesi." */
  cancellation: null as Pending<string>,

  /** e.g. "Uang muka 30% dari nilai paket." */
  deposit: null as Pending<string>,

  /** e.g. "Reschedule satu kali tanpa biaya." */
  reschedule: null as Pending<string>,

  /** e.g. "Keterlambatan lebih dari 15 menit memotong durasi sesi." */
  lateArrival: null as Pending<string>,
} as const;

/* -------------------------------------------------------------------------- */
/*  PAYMENT                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * There is no payment gateway on this site. Deposits, if the studio uses them,
 * are arranged over WhatsApp. See src/lib/payment/adapter.ts for the empty
 * seam that an online payment provider would slot into.
 */
export const ONLINE_PAYMENT_ENABLED = false;
