import { Suspense } from "react";
import { CheckoutClient } from "@/features/checkout/checkout-client";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutClient />
    </Suspense>
  );
}
