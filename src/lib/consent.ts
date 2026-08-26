/**
 * Cookie consent.
 *
 * This is not a decorative banner. The choice is stored in a real cookie and it
 * actually changes behaviour:
 *
 *   necessary   always on. Nothing to switch.
 *   preferences when off, the booking demo keeps its data in memory only, so
 *               nothing survives a reload and localStorage stays empty.
 *   analytics   when off, the analytics loader never runs. Nothing is loaded
 *               today either way, and the hook is here so turning it on later
 *               still respects the choice.
 */
export const CONSENT_COOKIE = "sb_consent";
export const CONSENT_VERSION = 1;

export type ConsentCategory = "necessary" | "preferences" | "analytics";

export type Consent = {
  version: number;
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  decidedAt: number;
};

export const CONSENT_DEFAULT: Consent = {
  version: CONSENT_VERSION,
  necessary: true,
  preferences: false,
  analytics: false,
  decidedAt: 0,
};

export const CONSENT_ALL: Omit<Consent, "decidedAt" | "version"> = {
  necessary: true,
  preferences: true,
  analytics: true,
};

export const CONSENT_DETAILS: {
  id: ConsentCategory;
  label: string;
  description: string;
  locked: boolean;
}[] = [
  {
    id: "necessary",
    label: "Diperlukan",
    description:
      "Menyimpan pilihan cookie ini sendiri. Tanpa ini, pertanyaan ini muncul terus setiap kali halaman dibuka.",
    locked: true,
  },
  {
    id: "preferences",
    label: "Preferensi",
    description:
      "Menyimpan isian booking dan data demo di peramban Anda, sehingga tidak hilang saat halaman dimuat ulang. Jika dimatikan, data demo hanya bertahan selama tab ini terbuka.",
    locked: false,
  },
  {
    id: "analytics",
    label: "Statistik",
    description:
      "Menyiapkan izin untuk pengukuran kunjungan. Saat ini situs belum memuat alat statistik apa pun.",
    locked: false,
  },
];

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith(name + "="));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function writeCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 86_400_000).toUTCString();
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    name +
    "=" +
    encodeURIComponent(value) +
    "; Path=/; Expires=" +
    expires +
    "; SameSite=Lax" +
    secure;
}

export function readConsent(): Consent | null {
  const raw = readCookie(CONSENT_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Consent>;
    if (parsed.version !== CONSENT_VERSION) return null;
    return {
      version: CONSENT_VERSION,
      necessary: true,
      preferences: Boolean(parsed.preferences),
      analytics: Boolean(parsed.analytics),
      decidedAt: typeof parsed.decidedAt === "number" ? parsed.decidedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

const listeners = new Set<(consent: Consent) => void>();

export function writeConsent(next: Omit<Consent, "version" | "decidedAt" | "necessary">): Consent {
  const value: Consent = {
    version: CONSENT_VERSION,
    necessary: true,
    preferences: next.preferences,
    analytics: next.analytics,
    decidedAt: Date.now(),
  };
  writeCookie(CONSENT_COOKIE, JSON.stringify(value), 180);
  listeners.forEach((listener) => listener(value));
  return value;
}

export function clearConsent(): void {
  writeCookie(CONSENT_COOKIE, "", -1);
  listeners.forEach((listener) => listener(CONSENT_DEFAULT));
}

export function subscribeConsent(listener: (consent: Consent) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Effective consent right now. Denies by default until a choice is made. */
export function currentConsent(): Consent {
  return readConsent() ?? CONSENT_DEFAULT;
}
