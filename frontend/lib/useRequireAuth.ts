"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";

import { getSupabaseClientSafe } from "@/lib/supabase";

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseClientSafe();
    if (!supabase) {
      setSession(null);
      setLoading(false);
      router.replace(`/auth?mode=signin&next=${encodeURIComponent(pathname)}`);
      return () => {
        mounted = false;
      };
    }

    const ensureSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const nextSession = data.session ?? null;
      setSession(nextSession);
      setLoading(false);
      if (!nextSession) {
        router.replace(`/auth?mode=signin&next=${encodeURIComponent(pathname)}`);
      }
    };

    ensureSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession ?? null);
      if (!nextSession) {
        router.replace(`/auth?mode=signin&next=${encodeURIComponent(pathname)}`);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  return {
    loading,
    session,
    isAuthenticated: Boolean(session),
  };
}
