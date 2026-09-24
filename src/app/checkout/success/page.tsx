import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/checkout/order-confirmation";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const { order } = await searchParams;
  return <OrderConfirmation orderId={typeof order === "string" ? order : undefined} />;
}
