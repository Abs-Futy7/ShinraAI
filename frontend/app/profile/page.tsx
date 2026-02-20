"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Mail, RefreshCw, ShieldCheck, UserCircle2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { getMetricsRuns, getMetricsSummary } from "@/lib/api";
import { getSupabaseClientSafe } from "@/lib/supabase";
import type { MetricsSummaryResponse } from "@/lib/types";
import { useRequireAuth } from "@/lib/useRequireAuth";

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function ProfilePage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useRequireAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<MetricsSummaryResponse | null>(null);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const supabase = getSupabaseClientSafe();
      if (!supabase) {
        throw new Error("Supabase client is not configured.");
      }

      const [{ data: userData }, summaryData, runsData] = await Promise.all([
        supabase.auth.getUser(),
        getMetricsSummary(),
        getMetricsRuns(1),
      ]);

      setUser(userData.user ?? null);
      setSummary(summaryData);
      setLastRunAt(runsData[0]?.created_at ?? null);
    } catch (err: any) {
      setError(err?.message || "Failed to load profile.");
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated]);

  const handleSignOut = async () => {
    const supabase = getSupabaseClientSafe();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
        <span className="ml-3 text-sm text-gray-500">Checking session...</span>
      </div>
    );
  }

  const headline = summary?.headline;
  const totalRuns = Number(headline?.total_runs ?? 0);
  const completedRuns = Number(headline?.completed_runs ?? 0);
  const completionRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-500">Account</p>
          <h1 className="mt-2 font-serif text-4xl text-primary-900">Profile</h1>
          <p className="mt-2 text-sm text-gray-600">Your identity and pipeline activity summary.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-sage-200 bg-white px-3 py-2 text-sm text-primary-700 hover:border-primary-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <Link
            href="/studio"
            className="inline-flex items-center rounded-lg border border-sage-200 bg-white px-3 py-2 text-sm text-primary-700 hover:border-primary-300"
          >
            Studio
          </Link>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
          >
            Sign Out
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-sage-100 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl text-primary-900">Identity</h2>
          {loading ? (
            <p className="mt-4 text-sm text-gray-500">Loading account...</p>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3">
                <UserCircle2 size={18} className="text-primary-600" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">User ID</p>
                  <p className="text-sm text-primary-900">{user?.id ?? "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-primary-600" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">Email</p>
                  <p className="text-sm text-primary-900">{user?.email ?? "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-primary-600" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">Email Verified</p>
                  <p className="text-sm text-primary-900">{user?.email_confirmed_at ? "Yes" : "No"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays size={18} className="text-primary-600" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">Account Created</p>
                  <p className="text-sm text-primary-900">{formatDate(user?.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays size={18} className="text-primary-600" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">Last Sign In</p>
                  <p className="text-sm text-primary-900">{formatDate(user?.last_sign_in_at)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-sage-100 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl text-primary-900">Activity</h2>
          {loading ? (
            <p className="mt-4 text-sm text-gray-500">Loading metrics...</p>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-sage-100 bg-paper p-4">
                <p className="text-xs uppercase tracking-wider text-gray-500">Total Runs</p>
                <p className="mt-2 font-serif text-2xl text-primary-900">{totalRuns}</p>
              </div>
              <div className="rounded-lg border border-sage-100 bg-paper p-4">
                <p className="text-xs uppercase tracking-wider text-gray-500">Completed Runs</p>
                <p className="mt-2 font-serif text-2xl text-primary-900">{completedRuns}</p>
              </div>
              <div className="rounded-lg border border-sage-100 bg-paper p-4">
                <p className="text-xs uppercase tracking-wider text-gray-500">Completion Rate</p>
                <p className="mt-2 font-serif text-2xl text-primary-900">{completionRate}%</p>
              </div>
              <div className="rounded-lg border border-sage-100 bg-paper p-4">
                <p className="text-xs uppercase tracking-wider text-gray-500">Last Run</p>
                <p className="mt-2 text-sm text-primary-900">{formatDate(lastRunAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
