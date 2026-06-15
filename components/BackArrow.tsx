import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackArrow({ href = "/menu" }: { href?: string }) {
  return (
    <Link href={href} className="flex shrink-0 items-center justify-center w-14 h-full hover:bg-neutral-100">
      <ArrowLeft className="h-5 w-5" />
    </Link>
  )
}