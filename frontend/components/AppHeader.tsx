"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleUserRound } from "lucide-react";

import { getSupabaseClientSafe } from "@/lib/supabase";

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClientSafe();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onClickAway = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  const isAuthPage = pathname?.startsWith("/auth");
  const navItems = [
    { href: "/studio", label: "Studio" },
    { href: "/runs", label: "Runs" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  const isActiveNav = (href: string) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navClassName = (href: string) =>
    `text-xs tracking-widest uppercase hover:text-primary-700 ${
      isActiveNav(href)
        ? "font-bold text-primary-800 underline underline-offset-4 decoration-primary-500"
        : "font-semibold text-primary-500"
    }`;

  const handleSignOut = async () => {
    setMenuOpen(false);
    const supabase = getSupabaseClientSafe();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-paper/80 backdrop-blur-md border-b border-primary/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-serif font-semibold text-2xl text-primary-600 tracking-tight flex items-center gap-2">
          ShinraAI
        </Link>
        <div className="flex items-center gap-5">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={navClassName(item.href)}>
              {item.label}
            </Link>
          ))}
          {email ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary-200 bg-white/80 text-primary-700 hover:border-primary-300 hover:bg-white"
              >
                <CircleUserRound size={18} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-sage-200 bg-white shadow-lg">
                  <div className="border-b border-sage-100 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Signed In</p>
                    <p className="mt-1 truncate text-sm font-medium text-primary-900">{email}</p>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-primary-700 hover:bg-sage-50 hover:text-primary-900"
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="mt-1 w-full rounded-md bg-red-500/12 px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-500/20"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            !isAuthPage && (
              <>
                <Link href="/auth?mode=signin" className="text-xs font-semibold tracking-widest uppercase text-primary-600 hover:text-primary-800">
                  Sign In
                </Link>
                <Link href="/auth?mode=signup" className="text-xs font-semibold tracking-widest uppercase text-primary-600 hover:text-primary-800">
                  Sign Up
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
}
