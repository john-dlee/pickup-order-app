"use client";

import { useRouter } from "next/navigation";

const LAST_UPDATED = "17 July 2026"
export default function PoliciesPage() {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-md min-h-screen bg-white p-6 shadow-lg">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-md text-gray-600 underline"
      >
        Back
      </button>

      <h1 className="mt-4 text-2xl font-bold">Policies</h1>

      <h2 className="mt-4 text-xl font-bold">Pickup information</h2>
      <div className="mt-4 space-y-3 text-sm text-gray-700">
        <p>
          All orders are <strong>pickup only</strong>. We do not offer delivery.
        </p>
        <p>
          Payment is required before your order is prepared. Estimated ready time is{" "}
          <strong>5–15 minutes</strong> after payment.
        </p>
        <p>
          Collect your order at the counter using your <strong>name</strong> and{" "}
          <strong>order number</strong> shown on the confirmation screen.
        </p>
        <p>Online pickup ordering hours:</p>
        <ul className="list-disc pl-5">
          <li>Mon, Tue, Wed, Fri, Sat, Sun: 10:00am – 3:00pm</li>
          <li>Thu: 10:00am – 7:00pm</li>
        </ul>
        <p>All prices are in AUD.</p>
        <p>
          For food safety, all orders should be refrigerated as soon as possible and
          consumed within 3 hours of your designated pickup time. Orders not collected
          within 3 hours of the pickup time will be disposed of in line with food safety
          requirements, with no refund available.
        </p>
      </div>

      <h2 className="mt-4 text-xl font-bold">Privacy policy</h2>
      <div className="mt-4 space-y-3 text-sm text-gray-700">
        <p>
          Payments are processed securely through Stripe. 
          We do not store your card details on our servers, 
          and Stripe encrypts your payment information during processing.
        </p>
        <p>
          We collect your name, phone number, and email to process and confirm your order. 
          We do not share this information with third parties except Stripe, for payment processing. 
          We do not sell your personal information.
        </p>
      </div>

      <h2 className="mt-4 text-xl font-bold">Cancellation policy</h2>
      <div className="mt-4 space-y-3 text-sm text-gray-700">
        <p>
          Orders cannot be cancelled once submitted, as preparation begins immediately
          upon payment.
        </p>
      </div>

      <h2 className="mt-4 text-xl font-bold">Refund policy</h2>
      <div className="mt-4 space-y-3 text-sm text-gray-700">
        <p>
          No refunds for change of mind. Due to the perishable nature of our food, once
          payment is confirmed, orders cannot be cancelled or refunded if you simply
          change your mind.
        </p>
        <p>Refunds will be provided if:</p>
        <ul className="list-disc pl-5">
          <li>
            Your order was paid for but did not appear in our kitchen system, resulting
            in your order not being prepared or fulfilled.
          </li>
          <li>
            Your order was paid for but one or more items were unavailable due to
            insufficient stock, resulting in your order not being prepared or fulfilled.
          </li>
        </ul>
        <p>
          How to request a refund: Contact us or ask staff at the counter with your
          order confirmation and pickup time. If we confirm the order never reached our
          kitchen system, we will issue a full refund to your original payment method
          within 5–10 business days.
        </p>
      </div>

      <h2 className="mt-4 text-xl font-bold">Allergen disclaimer</h2>
      <div className="mt-4 space-y-3 text-sm text-gray-700">
        <p>
          We can accommodate allergen requests where possible, but due to shared
          kitchen equipment, cross-contamination may occur and we cannot guarantee any
          product is 100% allergen-free. If you have a food allergy, please ask our
          staff for ingredient information before ordering. To the extent permitted by
          law, we are not liable for adverse reactions where accurate allergen
          information was provided upon request.
        </p>
      </div>

      <h2 className="mt-4 text-xl font-bold">Order accuracy</h2>
      <div className="mt-4 space-y-3 text-sm text-gray-700">
        <p>
          Menu prices are subject to change without notice. The total order shown at
          checkout is final.
        </p>
      </div>

      <h2 className="mt-4 text-xl font-bold">Customer service contact</h2>
      <div className="mt-4 space-y-3 text-sm text-gray-700">
        <p>
          <a href="tel:+61433887903">0433 887 903</a>
        </p>
        <p>
          <a href="mailto:sushisapporomacarthur@gmail.com">
            sushisapporomacarthur@gmail.com
          </a>
        </p>
        <p>ABN: 58 663 525 755</p>
      </div>
      <p className="mt-4 space-y-3 text-sm text-gray-700">This website is operated by SUN'S KATSU HOUSE PTY LTD, trading as Sushi Sapporo.</p>
      <p className="mt-6 text-xs text-gray-400">
        Last updated: {LAST_UPDATED}
      </p>
    </main>
  );
}