import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
});

export const metadata: Metadata = {
  title: "Sapporo Pickup",
  description: "Order online for pickup at Macarthur Square Sapporo Sushi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${quicksand.variable} h-full antialiased`}>
      <body className="min-h-screen bg-[#F9F6F0] flex justify-center m-0 font-sans font-normal">
        <CartProvider>
          <div className="w-full min-h-screen relative">
            {children}
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
