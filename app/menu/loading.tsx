import { MenuHero } from "@/components/menu/menu-hero";

export default function LoadingPage() {
  return (
    <main className='mx-auto max-w-md bg-white shadow-lg'>
      <div className="min-h-screen pb-12">
        <div className="relative h-56 w-full animate-pulse bg-gray-200">
          <div className="absolute bottom-4 left-4 space-y-2">
            <div className="h-5 w-36 rounded bg-white/40" />
            <div className="h-4 w-52 rounded bg-white/30" />
          </div>
        </div>
      </div>
    </main>
  );
}