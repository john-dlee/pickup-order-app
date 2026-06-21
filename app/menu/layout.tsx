import CheckoutBar from "@/components/checkout-bar";

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <CheckoutBar />
    </>
  );
}