"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const supabase = createSupabaseClient();

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;

      if (!data.session) {
        const next = encodeURIComponent(pathname);
        router.replace(`/admin/login?next=${next}`);
        return;
      }

      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        const next = encodeURIComponent(pathname);
        router.replace(`/admin/login?next=${next}`);
        setReady(false);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (!ready) {
    return (
      <main className="mx-auto p-4 text-center text-sm text-gray-600">
        Loading…
      </main>
    );
  }

  return children;
}
