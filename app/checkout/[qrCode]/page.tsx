import { CheckoutInterface } from "@/components/checkout-interface";
import { notFound } from "next/navigation";

interface CheckoutPageProps {
  params: Promise<{ qrCode: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { qrCode } = await params;

  if (!qrCode) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CheckoutInterface qrCode={qrCode} />
    </div>
  );
}