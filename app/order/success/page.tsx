import { OrderSuccessContent } from "@/components/order-success-content";

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <h1 className="text-xl font-bold">Payment received</h1>
        <p className="mt-2 text-sm text-gray-600">Missing order reference.</p>
      </main>
    );
  }

  return <OrderSuccessContent sessionId={session_id} />;
}