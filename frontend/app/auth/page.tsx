"use client";

import { Suspense } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { getSupabaseClientSafe } from "@/lib/supabase";

type AuthMode = "signin" | "signup" | "forgot" | "reset";

function toMode(value: string | null): AuthMode {
  if (value === "signup") return "signup";
  if (value === "forgot") return "forgot";
  if (value === "reset") return "reset";
  return "signin";
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <AuthPageContent />
    </Suspense>
  );
}

function AuthLoadingFallback() {
  return (
    <div className="mx-auto max-w-md py-10">
      <div className="rounded-2xl border border-sage-100 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
          <span className="ml-3 text-sm text-gray-500">Loading auth...</span>
        </div>
      </div>
    </div>
  );
}

function AuthPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = toMode(params.get("mode"));
  const nextPath = params.get("next") || "/studio";

  const supabase = useMemo(() => getSupabaseClientSafe(), []);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session && (mode === "signin" || mode === "signup")) {
        router.replace(nextPath);
      }
    });
    return () => {
      mounted = false;
    };
  }, [mode, nextPath, router, supabase]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (!supabase) {
        throw new Error("Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      }
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.replace(nextPath);
        return;
      }

      if (mode === "signup") {
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth?mode=signin`,
          },
        });
        if (signUpError) throw signUpError;
        setMessage("Signup successful. Check your email to verify your account.");
        return;
      }

      if (mode === "forgot") {
        const { error: forgotError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });
        if (forgotError) throw forgotError;
        setMessage("Password reset link sent. Check your inbox.");
        return;
      }

      if (mode === "reset") {
        if (!password || !confirmPassword) {
          throw new Error("Please fill both password fields.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        const { error: resetError } = await supabase.auth.updateUser({ password });
        if (resetError) throw resetError;
        setMessage("Password updated. You can now sign in.");
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="rounded-2xl border border-sage-100 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-500">Supabase Auth</p>
        <h1 className="mt-2 font-serif text-3xl text-primary-900">
          {mode === "signin" && "Sign In"}
          {mode === "signup" && "Create Account"}
          {mode === "forgot" && "Forgot Password"}
          {mode === "reset" && "Reset Password"}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {mode === "signin" && "Sign in to create and manage your private runs."}
          {mode === "signup" && "Create an account to enable per-user run ownership."}
          {mode === "forgot" && "Enter your email to receive a password reset link."}
          {mode === "reset" && "Set a new password for your account."}
        </p>

        {!supabase && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Supabase environment variables are missing. Configure frontend `.env.local` first.
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {(mode === "signin" || mode === "signup" || mode === "forgot") && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-600">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-sage-200 bg-paper px-3 py-2 text-sm outline-none focus:border-primary-500"
              />
            </div>
          )}

          {(mode === "signin" || mode === "signup" || mode === "reset") && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-600">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-sage-200 bg-paper px-3 py-2 text-sm outline-none focus:border-primary-500"
              />
            </div>
          )}

          {mode === "reset" && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-600">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-sage-200 bg-paper px-3 py-2 text-sm outline-none focus:border-primary-500"
              />
            </div>
          )}

          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {message && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {loading ? "Please wait..." : mode === "signin" ? "Sign In" : mode === "signup" ? "Sign Up" : mode === "forgot" ? "Send Reset Link" : "Update Password"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-sm text-gray-600">
          {mode !== "signin" && (
            <Link href={`/auth?mode=signin&next=${encodeURIComponent(nextPath)}`} className="block text-primary-700 hover:underline">
              Back to Sign In
            </Link>
          )}
          {mode === "signin" && (
            <>
              <Link href={`/auth?mode=signup&next=${encodeURIComponent(nextPath)}`} className="block text-primary-700 hover:underline">
                Need an account? Sign up
              </Link>
              <Link href="/auth?mode=forgot" className="block text-primary-700 hover:underline">
                Forgot password?
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
