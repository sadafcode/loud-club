import type { Metadata } from "next";
import { ReturnsPortal } from "@/components/returns/returns-portal";

export const metadata: Metadata = {
  title: "Returns & exchanges",
  description: "Free 30-day returns and one-tap exchanges. Find your order, pick a reason, get a QR code.",
};

export default async function ReturnsPage({ searchParams }: PageProps<"/returns">) {
  const { order } = await searchParams;
  return <ReturnsPortal initialOrderId={typeof order === "string" ? order : undefined} />;
}
