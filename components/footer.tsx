import Link from "next/link";

export function Footer() {
  return (
    <footer className="mx-auto max-w-md border-t px-4 py-4 text-xs text-gray-600">
      <p className="font-semibold text-gray-900">Sushi Sapporo</p>
      <p>Macarthur Square, 200 Gilchrist Dr, Campbelltown NSW 2560 </p>
      <p>
        <a href="tel:+61433887903">0433 887 903</a>
        {" · "}
        <a href="mailto:sushisapporomacarthur@gmail.com">sushisapporomacarthur@gmail.com</a>
      </p>
      <p className="mt-2">All prices in AUD.</p>
      <nav className="mt-3 flex flex-wrap gap-x-3 gap-y-1 underline">
        <Link className="text-sm font-medium" href="/policies">Policies</Link>
      </nav>
    </footer>
  )
}