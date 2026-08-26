/**
 * Payment seam.
 *
 * This site has no payment gateway on purpose. If the studio takes a deposit it
 * is arranged over WhatsApp. The interface below is the empty layer an online
 * payment provider would be plugged into later, so adding one does not mean
 * taking the booking flow apart.
 *
 * The booking flow already calls requestPayment() and treats
 * "not-configured" as a normal, successful outcome.
 */
import { ONLINE_PAYMENT_ENABLED } from "@/config/studio";

export type PaymentRequest = {
  bookingId: string;
  /** Amount in the smallest currency unit. Null while prices are not set. */
  amount: number | null;
  currency: "IDR";
  description: string;
};

export type PaymentResult =
  | { status: "not-configured" }
  | { status: "redirect"; url: string }
  | { status: "failed"; message: string };

export interface PaymentAdapter {
  readonly id: string;
  requestPayment(request: PaymentRequest): Promise<PaymentResult>;
}

/** Does nothing, on purpose. */
export const noopPaymentAdapter: PaymentAdapter = {
  id: "none",
  async requestPayment(): Promise<PaymentResult> {
    return { status: "not-configured" };
  },
};

let adapter: PaymentAdapter = noopPaymentAdapter;

/** Call once at startup when a provider is added. */
export function registerPaymentAdapter(next: PaymentAdapter): void {
  adapter = next;
}

export async function requestPayment(request: PaymentRequest): Promise<PaymentResult> {
  if (!ONLINE_PAYMENT_ENABLED) return { status: "not-configured" };
  return adapter.requestPayment(request);
}
