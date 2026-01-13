import TableCheckoutInterface from "@/components/checkout-interface";
import { notFound } from "next/navigation";

interface CheckoutPageProps {
  params: Promise<{ tableId: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { tableId } = await params;

  if (!tableId) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TableCheckoutInterface tableId={tableId} />
    </div>
  );
}
